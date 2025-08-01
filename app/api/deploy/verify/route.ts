import { NextResponse } from "next/server"
import { checkDatabaseConnection } from "@/lib/connection"
import { env } from "@/lib/env"

export async function GET() {
  const checks = {
    database: false,
    google_oauth: false,
    google_api: false,
    gemini_ai: false,
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  }

  try {
    // Database check
    checks.database = await checkDatabaseConnection()

    // Google OAuth check
    checks.google_oauth = !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)

    // Google API check
    checks.google_api = !!env.GOOGLE_API_KEY

    // Gemini AI check
    checks.gemini_ai = !!env.GEMINI_API_KEY

    const allHealthy = Object.values(checks).every((check) => (typeof check === "boolean" ? check : true))

    return NextResponse.json(
      {
        status: allHealthy ? "ready" : "partial",
        checks,
        message: allHealthy
          ? "All systems operational - Crystal AI Assistant is ready!"
          : "Some integrations need attention",
      },
      {
        status: allHealthy ? 200 : 206,
      },
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        checks,
        error: "Deployment verification failed",
        message: "Please check environment variables and database connection",
      },
      { status: 500 },
    )
  }
}
