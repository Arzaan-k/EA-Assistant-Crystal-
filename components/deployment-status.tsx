"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, ExternalLink } from "lucide-react"

interface DeploymentCheck {
  database: boolean
  google_oauth: boolean
  google_api: boolean
  gemini_ai: boolean
  environment: string
  timestamp: string
}

interface DeploymentStatus {
  status: "ready" | "partial" | "error"
  checks: DeploymentCheck
  message: string
}

export function DeploymentStatus() {
  const [status, setStatus] = useState<DeploymentStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkDeploymentStatus()
  }, [])

  const checkDeploymentStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/deploy/verify")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error("Failed to check deployment status:", error)
      setStatus({
        status: "error",
        checks: {
          database: false,
          google_oauth: false,
          google_api: false,
          gemini_ai: false,
          environment: "unknown",
          timestamp: new Date().toISOString(),
        },
        message: "Failed to verify deployment status",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (check: boolean) => {
    return check ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ready":
        return <Badge className="bg-green-100 text-green-800">Ready</Badge>
      case "partial":
        return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Checking deployment status...</span>
        </CardContent>
      </Card>
    )
  }

  if (!status) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <AlertCircle className="h-6 w-6 text-yellow-500 mr-2" />
          <span>Unable to verify deployment status</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Deployment Status</span>
          <div className="flex items-center gap-2">
            {getStatusBadge(status.status)}
            <Button variant="outline" size="sm" onClick={checkDeploymentStatus}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">{status.message}</p>
          <p className="text-xs text-muted-foreground">
            Environment: {status.checks.environment} • Last checked:{" "}
            {new Date(status.checks.timestamp).toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium">Core Services</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Connection</span>
                {getStatusIcon(status.checks.database)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Google OAuth</span>
                {getStatusIcon(status.checks.google_oauth)}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">AI Services</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Google APIs</span>
                {getStatusIcon(status.checks.google_api)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Gemini AI</span>
                {getStatusIcon(status.checks.gemini_ai)}
              </div>
            </div>
          </div>
        </div>

        {status.status === "ready" && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-300">
                Crystal AI Assistant is fully operational!
              </span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-400">
              All integrations are working correctly. You can now use all features including email intelligence, smart
              calendar, document AI, voice assistant, and task delegation.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/api/health" target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Health Check
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={checkDeploymentStatus}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
