import { Elysia } from "elysia";
import { Surreal } from "surrealdb";

export interface SurrealDBConfig {
  url?: string;
  namespace?: string;
  database?: string;
  username?: string;
  password?: string;
}

export const surrealdb = (config?: SurrealDBConfig) => {
  const {
    url = process.env.SURREALDB_URL || "http://localhost:8000",
    namespace = process.env.SURREALDB_NS || "test",
    database = process.env.SURREALDB_DB || "test",
    username = process.env.SURREALDB_USER || "root",
    password = process.env.SURREALDB_PASS || "root",
  } = config || {};

  // Create the Surreal instance outside so we can reference it in lifecycle hooks
  // No need to specify engines - it will use the appropriate remote engine based on the URL
  const dbInstance = new Surreal();

  return new Elysia({
    name: "surrealdb",
    seed: config,
  })
    .decorate("db", dbInstance)
    .onStart(async () => {
      try {
        console.log("Connecting to SurrealDB...");
        console.log("Connection config:", {
          url,
          namespace,
          database,
          username,
          passwordLength: password?.length || 0,
        });

        console.log("Step 1: Connecting to", url);
        await dbInstance.connect(url);
        console.log("✅ Connected successfully");

        console.log("Step 2: Signing in as", username);
        await dbInstance.signin({ username, password });
        console.log("✅ Signed in successfully");

        console.log("Step 3: Selecting namespace/database", `${namespace}:${database}`);
        await dbInstance.use({ namespace, database });
        console.log("✅ Namespace/database selected successfully");

        console.log(
          `✅ Connected to SurrealDB at ${url} (${namespace}:${database})`,
        );
      } catch (error) {
        console.error("Failed to connect to SurrealDB:", error);
        console.error("Error details:", {
          name: error?.name,
          message: error?.message,
          code: error?.code,
          stack: error?.stack,
        });
        throw error;
      }
    })
    .onStop(async () => {
      try {
        console.log("Disconnecting from SurrealDB...");
        await dbInstance.close();
        console.log("✅ Disconnected from SurrealDB");
      } catch (error) {
        console.error("Error disconnecting from SurrealDB:", error);
      }
    })
    .as("plugin");
};
