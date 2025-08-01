import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { env } from "@/env"

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly",
        },
      },
      // From error message: redirect_uri=http://localhost:3000/api/auth/callback/google
      // Make sure this matches EXACTLY what's in Google Cloud Console
      redirectUri: "http://localhost:3000/api/auth/callback/google",
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email?.endsWith("gmail.com")) {
        return false
      }
      return true
    },
    async session({ session, token }) {
      if (session.user) {
        const user = await db.query.users.findFirst({
          where: eq(users.email, session.user.email!),
        })
        if (user) {
          session.user.id = user.id
        }
      }
      return session
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        
        // Save or update user in database
        const existingUser = await db.select().from(users).where(eq(users.email, profile.email!)).limit(1)

        if (existingUser.length > 0) {
          await db
            .update(users)
            .set({
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existingUser[0].id))
        } else {
          await db
            .insert(users)
            .values({
              email: profile.email!,
              name: profile.name || "",
              googleId: profile.sub,
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
            })
        }
      }
      return token
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authOptions,
  url: process.env.NEXTAUTH_URL,
})

// Export a function that can be used in middleware
export const getSession = async (req: Request) => {
  return await auth({ req })
}

// This is the recommended way to use Auth.js with Next.js 14 and Auth.js v5
export const { GET, POST } = handlers