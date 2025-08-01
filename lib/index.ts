import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import * as schema from "./schema"

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })

export type User = typeof schema.users.$inferSelect
export type Document = typeof schema.documents.$inferSelect
export type DocumentChunk = typeof schema.documentChunks.$inferSelect
export type Conversation = typeof schema.conversations.$inferSelect
export type Message = typeof schema.messages.$inferSelect
