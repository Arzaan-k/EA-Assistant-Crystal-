import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { GmailService } from "@/lib/gmail"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"

export const dynamic = 'force-dynamic' // Disable caching

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.accessToken) {
      return NextResponse.json(
        { error: 'No access token available. Please sign in again.' },
        { status: 401 }
      )
    }

    try {
      // Test Gmail API connection
      const gmailService = new GmailService(
        user.id,
        user.accessToken,
        user.refreshToken || undefined
      )

      // Get profile to test authentication
      const profile = await gmailService.getProfile()
      
      // Try to get a few emails
      const emails = await gmailService.getEmails(5)

      return NextResponse.json({
        success: true,
        profile,
        emailCount: emails.length,
        hasRefreshToken: !!user.refreshToken,
        lastSync: user.lastEmailSync?.toISOString()
      })

    } catch (error: any) {
      console.error('Gmail API test failed:', error)
      
      // Handle specific Gmail API errors
      if (error.message?.includes('invalid_grant') || 
          error.message?.includes('Token has been expired or revoked')) {
        // Clear invalid tokens
        await db
          .update(users)
          .set({ 
            accessToken: null,
            refreshToken: null,
            updatedAt: new Date()
          })
          .where(eq(users.id, user.id))
          
        return NextResponse.json(
          { 
            error: 'Session expired', 
            message: 'Your session has expired. Please sign in again.',
            code: 'SESSION_EXPIRED'
          },
          { status: 401 }
        )
      }
      
      throw error
    }
    
  } catch (error) {
    console.error('Error in Gmail test endpoint:', error)
    return NextResponse.json(
      { 
        error: 'Gmail API test failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'GMAIL_API_ERROR'
      },
      { status: 500 }
    )
  }
}
