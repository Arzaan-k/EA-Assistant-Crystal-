import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { reminders } from "@/lib/schema"
import { eq, lte } from "drizzle-orm"
import { auth } from "@/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    const userId = session.user.id;

    // Get due reminders
    const now = new Date()
    const dueReminders = await db
      .select()
      .from(reminders)
      .where(eq(reminders.userId, Number.parseInt(userId)))
      .where(eq(reminders.isCompleted, false))
      .where(lte(reminders.reminderTime, now))

    return NextResponse.json({ reminders: dueReminders })
  } catch (error) {
    console.error("Notifications error:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    const userId = session.user.id;

    const { reminderId } = await request.json()

    // Mark reminder as completed
    await db
      .update(reminders)
      .set({
        isCompleted: true,
        completedAt: new Date(),
      })
      .where(eq(reminders.id, reminderId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mark notification error:", error)
    return NextResponse.json({ error: "Failed to mark notification" }, { status: 500 })
  }
}
