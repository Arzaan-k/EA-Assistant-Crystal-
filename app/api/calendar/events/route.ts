import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { CalendarService } from "@/lib/calendar"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
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

    const calendarService = new CalendarService(user[0].accessToken)
    const events = await calendarService.getEvents()

    return NextResponse.json({ events })
  } catch (error) {
    console.error("Calendar events error:", error)
    return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 500 })
  }
}

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

    const { naturalLanguageRequest, attendees } = await request.json()

    const calendarService = new CalendarService(user[0].accessToken)
    const event = await calendarService.scheduleSmartMeeting(naturalLanguageRequest, attendees)

    if (event) {
      return NextResponse.json({ success: true, event })
    } else {
      return NextResponse.json({ error: "Failed to schedule meeting" }, { status: 500 })
    }
  } catch (error) {
    console.error("Calendar create error:", error)
    return NextResponse.json({ error: "Failed to create calendar event" }, { status: 500 })
  }
}
