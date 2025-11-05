import { RecordId, surql } from "surrealdb";
import type { SubjectModel } from "../repository/model/subjects";
import { base } from "./base";
import { SubjectMapper } from "../repository/mapper/subject";
import type { Subject } from "@saas/shared";
import z from "zod";

export const listSubjects = base.handler(
  async ({ context }): Promise<Subject[]> => {
    const userId = new RecordId("users", context.user_id);
    const query = surql`SELECT * FROM subjects WHERE user_id = ${userId}`;
    const classesModel = await context.db
      .query<[SubjectModel[]]>(query)
      .collect();
    const classes = classesModel[0].map(SubjectMapper.fromModel);
    return classes;
  },
);

export const getSubject = base
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }): Promise<Subject> => {
    const userId = new RecordId("users", context.user_id);
    const query = surql`SELECT * FROM subjects WHERE user_id = ${userId} AND id = ${input.id}`;
    const classesModel = await context.db
      .query<[SubjectModel[]]>(query)
      .collect();
    const classes = classesModel[0].map(SubjectMapper.fromModel);
    return classes[0];
  });
