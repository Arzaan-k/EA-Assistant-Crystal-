"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, X, Check, Clock, AlertTriangle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
// Temporary comment to force re-compilation

interface Notification {
  id: number
  type: "reminder" | "email" | "task" | "meeting"
  title: string
  description: string
  timestamp: Date
  priority: "high" | "medium" | "low"
  actionUrl?: string
}

export function NotificationSystem() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (status === "authenticated") {
      // Check for notifications every minute
      const interval = setInterval(checkNotifications, 60000)
      checkNotifications() // Initial check

      return () => clearInterval(interval)
    }
  }, [status])

  const checkNotifications = async () => {
    try {
      const response = await fetch("/api/notifications")
      const data = await response.json()

      if (data.reminders && data.reminders.length > 0) {
        const newNotifications: Notification[] = data.reminders.map((reminder: any) => ({
          id: reminder.id,
          type: "reminder" as const,
          title: reminder.title,
          description: reminder.description,
          timestamp: new Date(reminder.reminderTime),
          priority: "high" as const,
        }))

        setNotifications((prev) => {
          const existingIds = prev.map((n) => n.id)
          const uniqueNew = newNotifications.filter((n) => !existingIds.includes(n.id))

          if (uniqueNew.length > 0) {
            setIsVisible(true)
            // Show toast for new notifications
            uniqueNew.forEach((notification) => {
              toast({
                title: "Reminder",
                description: notification.title,
                duration: 5000,
              })
            })
          }

          return [...prev, ...uniqueNew]
        })
      }
    } catch (error) {
      console.error("Error checking notifications:", error)
    }
  }

  const dismissNotification = async (id: number) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderId: id }),
      })

      setNotifications((prev) => prev.filter((n) => n.id !== id))

      if (notifications.length <= 1) {
        setIsVisible(false)
      }
    } catch (error) {
      console.error("Error dismissing notification:", error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "reminder":
        return <Clock className="h-4 w-4" />
      case "email":
        return <Bell className="h-4 w-4" />
      case "task":
        return <AlertTriangle className="h-4 w-4" />
      case "meeting":
        return <Clock className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  if (!isVisible || notifications.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm space-y-2">
      {notifications.map((notification) => (
        <Card key={notification.id} className="shadow-lg border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {getTypeIcon(notification.type)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    <Badge className={getPriorityColor(notification.priority)} variant="outline">
                      {notification.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{notification.timestamp.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => dismissNotification(notification.id)}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => dismissNotification(notification.id)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
