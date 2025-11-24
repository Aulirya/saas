import { DateTime, RecordId, surql, Table } from "surrealdb";
import { base } from "./base";
import type { LessonModel } from "../repository/model/lessons";
import { LessonMapper } from "../repository/mapper/lesson";
import z from "zod";
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
  },
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
    const classId = new RecordId("classes", input.class_id);
    const subjectId = new RecordId("subjects", input.subject_id);
    const classesTable = new Table("classes");
    const result = await context.db.create<LessonModel>(classesTable).content({
      label: input.label,
      class_id: classId,
      subject_id: subjectId,
      user_id: userId,
      start_at: input.start_at ? new DateTime(input.start_at) : null,
      end_at: input.end_at ? new DateTime(input.end_at) : null,
      comments:
        input.comments === undefined
          ? undefined
          : input.comments.map((comment) => ({
              title: comment.title,
              description: input.description,
              created_at: new DateTime(),
              updated_at: new DateTime(),
            })),
      description: input.description,
    });

    const school_class = LessonMapper.fromModel(result[0]);
    return school_class;
  });

export const patchLesson = base
  .input(lesson_patch_input)
  .handler(async ({ input, context }): Promise<Lesson> => {
    console.log("start patch");
    const classId = new RecordId("classes", input.id);

    const updateData: Partial<LessonModel> = {};

    if (input.label !== undefined) {
      updateData.label = input.label;
    }
    if (input.start_at !== undefined) {
      updateData.start_at = input.start_at
        ? new DateTime(input.start_at)
        : null;
    }
    if (input.end_at !== undefined) {
      updateData.end_at = input.end_at ? new DateTime(input.end_at) : null;
    }
    if (input.class_id !== undefined) {
      const classId = new RecordId("classes", input.class_id);
      updateData.class_id = classId;
    }
    if (input.subject_id !== undefined) {
      const subjectId = new RecordId("subjects", input.subject_id);
      updateData.subject_id = subjectId;
    }
    if (input.comments !== undefined) {
      updateData.comments = input.comments.map((comment) => ({
        title: comment.title,
        description: comment.description,
        created_at: new DateTime(),
        updated_at: new DateTime(),
      }));
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("No fields to update");
    }
    updateData.updated_at = new DateTime();

    try {
      const result = await context.db
        .update<LessonModel>(classId)
        .merge(updateData);
      const school_class = LessonMapper.fromModel(result);
      console.log("end patch");
      return school_class;
    } catch (e) {
      console.log("error: ", e);
      throw e;
    }
  });
