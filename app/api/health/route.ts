import { NextResponse } from "next/server"
import { checkDatabaseConnection } from "@/lib/connection"
import { env } from "@/lib/env"

export async function GET() {
  try {
    const dbHealthy = await checkDatabaseConnection()

    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      database: dbHealthy ? "connected" : "disconnected",
      services: {
        google_auth: !!env.GOOGLE_CLIENT_ID,
        gemini_ai: !!env.GEMINI_API_KEY,
        database: dbHealthy,
      },
    }

    return NextResponse.json(health, {
      status: dbHealthy ? 200 : 503,
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
