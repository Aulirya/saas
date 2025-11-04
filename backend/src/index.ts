import openapi from "@elysiajs/openapi";
import { Elysia, status } from "elysia";
import { cors } from "@elysiajs/cors";
import { RPCHandler } from "@orpc/server/fetch";
import { router } from "./router";
import { clerkPlugin } from "elysia-clerk";

const handler = new RPCHandler(router);

const app = new Elysia()
  .use(
    cors({
      origin: ["http://localhost:3000"], // Your frontend URL
      credentials: true,
    }),
  )
  .use(openapi())
  .get("/", () => "Hello Elysia")
  .get("/health", () => ({ status: "ok" }))
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
