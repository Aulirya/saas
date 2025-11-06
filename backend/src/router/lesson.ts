import { RecordId, surql } from "surrealdb";
import { base } from "./base";
import type { LessonModel } from "../repository/model/lessons";
import { LessonMapper } from "../repository/mapper/lesson";
import z from "zod";
import type { Lesson } from "@saas/shared";

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
