import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { emails } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    // Test database connection
    const testEmail = await db.select().from(emails).limit(1)
    
    return NextResponse.json({
      success: true,
      databaseConnected: true,
      emailCount: testEmail.length,
      sampleEmail: testEmail[0] || null
    })
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        databaseConnected: false
      },
      { status: 500 }
    )
  }
}
