import { SchoolClassMapper } from "../repository/mapper/school_class";
import type { SchoolClassModel } from "../repository/model/school_class";
import { base } from "./base";
import * as z from "zod";
import { surql, RecordId } from "surrealdb";
import type { SchoolClass } from "@saas/shared";

export const listSchoolClasses = base.handler(
  async ({ context }): Promise<SchoolClass[]> => {
    const userId = new RecordId("users", context.user_id);
    const query = surql`SELECT * FROM classes WHERE user_id = ${userId}`;
    const classesModel = await context.db
      .query<[SchoolClassModel[]]>(query)
      .collect();
    const classes = classesModel[0].map(SchoolClassMapper.fromModel);
    return classes;
  },
);

export const getSchoolClass = base
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }): Promise<SchoolClass> => {
    const userId = new RecordId("users", context.user_id);
    const query = surql`SELECT * FROM classes WHERE user_id = ${userId} AND id = ${input.id}`;
    const classesModel = await context.db
      .query<[SchoolClassModel[]]>(query)
      .collect();
    const classes = classesModel[0].map(SchoolClassMapper.fromModel);
    return classes[0];
  });
