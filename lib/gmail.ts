import { type gmail_v1, google } from "googleapis"
import { generateResponse } from "./gemini"

export interface EmailData {
  id: string
  userId: string
  threadId: string
  from: string
  to: string
  subject: string
  body: string
  date: Date
  category: "urgent" | "financial" | "internal" | "external" | "meetings" | "credit_card" | "general"
  priority: "high" | "medium" | "low"
  summary: string
  isRead: boolean
  labels: string[]
}

export class GmailService {
  private gmail: gmail_v1.Gmail
  private userId: string

  constructor(accessToken: string, userId: string) {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })
    this.gmail = google.gmail({ version: "v1", auth })
    this.userId = userId
  }

  async getEmails(maxResults = 50): Promise<EmailData[]> {
    try {
      const response = await this.gmail.users.messages.list({
        userId: this.userId,
        maxResults,
        q: "in:inbox",
      });

      const messages = response.data.messages || [];
      if (messages.length === 0) {
        return [];
      }

      const emailPromises = messages
        .filter(message => message.id)
        .map(message => this.getEmailById(message.id!));

      const resolvedEmails = await Promise.all(emailPromises);

      return resolvedEmails.filter((email): email is EmailData => email !== null);
    } catch (error) {
      console.error("Error fetching emails:", error);
      return [];
    }
  }

  async getEmailById(messageId: string): Promise<EmailData | null> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: this.userId,
        id: messageId,
        format: "full",
      })

      const message = response.data
      const headers = message.payload?.headers || []

      const getHeader = (name: string) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || ""

      const from = getHeader("from")
      const to = getHeader("to")
      const subject = getHeader("subject")
      const date = new Date(getHeader("date") || Date.now())

      // Function to find the best body part
      const findBodyPart = (parts: gmail_v1.Schema$MessagePart[], mimeType: string): string | null => {
        for (const part of parts) {
          if (part.mimeType === mimeType && part.body?.data) {
            return Buffer.from(part.body.data, 'base64').toString();
          }
          if (part.parts) {
            const nested = findBodyPart(part.parts, mimeType);
            if (nested) return nested;
          }
        }
        return null;
      };

      let body = "";
      if (message.payload?.parts) {
        body = findBodyPart(message.payload.parts, "text/html") || findBodyPart(message.payload.parts, "text/plain") || "";
      } else if (message.payload?.body?.data) {
        body = Buffer.from(message.payload.body.data, "base64").toString();
      }

      // AI categorization and prioritization in parallel
      const [category, priority] = await Promise.all([
        this.categorizeEmail(subject, body, from),
        this.prioritizeEmail(subject, body, from),
      ]);
      const summary = ""; // Summary will be generated on demand

      return {
        id: messageId,
        userId: this.userId,
        threadId: message.threadId || "",
        from,
        to,
        subject,
        body,
        date,
        category,
        priority,
        summary: summary, // This will be an empty string initially
        isRead: !message.labelIds?.includes("UNREAD"),
        labels: message.labelIds || [],
      }
    } catch (error) {
      console.error("Error fetching email:", error)
      return null
    }
  }

  private async categorizeEmail(subject: string, body: string, from: string): Promise<EmailData["category"]> {
    const content = `Subject: ${subject}\nFrom: ${from}\nBody: ${body.slice(0, 500)}`

    // Check for credit card related content
    const creditCardKeywords = [
      "credit card",
      "visa",
      "mastercard",
      "amex",
      "american express",
      "payment due",
      "statement",
      "transaction",
      "charge",
      "billing",
      "account balance",
      "minimum payment",
      "interest rate",
      "apr",
    ]

    const lowerContent = content.toLowerCase()
    if (creditCardKeywords.some((keyword) => lowerContent.includes(keyword))) {
      return "credit_card"
    }

    try {
      const prompt = `Categorize this email into one of these categories: urgent, financial, internal, external, meetings, general.
      
      Email content: ${content}
      
      Return only the category name.`

      const response = await generateResponse(prompt)
      const category = response.toLowerCase().trim()

      if (["urgent", "financial", "internal", "external", "meetings", "general"].includes(category)) {
        return category as EmailData["category"]
      }

      return "general"
    } catch (error) {
      console.error("Error categorizing email:", error)
      return "general"
    }
  }

  private async prioritizeEmail(subject: string, body: string, from: string): Promise<EmailData["priority"]> {
    try {
      const content = `Subject: ${subject}\nFrom: ${from}\nBody: ${body.slice(0, 300)}`

      const prompt = `Analyze this email and determine its priority level: high, medium, or low.
      
      Consider:
      - Urgency indicators (URGENT, ASAP, deadline)
      - Sender importance (CEO, CFO, board members)
      - Content importance (financial, legal, critical decisions)
      
      Email content: ${content}
      
      Return only: high, medium, or low`

      const response = await generateResponse(prompt)
      const priority = response.toLowerCase().trim()

      if (["high", "medium", "low"].includes(priority)) {
        return priority as EmailData["priority"]
      }

      return "medium"
    } catch (error) {
      console.error("Error prioritizing email:", error)
      return "medium"
    }
  }

  private async summarizeEmail(subject: string, body: string): Promise<string> {
    try {
      const prompt = `Summarize this email in 1-2 sentences, focusing on key points and action items.
      
      Subject: ${subject}
      Body: ${body.slice(0, 1000)}
      
      Provide a concise summary:`

      const response = await generateResponse(prompt)
      return response.trim()
    } catch (error) {
      console.error("Error summarizing email:", error)
      return `Email about: ${subject}`
    }
  }

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    try {
      const email = [`To: ${to}`, `Subject: ${subject}`, "", body].join("\n")

      const encodedEmail = Buffer.from(email).toString("base64url")

      await this.gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encodedEmail,
        },
      })

      return true
    } catch (error) {
      console.error("Error sending email:", error)
      return false
    }
  }
}
