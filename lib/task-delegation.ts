import { generateResponse } from "./gemini"
import { GmailService } from "./gmail"
import { db } from "./db"
import { tasks, reminders } from "./schema"

export interface Task {
  id: number
  title: string
  description: string
  assignedTo: string
  assignedBy: string
  deadline?: Date
  priority: "high" | "medium" | "low"
  status: "pending" | "in_progress" | "completed" | "cancelled"
  createdAt: Date
  completedAt?: Date
}

export interface Reminder {
  id: number
  userId: number
  title: string
  description: string
  reminderTime: Date
  isCompleted: boolean
  createdAt: Date
}

export class TaskDelegationService {
  private gmailService: GmailService

  constructor(accessToken: string) {
    this.gmailService = new GmailService(accessToken)
  }

  async parseTaskFromMessage(
    message: string,
    ceoEmail: string,
  ): Promise<{
    type: "task" | "reminder" | "other"
    data: any
  }> {
    try {
      const prompt = `Analyze this message from a CEO and determine if it's a task delegation, reminder request, or other:

Message: "${message}"

If it's a TASK DELEGATION, extract:
- assignee_email: who should receive the task
- task_title: brief title
- task_description: detailed description
- deadline: when it's due (ISO format)
- priority: high/medium/low

If it's a REMINDER, extract:
- reminder_title: what to remind about
- reminder_description: details
- reminder_time: when to remind (ISO format)

Return JSON with:
{
  "type": "task" | "reminder" | "other",
  "data": { extracted fields }
}

Current date/time: ${new Date().toISOString()}`

      const response = await generateResponse(prompt)
      const parsed = JSON.parse(response)

      return parsed
    } catch (error) {
      console.error("Error parsing task from message:", error)
      return { type: "other", data: {} }
    }
  }

  async delegateTask(taskData: {
    title: string
    description: string
    assignedTo: string
    assignedBy: string
    deadline?: Date
    priority: "high" | "medium" | "low"
  }): Promise<Task | null> {
    try {
      // Save task to database
      const [task] = await db
        .insert(tasks)
        .values({
          title: taskData.title,
          description: taskData.description,
          assignedTo: taskData.assignedTo,
          assignedBy: taskData.assignedBy,
          deadline: taskData.deadline,
          priority: taskData.priority,
          status: "pending",
          createdAt: new Date(),
        })
        .returning()

      // Send email to assignee
      const emailSubject = `New Task Assignment: ${taskData.title}`
      const emailBody = this.generateTaskEmail(taskData)

      const emailSent = await this.gmailService.sendEmail(taskData.assignedTo, emailSubject, emailBody)

      if (!emailSent) {
        console.error("Failed to send task email")
      }

      return {
        id: task.id,
        title: task.title,
        description: task.description,
        assignedTo: task.assignedTo,
        assignedBy: task.assignedBy,
        deadline: task.deadline,
        priority: task.priority,
        status: task.status,
        createdAt: task.createdAt,
      }
    } catch (error) {
      console.error("Error delegating task:", error)
      return null
    }
  }

  private generateTaskEmail(taskData: {
    title: string
    description: string
    assignedBy: string
    deadline?: Date
    priority: "high" | "medium" | "low"
  }): string {
    const priorityEmoji = {
      high: "🔴",
      medium: "🟡",
      low: "🟢",
    }

    return `
Dear Team Member,

You have been assigned a new task by ${taskData.assignedBy}.

${priorityEmoji[taskData.priority]} **Task: ${taskData.title}**

**Description:**
${taskData.description}

${taskData.deadline ? `**Deadline:** ${taskData.deadline.toLocaleDateString()} at ${taskData.deadline.toLocaleTimeString()}` : ""}

**Priority:** ${taskData.priority.toUpperCase()}

Please confirm receipt of this task and provide updates on your progress.

Best regards,
Crystal AI Executive Assistant

---
This is an automated message from the Crystal Group AI system.
    `.trim()
  }

  async createReminder(reminderData: {
    userId: number
    title: string
    description: string
    reminderTime: Date
  }): Promise<Reminder | null> {
    try {
      const [reminder] = await db
        .insert(reminders)
        .values({
          userId: reminderData.userId,
          title: reminderData.title,
          description: reminderData.description,
          reminderTime: reminderData.reminderTime,
          isCompleted: false,
          createdAt: new Date(),
        })
        .returning()

      return {
        id: reminder.id,
        userId: reminder.userId,
        title: reminder.title,
        description: reminder.description,
        reminderTime: reminder.reminderTime,
        isCompleted: reminder.isCompleted,
        createdAt: reminder.createdAt,
      }
    } catch (error) {
      console.error("Error creating reminder:", error)
      return null
    }
  }

  async processAIMessage(message: string, ceoEmail: string, userId: number): Promise<string> {
    const parsed = await this.parseTaskFromMessage(message, ceoEmail)

    if (parsed.type === "task" && parsed.data.assignee_email) {
      const task = await this.delegateTask({
        title: parsed.data.task_title,
        description: parsed.data.task_description,
        assignedTo: parsed.data.assignee_email,
        assignedBy: ceoEmail,
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : undefined,
        priority: parsed.data.priority || "medium",
      })

      if (task) {
        return `✅ Task "${task.title}" has been delegated to ${task.assignedTo}. Email sent with task details.`
      } else {
        return `❌ Failed to delegate task. Please try again.`
      }
    } else if (parsed.type === "reminder") {
      const reminder = await this.createReminder({
        userId,
        title: parsed.data.reminder_title,
        description: parsed.data.reminder_description,
        reminderTime: new Date(parsed.data.reminder_time),
      })

      if (reminder) {
        return `⏰ Reminder set: "${reminder.title}" for ${reminder.reminderTime.toLocaleString()}`
      } else {
        return `❌ Failed to create reminder. Please try again.`
      }
    }

    return ""
  }
}
