import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { emails } from "@/lib/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(request: NextRequest) {
  console.log('Received request to fetch emails');
  
  try {
    const userId = request.cookies.get("user_id")?.value;
    if (!userId) {
      console.warn('No user_id cookie found');
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const numericUserId = Number.parseInt(userId, 10);
    if (isNaN(numericUserId)) {
      console.error('Invalid user ID format:', userId);
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    console.log(`Fetching emails for user ID: ${numericUserId}`);
    
    try {
      const userEmails = await db
        .select()
        .from(emails)
        .where(eq(emails.userId, numericUserId))
        .orderBy(desc(emails.receivedAt));

      console.log(`Found ${userEmails.length} emails in database`);
      
      // Transform the database records to match the Email interface expected by the frontend
      const formattedEmails = userEmails.map((email) => ({
        id: email.gmailId,
        threadId: email.threadId || "",
        from: email.fromEmail || "",
        to: email.toEmail || "",
        subject: email.subject || "(No subject)",
        body: email.body || "",
        date: new Date(email.receivedAt || Date.now()),
        category: (email.category || "general") as "urgent" | "financial" | "internal" | "external" | "meetings" | "credit_card" | "general",
        priority: (email.priority || "medium") as "high" | "medium" | "low",
        summary: email.summary || "",
        isRead: Boolean(email.isRead),
        labels: Array.isArray(email.labels) ? email.labels : [],
      }));

      console.log(`Returning ${formattedEmails.length} formatted emails`);
      return NextResponse.json({ 
        success: true, 
        emails: formattedEmails 
      });
      
    } catch (dbError) {
      console.error('Database error:', {
        error: dbError instanceof Error ? dbError.message : String(dbError),
        stack: dbError instanceof Error ? dbError.stack : undefined
      });
      throw new Error('Database operation failed');
    }
  } catch (error) {
    console.error("Error in GET /api/emails:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch emails",
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
