import openapi from "@elysiajs/openapi";
import { Elysia, status } from "elysia";
import { cors } from "@elysiajs/cors";
import { RPCHandler } from "@orpc/server/fetch";
import { router } from "./router";
import { clerkPlugin } from "elysia-clerk";
import { verifyWebhook } from "elysia-clerk/webhooks";
import { surrealdb } from "./plugins/surrealdb";
import {
    type ClerkUserWebhookDto,
    handleUserCreated,
    handleUserUpdated,
} from "./webhooks";

const handler = new RPCHandler(router);
const isDemoMode = process.env.DEMO_MODE === "true";
const demoUserId = process.env.DEMO_USER_ID;

const app = new Elysia()
    .use(
        cors({
            origin: ["http://localhost:3000"],
            credentials: true,
        })
    )
    .use(openapi())
    .use(surrealdb())
    .get("/", () => "Hello Elysia")
    .get("/health", () => ({ status: "ok" }))
    .get("/db-test", async ({ db }) => {
        try {
            const info = db.isConnected;
            return { success: true, info };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    })
    .use(clerkPlugin())
    .post("/webhooks/clerk", async ({ request, db }) => {
        try {
            const event = await verifyWebhook(request, {
                signingSecret: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
            });
            switch (event.type) {
                case "user.created":
                    await handleUserCreated(
                        db,
                        event.data as ClerkUserWebhookDto
                    );
                    break;

                case "user.updated":
                    await handleUserUpdated(
                        db,
                        event.data as ClerkUserWebhookDto
                    );
                    break;

                default:
                    console.log(`Unhandled webhook event type: ${event.type}`);
            }

            return { success: true };
        } catch (error) {
            console.error("Webhook error:", error);
            return new Response("Webhook Error", { status: 400 });
        }
    })
    .all(
        "/rpc*",
        async (ctx) => {
            const auth = ctx.auth();
            const demoHeader =
                ctx.request.headers.get("x-demo-mode") === "true";
            if (!auth.isAuthenticated) {
                if (!isDemoMode || !demoUserId || !demoHeader) {
                    return status(401);
                }
            }
            const userId = auth.isAuthenticated
                ? auth.userId
                : (demoUserId as string);
            const { response } = await handler.handle(ctx.request, {
                prefix: "/rpc",
                context: {
                    user_id: userId,
                    db: ctx.db,
                },
            });

            return response ?? new Response("Not Found", { status: 404 });
        },
        {
            parse: "none",
        }
    )
    .listen(3001);

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
