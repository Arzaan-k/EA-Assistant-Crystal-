import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { emails, calendarEvents, tasks, documents } from "@/lib/schema"
import { eq, count, and, gte } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get("user_id")?.value
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userIdNum = Number.parseInt(userId)

    // Get email stats
    const emailStats = await db
      .select({
        total: count(),
      })
      .from(emails)
      .where(eq(emails.userId, userIdNum))

    const unreadEmails = await db
      .select({
        count: count(),
      })
      .from(emails)
      .where(and(eq(emails.userId, userIdNum), eq(emails.isRead, false)))

    const urgentEmails = await db
      .select({
        count: count(),
      })
      .from(emails)
      .where(and(eq(emails.userId, userIdNum), eq(emails.category, "urgent")))

    const creditCardEmails = await db
      .select({
        count: count(),
      })
      .from(emails)
      .where(and(eq(emails.userId, userIdNum), eq(emails.category, "credit_card")))

    // Get calendar stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayMeetings = await db
      .select({
        count: count(),
      })
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, userIdNum),
          gte(calendarEvents.startTime, today),
          gte(tomorrow, calendarEvents.startTime),
        ),
      )

    // Get task stats
    const pendingTasks = await db
      .select({
        count: count(),
      })
      .from(tasks)
      .where(eq(tasks.status, "pending"))

    const completedTasks = await db
      .select({
        count: count(),
      })
      .from(tasks)
      .where(eq(tasks.status, "completed"))

    // Get document stats
    const processedDocs = await db
      .select({
        count: count(),
      })
      .from(documents)
      .where(and(eq(documents.userId, userIdNum), eq(documents.isProcessed, true)))

    return NextResponse.json({
      emails: {
        total: emailStats[0]?.total || 0,
        unread: unreadEmails[0]?.count || 0,
        urgent: urgentEmails[0]?.count || 0,
        creditCard: creditCardEmails[0]?.count || 0,
      },
      calendar: {
        todayMeetings: todayMeetings[0]?.count || 0,
        weekMeetings: 12, // This would need a more complex query
        upcomingDeadlines: 2, // This would need task deadline analysis
      },
      tasks: {
        pending: pendingTasks[0]?.count || 0,
        completed: completedTasks[0]?.count || 0,
        overdue: 0, // This would need deadline comparison
      },
      documents: {
        processed: processedDocs[0]?.count || 0,
        totalSize: "0 MB", // This would need size calculation
        recentUploads: 0, // This would need recent date filtering
      },
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
