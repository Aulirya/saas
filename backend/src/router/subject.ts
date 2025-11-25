import { RecordId, surql, Table } from "surrealdb";
import type { SubjectModel } from "../repository/model/subjects";
import { base } from "./base";
import { SubjectMapper } from "../repository/mapper/subject";
import {
    subject_create_input,
    subject_patch_input,
    type Subject,
    type SubjectWithLessons,
} from "@saas/shared";
import z from "zod";
import type { LessonModel } from "../repository/model/lessons";
import { LessonMapper } from "../repository/mapper/lesson";

// Helper function to parse a subject ID that might be full (subjects:subject_01) or partial (subject_01)
function parseId(id: string): RecordId {
    // If the ID already contains a colon, it's a full record ID
    if (id.includes(":")) {
        // Parse it: split by colon and create RecordId
        const [table, recordId] = id.split(":", 2);
        return new RecordId(table, recordId);
    }
    // Otherwise, it's just the ID part
    return new RecordId("subjects", id);
}

export const listSubjects = base.handler(
    async ({ context }): Promise<Subject[]> => {
        const userId = new RecordId("users", context.user_id);
        const query = surql`SELECT * FROM subjects WHERE user_id = ${userId}`;
        const classesModel = await context.db
            .query<[SubjectModel[]]>(query)
            .collect();
        const classes = classesModel[0].map(SubjectMapper.fromModel);
        return classes;
    }
);

export const getSubject = base
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }): Promise<Subject> => {
        const userId = new RecordId("users", context.user_id);
        const subjectId = parseId(input.id);
        const query = surql`SELECT * FROM subjects WHERE user_id = ${userId} AND id = ${subjectId}`;
        const classesModel = await context.db
            .query<[SubjectModel[]]>(query)
            .collect();
        const classes = classesModel[0].map(SubjectMapper.fromModel);
        return classes[0];
    });

// get a subject by id with its linked lessons
export const getSubjectWithLessons = base
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }): Promise<SubjectWithLessons> => {
        const userId = new RecordId("users", context.user_id);
        const subjectId = parseId(input.id);

        const query = surql`
      SELECT
        *,
        (
          SELECT *
          FROM lessons
          WHERE subject_id = $parent.id
          ORDER BY start_at ASC
        ) AS lessons
      FROM subjects
      WHERE user_id = ${userId} AND id = ${subjectId}
    `;

        const result = await context.db
            .query<
                [
                    Array<
                        SubjectModel & {
                            lessons?: LessonModel[];
                        }
                    >
                ]
            >(query)
            .collect();

        const subjectData = result[0][0];
        if (!subjectData) {
            throw new Error("Subject not found");
        }

        const subject = SubjectMapper.fromModel(subjectData);

        // Map lessons
        const lessons = subjectData.lessons?.map(LessonMapper.fromModel) ?? [];

        console.log("lessons: ", lessons);
        return {
            ...subject,
            lessons,
        };
    });

export const createSubject = base
    .input(subject_create_input.omit({ user_id: true }))
    .handler(async ({ input, context }): Promise<Subject> => {
        console.log("start create");
        const userId = new RecordId("users", context.user_id);
        console.log("userId: ", userId);
        try {
            const subjectsTable = new Table("subjects");
            const result = await context.db
                .create<SubjectModel>(subjectsTable)
                .content({
                    name: input.name,
                    description: input.description,
                    type: input.type,
                    total_hours: input.total_hours,
                    hours_per_week: input.hours_per_week,
                    user_id: userId,
                });

            console.log("result: ", result);
            const subject = SubjectMapper.fromModel(result[0]);
            console.log("subject: ", subject);
            console.log("end create");
            return subject;
        } catch (e) {
            console.log("error: ", e);
            throw e;
        }
    });

export const patchSubject = base
    .input(subject_patch_input)
    .handler(async ({ input, context }): Promise<Subject> => {
        console.log("start patch");
        const subjectId = new RecordId("subjects", input.id);

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
                .update<SubjectModel>(subjectId)
                .merge(updateData);
            const subject = SubjectMapper.fromModel(result);
            console.log("end patch");
            return subject;
        } catch (e) {
            console.log("error: ", e);
            throw e;
        }
    });
