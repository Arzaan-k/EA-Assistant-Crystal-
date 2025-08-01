import { ReactNode } from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { headers } from "next/headers"
import { NextAuthProvider } from "@/providers/auth-provider"
import "./globals.css"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { NotificationSystem } from "@/components/notification-system"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Crystal AI Executive Assistant",
  description: "Intelligent personal assistant for Crystal Group executives",
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <NextAuthProvider>
          <ThemeProvider 
            attribute="class" 
            defaultTheme="dark" 
            enableSystem 
            disableTransitionOnChange
          >
            <div className="relative flex h-screen">
              <SidebarProvider defaultOpen={true}>
                <AppSidebar />
                <main className="flex-1 overflow-y-auto">
                  {children}
                </main>
              </SidebarProvider>
              <Toaster />
              <NotificationSystem />
            </div>
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  )
}
