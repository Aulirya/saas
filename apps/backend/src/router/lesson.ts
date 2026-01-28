import { DateTime, RecordId, surql, Surreal, Table } from "surrealdb";
import { base } from "./base";
import type { LessonModel } from "../repository/model/lessons";
import { LessonMapper } from "../repository/mapper/lesson";
import z from "zod";
import { parseRecordId } from "../utils/record-id";
import { lesson_create_input, lesson_patch_input, type Lesson } from "shared";
import { ORPCError } from "@orpc/server";

// ------- HELPERS -------
// Helper function to create user RecordId
const getUserRecordId = (userId: string): RecordId =>
  new RecordId("users", userId);

// Helper function to verify lesson ownership
async function verifyLessonOwnership(
  db: Surreal,
  lessonId: RecordId,
  userId: RecordId,
): Promise<LessonModel> {
  const query = surql`
        SELECT * FROM lessons 
        WHERE id = ${lessonId} 
        AND user_id = ${userId}
    `;
  const result = await db.query<[LessonModel[]]>(query).collect();
  const lesson = result[0]?.[0];

  if (!lesson) {
    throw new ORPCError("NOT_FOUND", {
      message:
        "Leçon non trouvée ou vous n'avez pas l'autorisation d'y accéder",
    });
  }

  return lesson;
}

// ------- ENDPOINTS GET -------
export const listLessons = base.handler(
  async ({ context }): Promise<Lesson[]> => {
    const userId = getUserRecordId(context.user_id);
    const query = surql`SELECT * FROM lessons WHERE user_id = ${userId}`;
    const lessonsModel = await context.db
      .query<[LessonModel[]]>(query)
      .collect();
    const lessons = lessonsModel[0].map(LessonMapper.fromModel);
    return lessons;
  },
);

export const getLesson = base
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }): Promise<Lesson> => {
    const userId = getUserRecordId(context.user_id);
    const lessonId = parseRecordId(input.id, "lessons");

    const lesson = await verifyLessonOwnership(context.db, lessonId, userId);

    return LessonMapper.fromModel(lesson);
  });

// ------- ENDPOINTS POST -------
export const createLesson = base
  .input(lesson_create_input)
  .handler(async ({ input, context }): Promise<Lesson> => {
    const userId = getUserRecordId(context.user_id);
    const subjectId = parseRecordId(input.subject_id, "subjects");
    const lessonsTable = new Table("lessons");

    // Check if a lesson with the same label already exists for this subject and user
    const checkQuery = surql`
            SELECT * FROM lessons 
            WHERE user_id = ${userId} 
            AND subject_id = ${subjectId} 
            AND label = ${input.label}
        `;

    // à gérer dans la db surreal si après sondage les profs ont des nom uniques pour les leçons
    const existingLessons = await context.db
      .query<[LessonModel[]]>(checkQuery)
      .collect();

    if (existingLessons[0] && existingLessons[0].length > 0) {
      throw new ORPCError("INVALID_REQUEST", {
        message: "Une leçon avec ce nom existe déjà pour cette matière",
      });
    }

    // If order is not provided, compute next order for this subject (number of lessons + 1)
    let nextOrder: number | undefined = input.order;
    if (nextOrder === undefined) {
      const query = surql`SELECT count() AS lesson_count FROM lessons WHERE subject_id = ${subjectId} GROUP ALL`;
      const resultCount = await context.db
        .query<[Array<{ lesson_count: number }>]>(query)
        .collect();
      const lessonCount = resultCount[0][0]?.lesson_count ?? 0;

      nextOrder = lessonCount + 1;
    }

    try {
      const result = await context.db
        .create<LessonModel>(lessonsTable)
        .content({
          label: input.label,
          subject_id: subjectId,
          user_id: userId,
          order: nextOrder,
          duration: input.duration ?? 60,
          status: input.status ?? "to_do",
          scope: input.scope ?? "core",
          comments:
            input.comments === undefined
              ? []
              : input.comments.map((comment) => ({
                  title: comment.title,
                  description: comment.description,
                  created_at: new DateTime(),
                  updated_at: new DateTime(),
                })),
          description: input.description,
        });
      const lesson = LessonMapper.fromModel(result[0]);
      return lesson;
    } catch (e) {
      console.error("error in createLesson: ", e);
      throw new ORPCError("DATABASE_ERROR", {
        message: "Erreur lors de la création de la leçon",
      });
    }
  });

