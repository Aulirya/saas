import { RecordId } from "surrealdb";
import type { ClerkUserWebhookDto } from "../../webhooks";
import type { Users } from "../model/users";

export namespace UserModelMapper {
  export function fromClerkUser(user: ClerkUserWebhookDto): Users {
    return {
      id: new RecordId("users", user.id),
      email: user.email_addresses[0].email_address,
      first_name: user.first_name ?? undefined,
      last_name: user.last_name ?? undefined,
      role: "teacher",
      schools: [],
    };
  }
}
