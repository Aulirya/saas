import { DateTime, RecordId, surql, Table } from "surrealdb";
import { base } from "./base";
import type { LessonModel } from "../repository/model/lessons";
import { LessonMapper } from "../repository/mapper/lesson";
import z from "zod";
import { parseRecordId } from "../utils/record-id";
import {
    lesson_create_input,
    lesson_patch_input,
    type Lesson,
} from "@saas/shared";

export const listLessons = base.handler(
    async ({ context }): Promise<Lesson[]> => {
        const userId = new RecordId("users", context.user_id);
        const query = surql`SELECT * FROM lessons WHERE user_id = ${userId}`;
        const classesModel = await context.db
            .query<[LessonModel[]]>(query)
            .collect();
        const classes = classesModel[0].map(LessonMapper.fromModel);
        return classes;
    }
);

export const getLesson = base
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }): Promise<Lesson> => {
        const userId = new RecordId("users", context.user_id);
        const query = surql`SELECT * FROM lessons WHERE user_id = ${userId} AND id = ${input.id}`;
        const classesModel = await context.db
            .query<[LessonModel[]]>(query)
            .collect();
        const classes = classesModel[0].map(LessonMapper.fromModel);
        return classes[0];
    });

export const createLesson = base
    .input(lesson_create_input)
    .handler(async ({ input, context }): Promise<Lesson> => {
        const userId = new RecordId("users", context.user_id);
        const subjectId = parseRecordId(input.subject_id, "subjects");
        const lessonsTable = new Table("lessons");

        // Check if a lesson with the same label already exists for this subject and user
        const checkQuery = surql`
            SELECT * FROM lessons 
            WHERE user_id = ${userId} 
            AND subject_id = ${subjectId} 
            AND label = ${input.label}
        `;
        const existingLessons = await context.db
            .query<[LessonModel[]]>(checkQuery)
            .collect();

        if (existingLessons[0] && existingLessons[0].length > 0) {
            throw new Error(
                "Une leçon avec ce nom existe déjà pour cette matière"
            );
            console.log("here");
        }

        // If order is not provided, compute next order for this subject
        let nextOrder: number | undefined = input.order;
        if (nextOrder === undefined) {
            const query = surql`SELECT math::max(order ?? 0) AS max_order FROM lessons WHERE subject_id = ${subjectId}`;
            const resultMax = await context.db
                .query<[Array<{ max_order: number | null }>]>(query)
                .collect();
            const maxOrder = resultMax[0][0]?.max_order ?? 0;
            nextOrder = maxOrder + 1;
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
                                  description: input.description,
                                  created_at: new DateTime(),
                                  updated_at: new DateTime(),
                              })),
                    description: input.description,
                });
            const lesson = LessonMapper.fromModel(result[0]);
            return lesson;
        } catch (e) {
            // If it's a duplicate error from the database, provide a user-friendly message
            if (
                e instanceof Error &&
                (e.message.includes("duplicate") ||
                    e.message.includes("already exists") ||
                    e.message.includes("unique"))
            ) {
                throw new Error(
                    "Une leçon avec ce nom existe déjà pour cette matière"
                );
            }
            throw e;
        }
    });

