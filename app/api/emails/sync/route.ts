import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, emails } from "@/lib/schema"
import { GmailService } from "@/lib/gmail"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get("user_id")?.value
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, Number.parseInt(userId)))
      .limit(1)
    if (!user[0] || !user[0].accessToken) {
      return NextResponse.json({ error: "User not found or no access token" }, { status: 401 })
    }

    const gmailService = new GmailService(user[0].accessToken, String(user[0].id));
    const emailData = await gmailService.getEmails(50)

    // Save emails to database
    for (const email of emailData) {
      await db
        .insert(emails)
        .values({
          userId: user[0].id,
          gmailId: email.id,
          threadId: email.threadId,
          fromEmail: email.from,
          toEmail: email.to,
          subject: email.subject,
          body: email.body,
          category: email.category,
          priority: email.priority,
          summary: email.summary,
          isRead: email.isRead,
          labels: email.labels,
          receivedAt: email.date,
        })
        .onConflictDoNothing()
    }

    return NextResponse.json({
      success: true,
      emailsProcessed: emailData.length,
      emails: emailData,
    })
  } catch (error) {
    console.error("Email sync error:", error)
    return NextResponse.json({ error: "Failed to sync emails" }, { status: 500 })
  }
}
