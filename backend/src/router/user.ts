import { base } from "./base";
import { RecordId } from "surrealdb";
import { UserModelMapper } from "../repository/mapper/users";
import type { UsersModel } from "../repository/model/users";
import { surql } from "surrealdb";

export const getCurrentUser = base.handler(
    async ({ context }): Promise<UsersModel> => {
        const userId = new RecordId("users", context.user_id);
        const query = surql`SELECT * FROM users WHERE id = ${userId}`;

        const result = await context.db.query<[UsersModel[]]>(query).collect();

        if (!result[0] || result[0].length === 0) {
            throw new Error("User not found");
        }

        return result[0][0];
    }
);
