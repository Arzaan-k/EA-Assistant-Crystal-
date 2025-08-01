"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Calendar, FileText, Mic, MessageSquare, Bell } from "lucide-react"

const actions = [
  {
    title: "Compose Email",
    description: "Draft a new email",
    icon: Mail,
    action: () => console.log("Compose email"),
  },
  {
    title: "Schedule Meeting",
    description: "Create calendar event",
    icon: Calendar,
    action: () => console.log("Schedule meeting"),
  },
  {
    title: "Upload Document",
    description: "Process new document",
    icon: FileText,
    action: () => console.log("Upload document"),
  },
  {
    title: "Voice Command",
    description: "Start voice assistant",
    icon: Mic,
    action: () => console.log("Voice command"),
  },
  {
    title: "AI Chat",
    description: "Ask AI assistant",
    icon: MessageSquare,
    action: () => console.log("AI chat"),
  },
  {
    title: "Set Reminder",
    description: "Create new reminder",
    icon: Bell,
    action: () => console.log("Set reminder"),
  },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <Button
              key={action.title}
              variant="outline"
              className="h-auto p-3 flex flex-col items-center gap-2 bg-transparent"
              onClick={action.action}
            >
              <action.icon className="h-4 w-4" />
              <div className="text-center">
                <div className="text-xs font-medium">{action.title}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
