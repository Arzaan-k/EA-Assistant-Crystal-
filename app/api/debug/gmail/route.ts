import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { GmailService } from "@/lib/gmail";

export async function GET(request: NextRequest) {
  try {
    // Get user ID from cookies
    const userId = request.cookies.get("user_id")?.value;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" }, 
        { status: 401 }
      );
    }

    // Fetch user from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, Number.parseInt(userId)));

    if (!user.length || !user[0].accessToken) {
      return NextResponse.json(
        { success: false, error: "User not found or no access token" }, 
        { status: 401 }
      );
    }

    // Initialize Gmail service
    const gmailService = new GmailService(
      Number(userId), 
      user[0].accessToken, 
      user[0].refreshToken || undefined
    );
    
    try {
      // Get user profile
      const profile = await gmailService.getProfile();
      
      // Get labels to verify permissions
      const labels = await gmailService.getLabels();
      
      // Try to fetch emails
      const emails = await gmailService.getEmails(5);
      
      return NextResponse.json({
        success: true,
        profile,
        labels,
        emails: emails.map(email => ({
          id: email.id,
          threadId: email.threadId,
          snippet: email.snippet,
          internalDate: email.internalDate,
          labelIds: email.labelIds
        })),
        lastSyncTime: user[0].lastEmailSync
      });
      
    } catch (error: any) {
      console.error('Gmail API Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: error.code,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          }
        }, 
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Server Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error",
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
