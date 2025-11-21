import { SchoolClassMapper } from "../repository/mapper/school_class";
import type { SchoolClassModel } from "../repository/model/school_class";
import { base } from "./base";
import * as z from "zod";
import { surql, RecordId, Table } from "surrealdb";
import {
    school_class_create_input,
    school_class_patch_input,
    type SchoolClass,
} from "@saas/shared";

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
        const query = surql`SELECT * FROM classes WHERE user_id = ${userId} AND id = ${input.id}`;
        const classesModel = await context.db
            .query<[SchoolClassModel[]]>(query)
            .collect();
        const classes = classesModel[0].map(SchoolClassMapper.fromModel);
        return classes[0];
    });

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
