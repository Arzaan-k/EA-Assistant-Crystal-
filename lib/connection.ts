import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import * as schema from "./schema"
import { env } from "../env"

// Create connection with error handling
let db: ReturnType<typeof drizzle>

try {
  const sql = neon(env.DATABASE_URL)
  db = drizzle(sql, { schema })
} catch (error) {
  console.error("Database connection error:", error)
  throw new Error("Failed to connect to database")
}

export { db }

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
