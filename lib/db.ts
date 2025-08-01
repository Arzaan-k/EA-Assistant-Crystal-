import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import * as schema from "./schema"
import { env } from "../env"

// Create a singleton database connection
const sql = neon(env.DATABASE_URL)
export const db = drizzle(sql, { schema: { ...schema } })

// Health check function
export async function checkDatabaseConnection() {
  try {
    await db.select().from(schema.users).limit(1)
    return true
  } catch (error) {
    console.error("Database health check failed:", error)
    return false
  }
}
