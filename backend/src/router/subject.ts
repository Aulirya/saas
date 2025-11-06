import { RecordId, surql, Table } from "surrealdb";
import type { SubjectModel } from "../repository/model/subjects";
import { base } from "./base";
import { SubjectMapper } from "../repository/mapper/subject";
import {
  subject_create_input,
  subject_patch_input,
  type Subject,
} from "@saas/shared";
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

export const createSubject = base
  .input(subject_create_input)
  .handler(async ({ input, context }): Promise<Subject> => {
    console.log("start create");
    const userId = new RecordId("users", context.user_id);
    console.log("userId: ", userId);
    try {
      const classesTable = new Table("classes");
      const result = await context.db
        .create<SubjectModel>(classesTable)
        .content({
          name: input.name,
          description: input.description,
          type: input.type,
          total_hours: input.total_hours,
          hours_per_week: input.hours_per_week,
          user_id: userId,
        });

      console.log("result: ", result);
      const school_class = SubjectMapper.fromModel(result[0]);
      console.log("school_class: ", school_class);
      console.log("end create");
      return school_class;
    } catch (e) {
      console.log("error: ", e);
      throw e;
    }
  });

export const patchSubject = base
  .input(subject_patch_input)
  .handler(async ({ input, context }): Promise<Subject> => {
    console.log("start patch");
    const classId = new RecordId("classes", input.id);

    const updateData: Partial<{
      name: string;
      description?: string | null;
      type: string;
      total_hours: number;
      hours_per_week: number;
    }> = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.type !== undefined) {
      updateData.type = input.type;
    }
    if (input.total_hours !== undefined) {
      updateData.total_hours = input.total_hours;
    }
    if (input.hours_per_week !== undefined) {
      updateData.hours_per_week = input.hours_per_week;
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("No fields to update");
    }

    try {
      const result = await context.db
        .update<SubjectModel>(classId)
        .merge(updateData);
      const school_class = SubjectMapper.fromModel(result);
      console.log("end patch");
      return school_class;
    } catch (e) {
      console.log("error: ", e);
      throw e;
    }
  });
