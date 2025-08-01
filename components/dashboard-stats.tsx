import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Calendar, TrendingUp, FileText } from "lucide-react"

const stats = [
  {
    title: "Unread Emails",
    value: "23",
    change: "+12%",
    icon: Mail,
    color: "text-blue-600",
  },
  {
    title: "Today's Meetings",
    value: "5",
    change: "+2",
    icon: Calendar,
    color: "text-green-600",
  },
  {
    title: "KPI Performance",
    value: "94.2%",
    change: "+5.1%",
    icon: TrendingUp,
    color: "text-purple-600",
  },
  {
    title: "Documents Processed",
    value: "147",
    change: "+23",
    icon: FileText,
    color: "text-orange-600",
  },
]

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{stat.change}</span> from yesterday
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
