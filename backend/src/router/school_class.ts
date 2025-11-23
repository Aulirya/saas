import { SchoolClassMapper } from "../repository/mapper/school_class";
import type { SchoolClassModel } from "../repository/model/school_class";
import { base } from "./base";
import * as z from "zod";
import { surql, RecordId, Table } from "surrealdb";
import {
    school_class_create_input,
    school_class_patch_input,
    type SchoolClass,
    type SchoolClassWithSubjectsAndLessons,
} from "@saas/shared";
import { SubjectModel, SubjectModelMapper } from "../repository/model/subjects";
import { LessonMapper } from "../repository/mapper/lesson";
import type { LessonModel } from "../repository/model/lessons";

// Helper function to parse a class ID that might be full (classes:class_01) or partial (class_01)
function parseClassId(id: string): RecordId {
    // If the ID already contains a colon, it's a full record ID
    if (id.includes(":")) {
        // Parse it: split by colon and create RecordId
        const [table, recordId] = id.split(":", 2);
        return new RecordId(table, recordId);
    }
    // Otherwise, it's just the ID part
    return new RecordId("classes", id);
}

// get all classes
export const listSchoolClasses = base
    .input(
        z
            .object({
                school: z.string().optional(),
                level: z.string().optional(),
            })
            .optional()
    )
    .handler(async ({ input, context }): Promise<SchoolClass[]> => {
        const userId = new RecordId("users", context.user_id);
        let query = surql`SELECT * FROM classes WHERE user_id = ${userId}`;

        // Add school filter if provided
        if (input?.school && input?.level) {
            query = surql`SELECT * FROM classes WHERE user_id = ${userId} AND school = ${input.school} AND level = ${input.level}`;
        } else if (input?.school) {
            query = surql`SELECT * FROM classes WHERE user_id = ${userId} AND school = ${input.school}`;
        } else if (input?.level) {
            query = surql`SELECT * FROM classes WHERE user_id = ${userId} AND level = ${input.level}`;
        } else {
            query = surql`SELECT * FROM classes WHERE user_id = ${userId}`;
        }

        const classesModel = await context.db
            .query<[SchoolClassModel[]]>(query)
            .collect();
        const classes = classesModel[0].map(SchoolClassMapper.fromModel);
        return classes;
    });

// get all schools
export const listSchools = base.handler(
    async ({ context }): Promise<string[]> => {
        const userId = new RecordId("users", context.user_id);
        // Get distinct schools using GROUP BY
        const query = surql`SELECT school FROM classes WHERE user_id = ${userId} GROUP BY school`;
        const result = await context.db
            .query<[{ school: string }[]]>(query)
            .collect();

        // Extract school values from the grouped results
        const schools = result[0]
            .map((row) => row.school)
            .filter(
                (school): school is string =>
                    school !== null && school !== undefined
            );

        // Remove duplicates (in case of any edge cases) and sort
        return [...new Set(schools)].sort();
    }
);

// get all levels
export const listLevels = base.handler(
    async ({ context }): Promise<string[]> => {
        const userId = new RecordId("users", context.user_id);
        const query = surql`SELECT level FROM classes WHERE user_id = ${userId} GROUP BY level`;
        const result = await context.db
            .query<[{ level: string }[]]>(query)
            .collect();
        const levels = result[0]
            .map((row) => row.level)
            .filter(
                (level): level is string =>
                    level !== null && level !== undefined
            );
        return [...new Set(levels)].sort();
    }
);

// get a class by id
export const getSchoolClass = base
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }): Promise<SchoolClass> => {
        const userId = new RecordId("users", context.user_id);
        const classId = parseClassId(input.id);
        const query = surql`SELECT * FROM classes WHERE user_id = ${userId} AND id = ${classId}`;

        const classesModel = await context.db
            .query<[SchoolClassModel[]]>(query)
            .collect();

        const classes = classesModel[0].map(SchoolClassMapper.fromModel);

        if (classes.length === 0) {
            throw new Error("Class not found");
        }

        return classes[0];
    });

