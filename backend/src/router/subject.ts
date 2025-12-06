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
import { ORPCError } from "@orpc/server";

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
    .input(subject_create_input)
    .handler(async ({ input, context }): Promise<Subject> => {
        console.log("start create");
        const userId = new RecordId("users", context.user_id);
        console.log("userId: ", userId);

        // Check if a subject with the same name already exists for this user
        const checkQuery = surql`SELECT * FROM subjects WHERE user_id = ${userId} AND name = ${input.name}`;
        const existingSubjects = await context.db
            .query<[SubjectModel[]]>(checkQuery)
            .collect();

        const existingSubjectsArray = existingSubjects[0] ?? [];
        console.log("existingSubjectsArray: ", existingSubjectsArray);
        if (existingSubjectsArray.length > 0) {
            // Throw error using oRPC's error system to preserve the message
            throw new ORPCError("UNPROCESSABLE_ENTITY", {
                message: "Une matière avec ce nom existe déjà",
            });
        }
        console.log("no existing subject", input);

        try {
            const subjectsTable = new Table("subjects");
            const result = await context.db
                .create<SubjectModel>(subjectsTable)
                .content({
                    name: input.name,
                    description: input.description || "",
                    type: input.type,
                    category: input.category,
                    user_id: userId,
                });

            console.log("result: ", result);
            const subject = SubjectMapper.fromModel(result[0]);
            console.log("subject: ", subject);
            console.log("end create");
            return subject;
        } catch (e) {
            console.log("error catch: ", e);
            // If it's a duplicate error from the database, provide a user-friendly message
            if (
                e instanceof Error &&
                (e.message.includes("duplicate") ||
                    e.message.includes("already exists") ||
                    e.message.includes("unique"))
            ) {
                throw new ORPCError("UNPROCESSABLE_ENTITY", {
                    message: "Une matière avec ce nom existe déjà",
                });
            }
            // Re-throw other errors as-is (they'll be caught by oRPC and converted to INTERNAL_SERVER_ERROR)
            throw e;
        }
    });

export const patchSubject = base
    .input(subject_patch_input)
    .handler(async ({ input, context }): Promise<Subject> => {
        console.log("start patch");
        const subjectId = new RecordId("subjects", input.id);

        const updateData: Partial<
            Pick<SubjectModel, "name" | "description" | "type" | "category">
        > = {};

        if (input.name !== undefined) {
            updateData.name = input.name;
        }
        if (input.description !== undefined) {
            updateData.description = input.description;
        }
        if (input.type !== undefined) {
            // Validate and cast type to match model enum
            if (
                input.type === "core" ||
                input.type === "option" ||
                input.type === "support"
            ) {
                updateData.type = input.type;
            } else {
                throw new Error(`Invalid type: ${input.type}`);
            }
        }
        if (input.category !== undefined) {
            // Map "Mathematic" to "Mathematics" if needed, and validate against model enum
            const categoryMap: Record<string, SubjectModel["category"]> = {
                Mathematic: "Mathematics",
            };
            const mappedCategory =
                categoryMap[input.category] || input.category;
            // Validate it's a valid category
            const validCategories = [
                "Mathematics",
                "Language",
                "Science",
                "Social",
                "Literature",
                "Sport",
                "History",
                "Geography",
                "Philosophy",
                "Civic",
                "Music",
                "Art",
                "Technology",
                "Computer Science",
                "Economics",
                "Other",
            ] as const;
            if (
                validCategories.includes(
                    mappedCategory as (typeof validCategories)[number]
                )
            ) {
                updateData.category =
                    mappedCategory as SubjectModel["category"];
            } else {
                throw new Error(`Invalid category: ${input.category}`);
            }
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
