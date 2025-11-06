import { os } from "@orpc/server";
import type { Surreal } from "surrealdb";

export const base = os.$context<{ db: Surreal; user_id: string }>();
