import NextAuth, { type NextAuthConfig, type Profile, type Session, type JWT } from "next-auth"
import Google from "next-auth/providers/google"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { env } from "@/env"
import { DrizzleAdapter } from "@auth/drizzle-adapter"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    refreshToken?: string
    error?: string
    user: {
      id: string
    } & Session['user']
  }
}

export const authConfig: NextAuthConfig = {
  debug: process.env.NODE_ENV === 'development',
  adapter: DrizzleAdapter(db),
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/gmail.labels'
          ].join(' '),
        },
      },
      httpOptions: {
        timeout: 10000,
      },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email?.endsWith("gmail.com")) {
        return false;
      }
      return true;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
        session.error = token.error as string;
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      // Initial sign in
      if (account && profile) {
        // Check if user exists in database
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, profile.email as string));

        if (!existingUser) {
          // Create new user if doesn't exist
          const [newUser] = await db
            .insert(users)
            .values({
              email: profile.email as string,
              name: profile.name || "",
              googleId: profile.sub,
              image: profile.picture,
              emailVerified: new Date(),
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
            })
            .returning();
          
          token.id = newUser.id;
        } else {
          // Update existing user
          await db
            .update(users)
            .set({
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existingUser.id));
          
          token.id = existingUser.id;
        }

        // Save tokens to JWT
        if (account.access_token) token.accessToken = account.access_token;
        if (account.refresh_token) token.refreshToken = account.refresh_token;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export async function getServerSession() {
  return auth();
}

export const getServerAuthSession = getServerSession;