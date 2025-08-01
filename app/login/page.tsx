"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot, Mail, Calendar, FileText, Brain } from "lucide-react"

import { signIn } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)
    try {
      // The redirect URI is handled by NextAuth.js and should match what's configured in Google Cloud Console
      await signIn("google", { 
        callbackUrl: "/",
        redirect: true,
        // Make sure the redirect URI in Google Cloud Console is exactly:
        // http://localhost:3000/api/auth/callback/google
      })
    } catch (error) {
      console.error("Sign in error:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-full">
              <Bot className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">Crystal AI</h1>
          <p className="text-slate-300 mt-2">Executive Assistant</p>
        </div>

        {/* Login Card */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-center text-white">Welcome Back</CardTitle>
            <p className="text-center text-slate-300 text-sm">Sign in with your Gmail account</p>
            {error && (
              <p className="text-center text-red-500 text-sm mt-2">
                {error === "auth_failed" && "Authentication failed. Please try again."}
                {error === "invalid_domain" && "Please use a Gmail account to sign in."}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleSignIn}
              className="w-full bg-white text-slate-900 hover:bg-slate-100"
              disabled={isLoading}
            >
              {isLoading ? (
                "Signing in..."
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            <div className="text-center text-xs text-slate-400">Gmail accounts only</div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="p-2 bg-blue-500/20 rounded-lg mb-2 mx-auto w-fit">
              <Mail className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-xs text-slate-300">Email Intelligence</p>
          </div>
          <div className="text-center">
            <div className="p-2 bg-green-500/20 rounded-lg mb-2 mx-auto w-fit">
              <Calendar className="h-5 w-5 text-green-400" />
            </div>
            <p className="text-xs text-slate-300">Smart Calendar</p>
          </div>
          <div className="text-center">
            <div className="p-2 bg-purple-500/20 rounded-lg mb-2 mx-auto w-fit">
              <FileText className="h-5 w-5 text-purple-400" />
            </div>
            <p className="text-xs text-slate-300">Document AI</p>
          </div>
          <div className="text-center">
            <div className="p-2 bg-orange-500/20 rounded-lg mb-2 mx-auto w-fit">
              <Brain className="h-5 w-5 text-orange-400" />
            </div>
            <p className="text-xs text-slate-300">AI Assistant</p>
          </div>
        </div>
      </div>
    </div>
  )
}
