import openapi from "@elysiajs/openapi";
import { Elysia, status } from "elysia";
import { cors } from "@elysiajs/cors";
import { RPCHandler } from "@orpc/server/fetch";
import { router } from "./router";
import { clerkPlugin } from "elysia-clerk";
import { surrealdb } from "./plugins/surrealdb";

const handler = new RPCHandler(router);

const app = new Elysia()
  .use(
    cors({
      origin: ["http://localhost:3000"], // Your frontend URL
      credentials: true,
    }),
  )
  .use(openapi())
  .use(surrealdb())
  .get("/", () => "Hello Elysia")
  .get("/health", () => ({ status: "ok" }))
  .get("/db-test", async ({ db }) => {
    try {
      const info = await db.info();
      return { success: true, info };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  })
  .use(clerkPlugin())
  .all(
    "/rpc*",
    async (ctx) => {
      const auth = ctx.auth();
      if (!auth.isAuthenticated) {
        return status(401);
      }
      const { response } = await handler.handle(ctx.request, {
        prefix: "/rpc",
      });

      return response ?? new Response("Not Found", { status: 404 });
    },
    {
      parse: "none",
    },
  )
  .listen(3001);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
