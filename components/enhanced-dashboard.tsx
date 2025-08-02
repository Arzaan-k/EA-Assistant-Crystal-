"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Mail,
  Calendar,
  TrendingUp,
  FileText,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  Brain,
  Zap,
  CreditCard,
  Target,
} from "lucide-react"

interface DashboardStats {
  emails: {
    total: number
    unread: number
    urgent: number
    creditCard: number
  }
  calendar: {
    todayMeetings: number
    weekMeetings: number
    upcomingDeadlines: number
  }
  tasks: {
    pending: number
    completed: number
    overdue: number
  }
  documents: {
    processed: number
    totalSize: string
    recentUploads: number
  }
}

interface AIInsight {
  id: number
  type: "success" | "warning" | "info" | "urgent"
  title: string
  description: string
  action?: string
  timestamp: Date
}

export function EnhancedDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    emails: { total: 0, unread: 0, urgent: 0, creditCard: 0 },
    calendar: { todayMeetings: 0, weekMeetings: 0, upcomingDeadlines: 0 },
    tasks: { pending: 0, completed: 0, overdue: 0 },
    documents: { processed: 0, totalSize: "0 MB", recentUploads: 0 },
  })

  const [insights, setInsights] = useState<AIInsight[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    
    // Listen for email sync events to update the dashboard
    const handleEmailsSynced = (event: CustomEvent) => {
      const { detail: stats } = event;
      setStats(prev => ({
        ...prev,
        emails: {
          total: stats.total || 0,
          unread: stats.unread || 0,
          urgent: stats.urgent || 0,
          creditCard: stats.creditCard || 0,
        }
      }));
    };

    // Add event listener
    // @ts-ignore - CustomEvent type is not properly recognized
    window.addEventListener('emailsSynced', handleEmailsSynced);

    // Clean up the event listener
    return () => {
      // @ts-ignore - CustomEvent type is not properly recognized
      window.removeEventListener('emailsSynced', handleEmailsSynced);
    };
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      // Simulate API calls to get real data
      await Promise.all([
        fetchEmailStats(),
        fetchCalendarStats(),
        fetchTaskStats(),
        fetchDocumentStats(),
        fetchAIInsights(),
      ])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEmailStats = async () => {
    try {
      const response = await fetch('/api/emails/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch email stats');
      }
      const data = await response.json();
      
      setStats((prev) => ({
        ...prev,
        emails: {
          total: data.total || 0,
          unread: data.unread || 0,
          urgent: data.urgent || 0,
          creditCard: data.creditCard || 0,
        },
      }));
    } catch (error) {
      console.error('Error fetching email stats:', error);
      // Fallback to mock data if API fails
      setStats((prev) => ({
        ...prev,
        emails: {
          total: 0,
          unread: 0,
          urgent: 0,
          creditCard: 0,
        },
      }));
    }
  }

  const fetchCalendarStats = async () => {
    setStats((prev) => ({
      ...prev,
      calendar: {
        todayMeetings: 4,
        weekMeetings: 12,
        upcomingDeadlines: 2,
      },
    }))
  }

  const fetchTaskStats = async () => {
    setStats((prev) => ({
      ...prev,
      tasks: {
        pending: 8,
        completed: 15,
        overdue: 2,
      },
    }))
  }

  const fetchDocumentStats = async () => {
    setStats((prev) => ({
      ...prev,
      documents: {
        processed: 42,
        totalSize: "156 MB",
        recentUploads: 5,
      },
    }))
  }

  const fetchAIInsights = async () => {
    const mockInsights: AIInsight[] = [
      {
        id: 1,
        type: "urgent",
        title: "Credit Card Payment Due",
        description: "You have 3 credit card related emails requiring attention. Payment due in 2 days.",
        action: "Review Credit Card Emails",
        timestamp: new Date(),
      },
      {
        id: 2,
        type: "success",
        title: "Meeting Efficiency Improved",
        description: "Your average meeting duration decreased by 15% this week. Great time management!",
        timestamp: new Date(),
      },
      {
        id: 3,
        type: "warning",
        title: "Task Overload Detected",
        description: "You have 8 pending tasks. Consider delegating 3-4 tasks to team members.",
        action: "Delegate Tasks",
        timestamp: new Date(),
      },
      {
        id: 4,
        type: "info",
        title: "Document Processing Complete",
        description: "5 new documents have been processed and are ready for AI queries.",
        action: "Query Documents",
        timestamp: new Date(),
      },
    ]
    setInsights(mockInsights)
  }

  const getInsightIcon = (type: AIInsight["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "urgent":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "info":
        return <Brain className="h-4 w-4 text-blue-500" />
    }
  }

  const getInsightColor = (type: AIInsight["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
      case "warning":
        return "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
      case "urgent":
        return "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
      case "info":
        return "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
    }
  }

  const calculateProductivity = () => {
    const totalTasks = stats.tasks.pending + stats.tasks.completed + stats.tasks.overdue
    if (totalTasks === 0) return 0
    return Math.round((stats.tasks.completed / totalTasks) * 100)
  }

  const calculateEmailEfficiency = () => {
    if (stats.emails.total === 0) return 0
    const readEmails = stats.emails.total - stats.emails.unread
    return Math.round((readEmails / stats.emails.total) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Intelligence</CardTitle>
            <Mail className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emails.unread}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">{stats.emails.urgent} urgent</span> •
              <span className="text-yellow-600 ml-1">{stats.emails.creditCard} credit card</span>
            </p>
            <div className="mt-2">
              <Progress value={calculateEmailEfficiency()} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{calculateEmailEfficiency()}% processed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Smart Calendar</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.calendar.todayMeetings}</div>
            <p className="text-xs text-muted-foreground">
              {stats.calendar.weekMeetings} this week • {stats.calendar.upcomingDeadlines} deadlines
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Next meeting in 2 hours</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Management</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tasks.pending}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{stats.tasks.completed} completed</span> •
              <span className="text-red-600 ml-1">{stats.tasks.overdue} overdue</span>
            </p>
            <div className="mt-2">
              <Progress value={calculateProductivity()} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{calculateProductivity()}% productivity</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Document AI</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.documents.processed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.documents.totalSize} • {stats.documents.recentUploads} recent
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Brain className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">RAG queries ready</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Executive Insights
            <Badge variant="secondary" className="ml-auto">
              <Zap className="h-3 w-3 mr-1" />
              Real-time
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight) => (
              <div key={insight.id} className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{insight.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">{insight.timestamp.toLocaleTimeString()}</p>
                    </div>
                  </div>
                  {insight.action && (
                    <Button variant="outline" size="sm">
                      {insight.action}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Process Urgent Emails
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
              <CreditCard className="h-4 w-4 mr-2" />
              Review Credit Card Emails
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              Email Analytics
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Calendar Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Smart Meeting
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Check Team Availability
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
              <Clock className="h-4 w-4 mr-2" />
              Optimize Schedule
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
              <Brain className="h-4 w-4 mr-2" />
              Query Documents
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
              <Zap className="h-4 w-4 mr-2" />
              Delegate Tasks
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
              <Target className="h-4 w-4 mr-2" />
              Set Smart Reminders
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Email Response Time</span>
                  <span>2.3 hours avg</span>
                </div>
                <Progress value={85} className="h-2" />
                <p className="text-xs text-green-600 mt-1">↑ 23% improvement</p>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Meeting Efficiency</span>
                  <span>87% on-time</span>
                </div>
                <Progress value={87} className="h-2" />
                <p className="text-xs text-green-600 mt-1">↑ 12% improvement</p>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Task Completion</span>
                  <span>{calculateProductivity()}% completed</span>
                </div>
                <Progress value={calculateProductivity()} className="h-2" />
                <p className="text-xs text-blue-600 mt-1">On track</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Usage Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">AI Queries Today</span>
                </div>
                <span className="font-medium">47</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Tasks Delegated</span>
                </div>
                <span className="font-medium">12</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Documents Processed</span>
                </div>
                <span className="font-medium">8</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Reminders Set</span>
                </div>
                <span className="font-medium">15</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
