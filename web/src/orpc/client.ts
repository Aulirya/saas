import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

import type { RouterClient } from "@orpc/server";

import type { Router } from "@/../../backend/src/router";
import { isDemoEnabled } from "../utils/demo";

const link = new RPCLink({
    url: "http://localhost:3001/rpc",
    fetch: (input, init) => {
        console.log("fetch", input, init);
        const headers = new Headers(init?.headers);
        if (isDemoEnabled()) {
            headers.set("x-demo-mode", "true");
        }
        console.log("headers", headers);
        return fetch(input, {
            ...init,
            headers,
            credentials: "include", // If you need cookies/auth
        });
    },
});

export const client: RouterClient<Router> = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
