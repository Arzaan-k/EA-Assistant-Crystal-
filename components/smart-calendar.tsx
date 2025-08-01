"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users, MapPin, Video, Plus, RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: Date
  end: Date
  attendees: string[]
  location?: string
  meetingLink?: string
  status: "confirmed" | "tentative" | "cancelled"
}

export function SmartCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [naturalLanguageInput, setNaturalLanguageInput] = useState("")
  const [attendeesInput, setAttendeesInput] = useState("")
  const [isScheduling, setIsScheduling] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/calendar/events")
      const data = await response.json()

      if (data.events) {
        setEvents(
          data.events.map((event: any) => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end),
          })),
        )
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const scheduleSmartMeeting = async () => {
    if (!naturalLanguageInput.trim()) return

    setIsScheduling(true)
    try {
      const attendees = attendeesInput
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean)

      const response = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          naturalLanguageRequest: naturalLanguageInput,
          attendees,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setEvents((prev) => [
          ...prev,
          {
            ...data.event,
            start: new Date(data.event.start),
            end: new Date(data.event.end),
          },
        ])
        setNaturalLanguageInput("")
        setAttendeesInput("")
      }
    } catch (error) {
      console.error("Failed to schedule meeting:", error)
    } finally {
      setIsScheduling(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "tentative":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const todayEvents = events.filter((event) => {
    const today = new Date()
    return event.start.toDateString() === today.toDateString()
  })

  const upcomingEvents = events
    .filter((event) => {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return event.start >= tomorrow
    })
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Smart Calendar</h2>
          <p className="text-muted-foreground">AI-powered meeting scheduling with availability checking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchEvents} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule Smart Meeting</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Natural Language Request</label>
                  <Textarea
                    placeholder="e.g., 'Schedule a budget review meeting tomorrow at 2 PM with the CFO and marketing team'"
                    value={naturalLanguageInput}
                    onChange={(e) => setNaturalLanguageInput(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Attendees (comma-separated emails)</label>
                  <Input
                    placeholder="john@crystalgroup.in, sarah@crystalgroup.in"
                    value={attendeesInput}
                    onChange={(e) => setAttendeesInput(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button onClick={scheduleSmartMeeting} disabled={isScheduling} className="w-full">
                  {isScheduling ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Meeting
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Today's Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayEvents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No meetings scheduled for today</p>
          ) : (
            <div className="space-y-3">
              {todayEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-medium">{formatTime(event.start)}</span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round((event.end.getTime() - event.start.getTime()) / (1000 * 60))}m
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{event.summary}</h3>
                    {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      {event.attendees.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span className="text-xs">{event.attendees.length} attendees</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs">{event.location}</span>
                        </div>
                      )}
                      {event.meetingLink && (
                        <div className="flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          <span className="text-xs">Google Meet</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No upcoming events</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex flex-col items-center min-w-[80px]">
                    <span className="text-sm font-medium">{formatDate(event.start)}</span>
                    <span className="text-xs text-muted-foreground">{formatTime(event.start)}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{event.summary}</h3>
                    {event.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{event.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {event.attendees.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span className="text-xs">{event.attendees.length}</span>
                        </div>
                      )}
                      {event.meetingLink && (
                        <div className="flex items-center gap-1">
                          <Video className="h-3 w-3 text-blue-500" />
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Smart Scheduling Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Smart Scheduling Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Natural Language Examples:</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• "Schedule a budget review meeting tomorrow at 2 PM"</p>
                <p>• "Book a 1-hour call with the marketing team next Monday"</p>
                <p>• "Set up a quarterly review meeting for Friday afternoon"</p>
                <p>• "Schedule a client presentation for next week at 10 AM"</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">AI Features:</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• ✅ Automatic availability checking</p>
                <p>• ✅ Smart time slot suggestions</p>
                <p>• ✅ Google Meet link generation</p>
                <p>• ✅ Attendee conflict resolution</p>
                <p>• ✅ Natural language parsing</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
