import { type NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { env } from "@/env"

// Initialize OAuth client
let oauth2Client: any = null

function getOAuth2Client() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Missing Google OAuth credentials")
  }

  if (!oauth2Client) {
    oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
    )
  }
  return oauth2Client
}

export async function GET(request: NextRequest) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error("Missing Google OAuth credentials")
    return NextResponse.redirect(new URL("/login?error=missing_credentials", env.NEXT_PUBLIC_APP_URL))
  }
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")

    if (!code) {
      return NextResponse.redirect(new URL("/login?error=no_code", env.NEXT_PUBLIC_APP_URL))
    }

    const oauth2Client = getOAuth2Client()
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    // Get user info
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client })
    const { data: userInfo } = await oauth2.userinfo.get()

    if (!userInfo.email?.endsWith("gmail.com")) {
      return NextResponse.redirect(new URL("/login?error=invalid_domain", env.NEXT_PUBLIC_APP_URL))
    }

    // Save or update user
    const existingUser = await db.select().from(users).where(eq(users.email, userInfo.email)).limit(1)

    let user
    if (existingUser.length > 0) {
      ;[user] = await db
        .update(users)
        .set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser[0].id))
        .returning()
    } else {
      ;[user] = await db
        .insert(users)
        .values({
          email: userInfo.email,
          name: userInfo.name || "",
          googleId: userInfo.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
        })
        .returning()
    }

    // Set session cookie
    const response = NextResponse.redirect(new URL("/", env.NEXT_PUBLIC_APP_URL))
    response.cookies.set("user_id", user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    console.error("OAuth callback error:", error)
    return NextResponse.redirect(new URL("/login?error=auth_failed", env.NEXT_PUBLIC_APP_URL))
  }
}
