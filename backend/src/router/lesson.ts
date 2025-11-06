import { RecordId, surql, Table } from "surrealdb";
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
    console.log("start create");
    const userId = new RecordId("users", context.user_id);
    const classId = new RecordId("classes", input.class_id);
    const subjectId = new RecordId("subjects", input.subject_id);
    console.log("userId: ", userId);
    try {
      const classesTable = new Table("classes");
      const result = await context.db
        .create<LessonModel>(classesTable)
        .content({
          title: input.title,
          date: null,
          duration_minutes: input.duration_minutes,
          average_duration: input.average_duration,
          status: input.status,
          class_id: classId,
          subject_id: subjectId,
          user_id: userId,
        });

      console.log("result: ", result);
      const school_class = LessonMapper.fromModel(result[0]);
      console.log("school_class: ", school_class);
      console.log("end create");
      return school_class;
    } catch (e) {
      console.log("error: ", e);
      throw e;
    }
  });

export const patchLesson = base
  .input(lesson_patch_input)
  .handler(async ({ input, context }): Promise<Lesson> => {
    console.log("start patch");
    const classId = new RecordId("classes", input.id);

    const updateData: Partial<{
      title: string;
      duration_minutes: number;
      average_duration: number;
      status: "backlog" | "planned" | "in progress" | "done" | "late";
      class_id: RecordId;
      subject_id: RecordId;
    }> = {};

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.duration_minutes !== undefined) {
      updateData.duration_minutes = input.duration_minutes;
    }
    if (input.average_duration !== undefined) {
      updateData.average_duration = input.average_duration;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.class_id !== undefined) {
      const classId = new RecordId("classes", input.class_id);
      updateData.class_id = classId;
    }
    if (input.subject_id !== undefined) {
      const subjectId = new RecordId("subjects", input.subject_id);
      updateData.subject_id = subjectId;
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("No fields to update");
    }

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
