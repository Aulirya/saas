import { RecordId, surql } from "surrealdb";
import { base } from "./base";
import type { LessonModel } from "../repository/model/lessons";
import { LessonMapper } from "../repository/mapper/lesson";

export const listLessons = base.handler(async ({ context }) => {
  const userId = new RecordId("users", context.user_id);
  const query = surql`SELECT * FROM lessons WHERE user_id = ${userId}`;
  const classesModel = await context.db.query<[LessonModel[]]>(query).collect();
  const classes = classesModel[0].map(LessonMapper.fromModel);
  return classes;
});
