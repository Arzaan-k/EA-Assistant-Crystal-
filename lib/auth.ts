import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Add any additional configuration here
})