// ------- ENDPOINTS PATCH -------
export const patchLesson = base
  .input(lesson_patch_input)
  .handler(async ({ input, context }): Promise<Lesson> => {
    const userId = getUserRecordId(context.user_id);
    const lessonId = parseRecordId(input.id, "lessons");

    // Verify lesson ownership before updating
    await verifyLessonOwnership(context.db, lessonId, userId);

    const updateData: Partial<LessonModel> = {
      ...(input.label !== undefined && { label: input.label }),
      ...(input.duration !== undefined && { duration: input.duration }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.scope !== undefined && { scope: input.scope }),
      ...(input.order !== undefined && { order: input.order }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.subject_id !== undefined && {
        subject_id: parseRecordId(input.subject_id, "subjects"),
      }),
      ...(input.comments !== undefined && {
        comments: input.comments.map((comment) => ({
          title: comment.title,
          description: comment.description,
          created_at: new DateTime(),
          updated_at: new DateTime(),
        })),
      }),
    };

    updateData.updated_at = new DateTime();

    try {
      const result = await context.db
        .update<LessonModel>(lessonId)
        .merge(updateData);

      if (!result) {
        throw new ORPCError("DATABASE_ERROR", {
          message: "Erreur lors de la mise à jour de la leçon",
        });
      }

      const lesson = LessonMapper.fromModel(result);
      return lesson;
    } catch (e) {
      if (e instanceof ORPCError) {
        throw e; // Preserve existing ORPCErrors
      }
      console.error("error in patchLesson: ", e);
      throw new ORPCError("DATABASE_ERROR", {
        message: "Erreur lors de la mise à jour de la leçon",
      });
    }
  });

export const reorderLesson = base
  .input(
    z.object({
      lesson_id: z.string(),
      target_lesson_id: z.string(),
      subject_id: z.string(),
    }),
  )
  .handler(async ({ input, context }): Promise<{ success: boolean }> => {
    const userId = getUserRecordId(context.user_id);
    const lessonId = parseRecordId(input.lesson_id, "lessons");
    const targetLessonId = parseRecordId(input.target_lesson_id, "lessons");
    const subjectId = parseRecordId(input.subject_id, "subjects");

    // Get both lessons to verify they exist, belong to the user, and are in the same subject
    const lessonQuery = surql`
            SELECT * FROM lessons 
            WHERE id IN [${lessonId}, ${targetLessonId}]
            AND user_id = ${userId}
            AND subject_id = ${subjectId}
        `;

    const lessonsResult = await context.db
      .query<[LessonModel[]]>(lessonQuery)
      .collect();

    const lessons = lessonsResult[0];

    if (!lessons || lessons.length !== 2) {
      throw new ORPCError("NOT_FOUND", {
        message:
          "One or both lessons not found or not in the specified subject",
      });
    }

    // Find the specific lessons by comparing RecordId objects
    const lesson = lessons.find((l) => l.id.equals(lessonId));
    const targetLesson = lessons.find((l) => l.id.equals(targetLessonId));

    if (!lesson || !targetLesson) {
      throw new ORPCError("NOT_FOUND", {
        message:
          "One or both lessons not found or not in the specified subject",
      });
    }

    // Swap the orders (ensure missing orders are assigned first)
    let lessonOrder = lesson.order ?? null;
    let targetOrder = targetLesson.order ?? null;

    if (lessonOrder === null || targetOrder === null) {
      const maxOrderQuery = surql`
                SELECT math::max(order ?? 0) AS max_order
                FROM lessons
                WHERE user_id = ${userId}
                AND subject_id = ${subjectId}
                GROUP ALL
            `;
      const maxOrderResult = await context.db
        .query<[Array<{ max_order: number }>]>(maxOrderQuery)
        .collect();
      let nextOrder = (maxOrderResult[0]?.[0]?.max_order ?? 0) + 1;

      if (lessonOrder === null) {
        lessonOrder = nextOrder;
        nextOrder += 1;
      }

      if (targetOrder === null) {
        targetOrder = nextOrder;
      }
    }

    try {
      // Update both lessons
      await context.db.update<LessonModel>(lessonId).merge({
        order: targetOrder,
        updated_at: new DateTime(),
      });

      await context.db.update<LessonModel>(targetLessonId).merge({
        order: lessonOrder,
        updated_at: new DateTime(),
      });

      return { success: true };
    } catch (e) {
      console.error("Error reordering lessons:", e);
      throw new ORPCError("DATABASE_ERROR", {
        message: "Erreur lors du réordonnancement des leçons",
      });
    }
  });

// ------- ENDPOINTS DELETE -------
export const deleteLesson = base
  .input(
    z.object({
      id: z.string(),
      order: z.number().nullable().optional(),
      subject_id: z.string(),
    }),
  )
  .handler(async ({ input, context }): Promise<{ success: boolean }> => {
    const userId = getUserRecordId(context.user_id);
    const lessonId = parseRecordId(input.id, "lessons");
    const subjectId = parseRecordId(input.subject_id, "subjects");

    await verifyLessonOwnership(context.db, lessonId, userId);

    try {
      await context.db.delete(lessonId);

      // Update orders of lessons that come after the deleted one
      if (input.order !== null && input.order !== undefined) {
        const updateQuery = surql`
                    UPDATE lessons
                    SET order = (order ?? 0) - 1
                    WHERE user_id = ${userId}
                    AND subject_id = ${subjectId}
                    AND order > ${input.order}
                `;

        await context.db.query(updateQuery);
      }

      return { success: true };
    } catch (e) {
      console.error("Error deleting lesson:", e);
      throw new ORPCError("DATABASE_ERROR", {
        message: "Erreur lors de la suppression de la leçon",
      });
    }
  });
