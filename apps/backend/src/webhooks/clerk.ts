import type { ClerkUserWebhookDto } from "./dto";
import { UserModelMapper } from "../repository/mapper/users";
import { RecordId, type Surreal } from "surrealdb";

export async function handleUserCreated(
  db: Surreal,
  data: ClerkUserWebhookDto,
) {
  const user = UserModelMapper.fromClerkUser(data);

  await db.insert({ table: "users", ...user, id: user.id });
  console.log(`User created: ${user.id}`);
}

export async function handleUserUpdated(
  db: Surreal,
  data: ClerkUserWebhookDto,
) {
  const user = UserModelMapper.fromClerkUser(data);

  await db.update(user.id).content(user);

  console.log(`User updated: ${user.id}`);
}

export async function handleUserDeleted(db: Surreal, data: { id: string }) {
  const userId = new RecordId("users", data.id);
  await db.delete(userId);

  console.log(`User deleted: ${userId}`);
}