export const patchLesson = base
    .input(lesson_patch_input)
    .handler(async ({ input, context }): Promise<Lesson> => {
        console.log("=== PATCH LESSON START ===");
        console.log("Input received:", JSON.stringify(input, null, 2));
        console.log("Input ID:", input.id);
        console.log("Input ID type:", typeof input.id);

        // Parse the ID - handle both full record ID and just the ID part
        let lessonId: RecordId;
        if (input.id.includes(":")) {
            // Full record ID like "lessons:lesson_001"
            const [table, recordId] = input.id.split(":", 2);
            console.log(
                "Parsing full record ID - table:",
                table,
                "recordId:",
                recordId
            );
            lessonId = new RecordId(table, recordId);
        } else {
            // Just the ID part
            console.log("Using ID as-is with 'lessons' table");
            lessonId = new RecordId("lessons", input.id);
        }
        console.log("Parsed lessonId:", lessonId.toString());

        const updateData: Partial<LessonModel> = {};

        if (input.label !== undefined) {
            console.log("Updating label:", input.label);
            updateData.label = input.label;
        }
        if (input.duration !== undefined) {
            console.log("Updating duration:", input.duration);
            updateData.duration = input.duration;
        }
        // Handle order update with swap logic to ensure uniqueness
        if (input.order !== undefined) {
            console.log("Updating order:", input.order);

            // Get current lesson to know its current order and subject
            const currentLessonQuery = surql`SELECT * FROM ${lessonId} LIMIT 1`;
            const currentLessonResult = await context.db
                .query<[LessonModel[]]>(currentLessonQuery)
                .collect();

            if (
                !currentLessonResult[0] ||
                currentLessonResult[0].length === 0
            ) {
                console.error("ERROR: Lesson not found for order swap");
                throw new Error(`Lesson not found: ${lessonId.toString()}`);
            }

            const currentLesson = currentLessonResult[0][0];
            const currentOrder = currentLesson.order;
            const subjectId = currentLesson.subject_id;

            console.log("Current lesson order:", currentOrder);
            console.log("New order:", input.order);
            console.log("Subject ID:", subjectId.toString());

            // If order is changing, check if another lesson has this order
            if (currentOrder !== input.order) {
                // Find lesson with the target order in the same subject
                const conflictQuery = surql`
                    SELECT * FROM lessons 
                    WHERE subject_id = ${subjectId} 
                    AND order = ${input.order} 
                    AND id != ${lessonId}
                    LIMIT 1
                `;
                const conflictResult = await context.db
                    .query<[LessonModel[]]>(conflictQuery)
                    .collect();

                if (conflictResult[0] && conflictResult[0].length > 0) {
                    // Another lesson has this order - swap them
                    const conflictingLesson = conflictResult[0][0];
                    const conflictingLessonId = conflictingLesson.id;

                    console.log("Order conflict detected! Swapping orders...");
                    console.log(
                        "Conflicting lesson ID:",
                        conflictingLessonId.toString()
                    );
                    console.log(
                        "Swapping: lesson",
                        lessonId.toString(),
                        "order",
                        currentOrder,
                        "with lesson",
                        conflictingLessonId.toString(),
                        "order",
                        input.order
                    );

                    // Update the conflicting lesson with the current lesson's order
                    await context.db
                        .update<LessonModel>(conflictingLessonId)
                        .merge({
                            order: currentOrder ?? undefined,
                            updated_at: new DateTime(),
                        });

                    console.log("Swapped order for conflicting lesson");
                }
            }

            updateData.order = input.order;
        }
        if (input.subject_id !== undefined) {
            console.log("Updating subject_id:", input.subject_id);
            const subjectId = new RecordId("subjects", input.subject_id);
            updateData.subject_id = subjectId;
        }
        if (input.status !== undefined) {
            console.log("Updating status:", input.status);
            updateData.status = input.status;
        }
        if (input.scope !== undefined) {
            console.log("Updating scope:", input.scope);
            updateData.scope = input.scope;
        }
        if (input.description !== undefined) {
            console.log("Updating description:", input.description);
            updateData.description = input.description;
        }
        if (input.comments !== undefined) {
            console.log(
                "Updating comments:",
                input.comments.length,
                "comments"
            );
            updateData.comments = input.comments.map((comment) => ({
                title: comment.title,
                description: comment.description,
                created_at: new DateTime(),
                updated_at: new DateTime(),
            }));
        }

        if (Object.keys(updateData).length === 0) {
            console.error("ERROR: No fields to update");
            throw new Error("No fields to update");
        }
        updateData.updated_at = new DateTime();

        console.log("Update data:", JSON.stringify(updateData, null, 2));
        console.log("Update data keys:", Object.keys(updateData));

        try {
            // First, check if the lesson exists
            console.log("Checking if lesson exists...");
            const checkQuery = surql`SELECT * FROM ${lessonId} LIMIT 1`;
            const checkResult = await context.db
                .query<[LessonModel[]]>(checkQuery)
                .collect();
            console.log("Check result:", checkResult);
            console.log("Check result length:", checkResult[0]?.length ?? 0);

            if (!checkResult[0] || checkResult[0].length === 0) {
                console.error(
                    "ERROR: Lesson not found with ID:",
                    lessonId.toString()
                );
                throw new Error(`Lesson not found: ${lessonId.toString()}`);
            }

            console.log("Lesson found, proceeding with update...");
            const result = await context.db
                .update<LessonModel>(lessonId)
                .merge(updateData);

            console.log("Update result:", result);
            console.log("Update result type:", typeof result);
            console.log("Update result is array:", Array.isArray(result));

            if (Array.isArray(result)) {
                console.log("Update result length:", result.length);
                if (result.length === 0) {
                    console.error("ERROR: Update returned empty array");
                    throw new Error("Update returned no results");
                }
                if (result.length > 1) {
                    console.error(
                        "ERROR: Update returned multiple results:",
                        result.length
                    );
                    throw new Error(
                        `Update returned ${result.length} results, expected 1`
                    );
                }
                console.log("Using first result from array");
                const lesson = LessonMapper.fromModel(result[0]);
                console.log("Mapped lesson:", lesson.id);
                console.log("=== PATCH LESSON SUCCESS ===");
                return lesson;
            } else {
                console.log("Update result is single object");
                const lesson = LessonMapper.fromModel(result);
                console.log("Mapped lesson:", lesson.id);
                console.log("=== PATCH LESSON SUCCESS ===");
                return lesson;
            }
        } catch (e) {
            console.error("=== PATCH LESSON ERROR ===");
            console.error("Error type:", e?.constructor?.name);
            console.error(
                "Error message:",
                e instanceof Error ? e.message : String(e)
            );
            console.error(
                "Error stack:",
                e instanceof Error ? e.stack : "No stack"
            );
            console.error("Full error:", e);
            throw e;
        }
    });

export const deleteLesson = base
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }): Promise<{ success: boolean }> => {
        console.log("start delete");
        const lessonId = parseRecordId(input.id, "lessons");

        try {
            await context.db.delete(lessonId);
            console.log("end delete");
            return { success: true };
        } catch (e) {
            console.log("error: ", e);
            throw e;
        }
    });
