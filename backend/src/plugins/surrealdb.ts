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
        await dbInstance.connect(url);
        await dbInstance.use({ namespace, database });
        await dbInstance.signin({ username, password });
        console.log(
          `✅ Connected to SurrealDB at ${url} (${namespace}:${database})`,
        );
      } catch (error) {
        console.error("Failed to connect to SurrealDB:", error);
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
