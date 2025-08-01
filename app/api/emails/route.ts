import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { emails } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get("user_id")?.value
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userEmails = await db
      .select()
      .from(emails)
      .where(eq(emails.userId, Number.parseInt(userId)))
      .orderBy(emails.receivedAt)

    // Transform the database records to match the Email interface expected by the frontend
    const formattedEmails = userEmails.map((email) => ({
      id: email.gmailId,
      threadId: email.threadId || "",
      from: email.fromEmail,
      to: email.toEmail,
      subject: email.subject,
      body: email.body || "",
      date: new Date(email.receivedAt || email.createdAt || Date.now()),
      category: email.category as "urgent" | "financial" | "internal" | "external" | "meetings" | "credit_card" | "general",
      priority: email.priority as "high" | "medium" | "low",
      summary: email.summary || "",
      isRead: email.isRead || false,
      labels: email.labels || [],
    }))

    return NextResponse.json({ success: true, emails: formattedEmails })
  } catch (error) {
    console.error("Error fetching emails:", error)
    return NextResponse.json(
      { error: "Failed to fetch emails", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
