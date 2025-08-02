import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { emails } from "@/lib/schema"
import { eq, and, gte, count, sql } from "drizzle-orm"

export async function GET() {
  try {
    const userId = 1; // TODO: Get from session/cookie
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [stats] = await db
      .select({
        total: count(),
        unread: count(sql`CASE WHEN ${emails.isRead} = false THEN 1 END`),
        urgent: count(sql`CASE WHEN ${emails.priority} = 'high' THEN 1 END`),
        creditCard: count(sql`CASE WHEN ${emails.category} = 'credit_card' THEN 1 END`),
      })
      .from(emails)
      .where(
        and(
          eq(emails.userId, userId),
          gte(emails.receivedAt, oneWeekAgo)
        )
      )
      .limit(1);

    return NextResponse.json({
      success: true,
      ...stats
    });
  } catch (error) {
    console.error("Error fetching email stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch email statistics" },
      { status: 500 }
    );
  }
}
