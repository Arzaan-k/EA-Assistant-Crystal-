import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Clock, Mail, Calendar, FileText } from "lucide-react"

const activities = [
  {
    id: 1,
    type: "email",
    title: "High Priority Email from CFO",
    description: "Quarterly budget review meeting request",
    time: "2 minutes ago",
    priority: "high",
    icon: Mail,
  },
  {
    id: 2,
    type: "meeting",
    title: "Board Meeting Scheduled",
    description: "Tomorrow at 10:00 AM with all executives",
    time: "15 minutes ago",
    priority: "medium",
    icon: Calendar,
  },
  {
    id: 3,
    type: "document",
    title: "Financial Report Processed",
    description: "Q4 2024 financial analysis completed",
    time: "1 hour ago",
    priority: "low",
    icon: FileText,
  },
  {
    id: 4,
    type: "email",
    title: "Client Proposal Response",
    description: "ABC Corp responded to our proposal",
    time: "2 hours ago",
    priority: "high",
    icon: Mail,
  },
]

const priorityColors = {
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
}

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <activity.icon className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <Badge className={priorityColors[activity.priority as keyof typeof priorityColors]}>
                    {activity.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
