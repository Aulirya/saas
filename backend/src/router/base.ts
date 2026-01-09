import { ErrorMap, os } from "@orpc/server";
import type { Surreal } from "surrealdb";
import * as z from "zod";

export const base = os.$context<{ db: Surreal; user_id: string }>().errors({
    // common errors
    RATE_LIMITED: {
        data: z.object({
            retryAfter: z.number(),
        }),
    },
    UNAUTHORIZED: {},
    // Add common CRUD errors here
    NOT_FOUND: {
        message: "Ressource non trouvée",
        data: z
            .object({
                resource: z.string(),
                id: z.string().optional(),
            })
            .optional(),
    },

    DATABASE_ERROR: {
        message: "Une erreur de base de données s'est produite",
        data: z
            .object({
                operation: z.string().optional(),
            })
            .optional(),
    },
    INVALID_REQUEST: {
        message: "Requête invalide",
        data: z.object({
            message: z.string(),
        }),
    },
});
