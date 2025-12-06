import { ErrorMap, os } from "@orpc/server";
import type { Surreal } from "surrealdb";
import * as z from "zod";

export const base = os.$context<{ db: Surreal; user_id: string }>().errors({
    // <-- common errors
    RATE_LIMITED: {
        data: z.object({
            retryAfter: z.number(),
        }),
    },
    UNAUTHORIZED: {},
});
