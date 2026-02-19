import { RecordId } from "surrealdb";
import type { ClerkUserWebhookDto } from "../../webhooks";
import type { UsersModel } from "../model/users";

export namespace UserModelMapper {
    export function fromClerkUser(user: ClerkUserWebhookDto): UsersModel {
        // Extract country from Clerk metadata or use default
        const country = (user.public_metadata?.country as "FR" | "BE") || null;

        return {
            id: new RecordId("users", user.id),
            email: user.email_addresses[0].email_address,
            first_name: user.first_name,
            last_name: user.last_name,
            role: "teacher",
            schools: [],
            country,
        };
    }
}
