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
import { SUBJECT_CATEGORIES } from "@saas/shared";
import type { LessonModel } from "../repository/model/lessons";
import { LessonMapper } from "../repository/mapper/lesson";
import { ORPCError } from "@orpc/server";
import { parseRecordId } from "../utils/record-id";

// ---------- GET REQUESTS ----------
export const getAllSubjects = base.handler(
    async ({ context }): Promise<Subject[]> => {
        const userId = new RecordId("users", context.user_id);
        const query = surql`SELECT * FROM subjects WHERE user_id = ${userId}`;

        let subjectsModel: [SubjectModel[]];
        try {
            subjectsModel = await context.db
                .query<[SubjectModel[]]>(query)
                .collect();
            if (
                !subjectsModel ||
                !Array.isArray(subjectsModel) ||
                !Array.isArray(subjectsModel[0])
            ) {
                throw new ORPCError("DATABASE_ERROR", {
                    message: "Erreur de récupération des matières",
                });
            }
        } catch (err) {
            console.error("error in getAllSubjects: ", err);
            throw new ORPCError("DATABASE_ERROR", {
                message: "Erreur de récupération des matières",
            });
        }
        const subjects = subjectsModel[0].map(SubjectMapper.fromModel);
        return subjects;
    }
);

// get a subject by id with its linked lessons
export const getSubjectWithLessons = base
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }): Promise<SubjectWithLessons> => {
        const userId = new RecordId("users", context.user_id);
        const subjectId = parseRecordId(input.id, "subjects");

        const query = surql`
        SELECT * ,
            (SELECT *
            FROM lessons
            WHERE subject_id = $parent.id
            ORDER BY order ASC
            ) AS lessons
        FROM subjects
        WHERE user_id = ${userId} AND id = ${subjectId}
        `;

        let result;
        try {
            result = await context.db
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
        } catch (err) {
            console.error("error in getSubjectWithLessons: ", err);
            throw new ORPCError("DATABASE_ERROR", {
                message: "Erreur de récupération de la matière avec ses leçons",
            });
        }

        const subjectData = result[0][0];
        if (!subjectData) {
            throw new ORPCError("NOT_FOUND", {
                message: "Matière non trouvée",
            });
        }

        const subject = SubjectMapper.fromModel(subjectData);

        // Map lessons
        const lessons = subjectData.lessons?.map(LessonMapper.fromModel) ?? [];
        return {
            ...subject,
            lessons,
        };
    });

// Check if a subject with the same name exists for the current user
export const checkSubjectNameExists = base
    .input(
        z.object({
            name: z.string(),
        })
    )
    .handler(
        async ({
            input,
            context,
        }): Promise<{ exists: boolean; subject?: Subject }> => {
            const userId = new RecordId("users", context.user_id);

            // Build query to check if name exists
            let query: ReturnType<typeof surql>;
            query = surql`SELECT * FROM subjects WHERE user_id = ${userId} AND name = ${input.name}`;

            const existingSubjects = await context.db
                .query<[SubjectModel[]]>(query)
                .collect();

            const existingSubjectsArray = existingSubjects[0] ?? [];

            if (existingSubjectsArray.length > 0) {
                return {
                    exists: true,
                    subject: SubjectMapper.fromModel(existingSubjectsArray[0]),
                };
            }

            return { exists: false };
        }
    );

// ---------- CREATE REQUEST ----------
export const createSubject = base
    .input(subject_create_input)
    .handler(async ({ input, context }): Promise<Subject> => {
        const userId = new RecordId("users", context.user_id);

        try {
            const subjectsTable = new Table("subjects");
            if (input.category === undefined) {
                throw new ORPCError("INVALID_REQUEST", {
                    message: "Category is required",
                });
            }

            if (
                !SUBJECT_CATEGORIES.includes(
                    input.category as (typeof SUBJECT_CATEGORIES)[number]
                )
            ) {
                throw new ORPCError("INVALID_REQUEST", {
                    message: `Invalid category: ${input.category}`,
                });
            }

            const category =
                input.category as (typeof SUBJECT_CATEGORIES)[number];

            const result = await context.db
                .create<SubjectModel>(subjectsTable)
                .content({
                    name: input.name,
                    description: input.description || "",
                    type: input.type || "",
                    category,
                    user_id: userId,
                });

            const subject = SubjectMapper.fromModel(result[0]);

            return subject;
        } catch (e) {
            if (e instanceof ORPCError) {
                throw e; // Preserve existing ORPCErrors
            }
            console.error("error in createSubject: ", e);
            throw new ORPCError("DATABASE_ERROR", {
                message:
                    "Une erreur est survenue lors de la création de la matière",
            });
        }
    });

// ---------- PATCH REQUEST ----------
export const patchSubject = base
    .input(subject_patch_input)
    .handler(async ({ input, context }): Promise<Subject> => {
        try {
            const subjectId = parseRecordId(input.id, "subjects");
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
                updateData.type = input.type;
            }
            if (input.category !== undefined) {
                if (
                    SUBJECT_CATEGORIES.includes(
                        input.category as (typeof SUBJECT_CATEGORIES)[number]
                    )
                ) {
                    updateData.category =
                        input.category as (typeof SUBJECT_CATEGORIES)[number];
                } else {
                    throw new ORPCError("INVALID_REQUEST", {
                        message: `Invalid category: ${input.category}`,
                    });
                }
            }

            const result = await context.db
                .update<SubjectModel>(subjectId)
                .merge(updateData);

            if (!result) {
                throw new ORPCError("DATABASE_ERROR", {
                    message: "Erreur de mise à jour de la matière",
                });
            }
            const subject = SubjectMapper.fromModel(result);
            return subject;
        } catch (e) {
            throw e;
        }
    });
