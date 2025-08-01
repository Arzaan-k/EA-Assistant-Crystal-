import { type calendar_v3, google } from "googleapis"
import { generateResponse } from "./gemini"

export interface CalendarEvent {
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

export interface EmployeeAvailability {
  email: string
  name: string
  available: boolean
  busySlots: Array<{ start: Date; end: Date }>
}

export class CalendarService {
  private calendar: calendar_v3.Calendar

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })
    this.calendar = google.calendar({ version: "v3", auth })
  }

  async getEvents(timeMin?: Date, timeMax?: Date): Promise<CalendarEvent[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId: "primary",
        timeMin: (timeMin || new Date()).toISOString(),
        timeMax: (timeMax || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      })

      const events = response.data.items || []

      return events.map((event) => ({
        id: event.id || "",
        summary: event.summary || "No Title",
        description: event.description,
        start: new Date(event.start?.dateTime || event.start?.date || ""),
        end: new Date(event.end?.dateTime || event.end?.date || ""),
        attendees: event.attendees?.map((a) => a.email || "") || [],
        location: event.location,
        meetingLink: event.hangoutLink,
        status: (event.status as any) || "confirmed",
      }))
    } catch (error) {
      console.error("Error fetching calendar events:", error)
      return []
    }
  }

  async checkEmployeeAvailability(
    employeeEmails: string[],
    startTime: Date,
    endTime: Date,
  ): Promise<EmployeeAvailability[]> {
    try {
      const response = await this.calendar.freebusy.query({
        requestBody: {
          timeMin: startTime.toISOString(),
          timeMax: endTime.toISOString(),
          items: employeeEmails.map((email) => ({ id: email })),
        },
      })

      const calendars = response.data.calendars || {}

      return employeeEmails.map((email) => {
        const busyTimes = calendars[email]?.busy || []
        const busySlots = busyTimes.map((busy) => ({
          start: new Date(busy.start || ""),
          end: new Date(busy.end || ""),
        }))

        return {
          email,
          name: email.split("@")[0], // Extract name from email
          available: busySlots.length === 0,
          busySlots,
        }
      })
    } catch (error) {
      console.error("Error checking availability:", error)
      return employeeEmails.map((email) => ({
        email,
        name: email.split("@")[0],
        available: true,
        busySlots: [],
      }))
    }
  }

  async scheduleSmartMeeting(request: string, attendeeEmails: string[]): Promise<CalendarEvent | null> {
    try {
      // Parse the natural language request
      const meetingDetails = await this.parseNaturalLanguageScheduling(request)

      if (!meetingDetails) {
        throw new Error("Could not parse meeting request")
      }

      // Check availability
      const availability = await this.checkEmployeeAvailability(
        attendeeEmails,
        meetingDetails.start,
        meetingDetails.end,
      )

      // Find available time slot if needed
      let finalStartTime = meetingDetails.start
      let finalEndTime = meetingDetails.end

      const unavailableAttendees = availability.filter((a) => !a.available)
      if (unavailableAttendees.length > 0) {
        // Try to find alternative time
        const alternativeTime = await this.findAlternativeTime(
          meetingDetails.start,
          meetingDetails.duration,
          attendeeEmails,
        )

        if (alternativeTime) {
          finalStartTime = alternativeTime.start
          finalEndTime = alternativeTime.end
        }
      }

      // Create the event
      const event = await this.createEvent({
        summary: meetingDetails.title,
        description: meetingDetails.description,
        start: finalStartTime,
        end: finalEndTime,
        attendees: attendeeEmails,
        location: meetingDetails.location,
      })

      return event
    } catch (error) {
      console.error("Error scheduling smart meeting:", error)
      return null
    }
  }

  private async parseNaturalLanguageScheduling(request: string) {
    try {
      const prompt = `Parse this meeting request and extract the details in JSON format:

"${request}"

Extract:
- title: meeting title/subject
- start: start date/time (ISO format)
- duration: duration in minutes
- description: meeting description
- location: meeting location (if mentioned)

Current date/time: ${new Date().toISOString()}

Return only valid JSON:`

      const response = await generateResponse(prompt)
      const parsed = JSON.parse(response)

      return {
        title: parsed.title || "Meeting",
        start: new Date(parsed.start),
        end: new Date(new Date(parsed.start).getTime() + (parsed.duration || 60) * 60000),
        duration: parsed.duration || 60,
        description: parsed.description || "",
        location: parsed.location || "",
      }
    } catch (error) {
      console.error("Error parsing natural language:", error)
      return null
    }
  }

  private async findAlternativeTime(preferredStart: Date, duration: number, attendeeEmails: string[]) {
    // Try next few hours
    for (let i = 1; i <= 24; i++) {
      const newStart = new Date(preferredStart.getTime() + i * 60 * 60 * 1000)
      const newEnd = new Date(newStart.getTime() + duration * 60 * 1000)

      const availability = await this.checkEmployeeAvailability(attendeeEmails, newStart, newEnd)

      if (availability.every((a) => a.available)) {
        return { start: newStart, end: newEnd }
      }
    }

    return null
  }

  async createEvent(eventData: {
    summary: string
    description?: string
    start: Date
    end: Date
    attendees: string[]
    location?: string
  }): Promise<CalendarEvent | null> {
    try {
      const response = await this.calendar.events.insert({
        calendarId: "primary",
        conferenceDataVersion: 1,
        requestBody: {
          summary: eventData.summary,
          description: eventData.description,
          start: {
            dateTime: eventData.start.toISOString(),
            timeZone: "UTC",
          },
          end: {
            dateTime: eventData.end.toISOString(),
            timeZone: "UTC",
          },
          attendees: eventData.attendees.map((email) => ({ email })),
          location: eventData.location,
          conferenceData: {
            createRequest: {
              requestId: Math.random().toString(36).substring(7),
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          },
        },
      })

      const event = response.data

      return {
        id: event.id || "",
        summary: event.summary || "",
        description: event.description,
        start: new Date(event.start?.dateTime || ""),
        end: new Date(event.end?.dateTime || ""),
        attendees: event.attendees?.map((a) => a.email || "") || [],
        location: event.location,
        meetingLink: event.hangoutLink,
        status: "confirmed",
      }
    } catch (error) {
      console.error("Error creating event:", error)
      return null
    }
  }
}
