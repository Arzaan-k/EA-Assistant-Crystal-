import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"

const insights = [
  {
    id: 1,
    title: "Email Response Time",
    description: "Your average response time improved by 23% this week",
    type: "positive",
    icon: CheckCircle,
  },
  {
    id: 2,
    title: "Meeting Overload",
    description: "You have 40% more meetings than usual this week",
    type: "warning",
    icon: AlertTriangle,
  },
  {
    id: 3,
    title: "KPI Trend",
    description: "Revenue metrics show 15% growth trajectory",
    type: "positive",
    icon: TrendingUp,
  },
]

const typeColors = {
  positive: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  negative: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

export function AIInsights() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight) => (
            <div key={insight.id} className="flex items-start gap-3 p-3 rounded-lg border">
              <insight.icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <Badge className={typeColors[insight.type as keyof typeof typeColors]}>{insight.type}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
