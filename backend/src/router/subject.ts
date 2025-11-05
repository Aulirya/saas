import { RecordId, surql } from "surrealdb";
import type { SubjectModel } from "../repository/model/subjects";
import { base } from "./base";
import { SubjectMapper } from "../repository/mapper/subject";

export const listSubjects = base.handler(async ({ context }) => {
  const userId = new RecordId("users", context.user_id);
  const query = surql`SELECT * FROM subjects WHERE user_id = ${userId}`;
  const classesModel = await context.db
    .query<[SubjectModel[]]>(query)
    .collect();
  const classes = classesModel[0].map(SubjectMapper.fromModel);
  return classes;
});
