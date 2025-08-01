const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY!,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL!,
  AUTH_REDIRECT_PROXY_URL: process.env.AUTH_REDIRECT_PROXY_URL,
}

// Validate environment variables
const requiredEnvVars = [
  "DATABASE_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_API_KEY",
  "GEMINI_API_KEY",
  "NEXT_PUBLIC_APP_URL",
  // AUTH_REDIRECT_PROXY_URL is optional
] as const

for (const envVar of requiredEnvVars) {
  if (!env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

export { env }