// get a class by id with its linked subjects and lessons
export const getSchoolClassWithSubjects = base
    .input(z.object({ id: z.string() }))
    .handler(
        async ({
            input,
            context,
        }): Promise<SchoolClassWithSubjectsAndLessons> => {
            const userId = new RecordId("users", context.user_id);
            const classId = parseClassId(input.id);

            const query = surql`
              SELECT
                *,
                (
                    SELECT 
                        subject_id AS id, 
                        subject_id.*,
                        (
                            SELECT *
                            FROM lessons
                            WHERE subject_id = $parent.subject_id
                            ORDER BY start_at ASC
                            LIMIT 1
                        ) AS lessons
                    FROM course_progress 
                    WHERE class_id = $parent.id
                ) AS subjects
                FROM classes
                WHERE
                 user_id = ${userId} AND id = ${classId}
            `;

            const result = await context.db
                .query<
                    [
                        Array<
                            SchoolClassModel & {
                                subjects?: Array<
                                    SubjectModel & {
                                        lessons?: LessonModel[];
                                    }
                                >;
                            }
                        >
                    ]
                >(query)
                .collect();

            const classData = result[0][0];
            if (!classData) {
                throw new Error("Class not found");
            }

            const schoolClass = SchoolClassMapper.fromModel(classData);

            // Helper to extract hours_per_week from subject
            const getSubjectHoursPerWeek = (
                subject: SubjectModel & { subject_id?: SubjectModel }
            ): number => {
                const hours =
                    (subject as SubjectModel & { subject_id?: SubjectModel })
                        .subject_id?.hours_per_week ?? subject.hours_per_week;
                return Number(hours) || 0;
            };

            // Map subjects with their lessons
            const subjects =
                classData.subjects?.map((subject) => ({
                    ...SubjectModelMapper.fromModel(subject),
                    lessons: subject.lessons?.map(LessonMapper.fromModel) ?? [],
                })) ?? [];

            // Calculate total weekly hours
            const weeklyHours =
                classData.subjects?.reduce(
                    (acc, subject) => acc + getSubjectHoursPerWeek(subject),
                    0
                ) ?? 0;

            return {
                ...schoolClass,
                subjects,
                subjects_count: classData.subjects?.length ?? 0,
                weekly_hours: weeklyHours,
            };
        }
    );

export const createSchoolClass = base
    .input(school_class_create_input)
    .handler(async ({ input, context }): Promise<SchoolClass> => {
        console.log("start create");
        const userId = new RecordId("users", context.user_id);
        console.log("userId: ", userId);
        try {
            const classesTable = new Table("classes");
            const result = await context.db
                .create<SchoolClassModel>(classesTable)
                .content({
                    name: input.name,
                    level: input.level,
                    school: input.school,
                    students_count: input.students_count,
                    user_id: userId,
                });

            console.log("result: ", result);
            const schoolClass = SchoolClassMapper.fromModel(result[0]);
            console.log("schoolClass: ", schoolClass);
            console.log("end create");
            return schoolClass;
        } catch (e) {
            console.log("error: ", e);
            throw e;
        }
    });

export const patchSchoolClass = base
    .input(school_class_patch_input)
    .handler(async ({ input, context }): Promise<SchoolClass> => {
        console.log("start patch");
        const classId = new RecordId("classes", input.id);

        const updateData: Partial<{
            name: string;
            level: string;
            school: string;
            student_count: number;
        }> = {};

        if (input.name !== undefined) {
            updateData.name = input.name;
        }
        if (input.level !== undefined) {
            updateData.level = input.level;
        }
        if (input.school !== undefined) {
            updateData.school = input.school;
        }
        if (input.students_count !== undefined) {
            updateData.student_count = input.students_count;
        }

        if (Object.keys(updateData).length === 0) {
            throw new Error("No fields to update");
        }

        try {
            const result = await context.db
                .update<SchoolClassModel>(classId)
                .merge(updateData);
            const school_class = SchoolClassMapper.fromModel(result);
            console.log("end patch");
            return school_class;
        } catch (e) {
            console.log("error: ", e);
            throw e;
        }
    });
