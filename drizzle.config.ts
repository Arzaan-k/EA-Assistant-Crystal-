import type { Config } from "drizzle-kit"
import { env } from "./env"

const connectionString = env.DATABASE_URL;
const [credentials, host] = connectionString.split('@');
const [user, password] = credentials.replace('postgres://', '').split(':');
const [hostname, database] = host.split('/');

export default {
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: hostname,
    user,
    password,
    database,
    ssl: true
  },
} satisfies Config
