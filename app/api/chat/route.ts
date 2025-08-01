import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, conversations, messages } from "@/lib/schema"
import { generateResponse } from "@/lib/gemini"
import { performRAGQuery } from "@/lib/rag"
import { TaskDelegationService } from "@/lib/task-delegation"
import { eq, desc } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get("user_id")?.value
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, Number.parseInt(userId)))
      .limit(1)
    if (!user[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    const { message, conversationId } = await request.json()

    // Get or create conversation
    let conversation
    if (conversationId) {
      const existing = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1)
      conversation = existing[0]
    } else {
      ;[conversation] = await db
        .insert(conversations)
        .values({
          userId: user[0].id,
          title: message.slice(0, 50) + "...",
        })
        .returning()
    }

    // Save user message
    await db.insert(messages).values({
      conversationId: conversation.id,
      userId: user[0].id,
      role: "user",
      content: message,
    })

    // Initialize task delegation service
    const taskService = user[0].accessToken ? new TaskDelegationService(user[0].accessToken) : null

    // Process task delegation if applicable
    let taskResponse = ""
    if (taskService) {
      taskResponse = await taskService.processAIMessage(message, user[0].email, user[0].id)
    }

    // Get conversation history for context
    const recentMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversation.id))
      .orderBy(desc(messages.createdAt))
      .limit(10)

    const conversationHistory = recentMessages
      .reverse()
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n")

    // Check if query needs RAG
    let ragContext = "";
    let ragSources: { documentName: string; content: string }[] = [];

    const ragResult = await performRAGQuery(message, user[0].id);
    if (ragResult.sources.length > 0) {
      ragSources = ragResult.sources;
      ragContext = `\n\nDocument Context:\n${ragSources.map((s) => `${s.documentName}: ${s.content}`).join("\n")}`;
    }

    // Generate AI response
    const systemPrompt = `You are Crystal AI, an executive assistant for Crystal Group. You have access to:
- Email management and analysis
- Calendar scheduling and management  
- KPI analytics and business insights
- Document processing and search
- Task delegation and reminders

Current conversation history:
${conversationHistory}

${ragContext}

${taskResponse ? `Task/Reminder processed: ${taskResponse}` : ""}

Provide helpful, professional responses. If you delegated a task or set a reminder, mention it in your response.`

    const aiResponse = await generateResponse(message, systemPrompt, ragContext)

    // Save AI response
    const [savedMessage] = await db
      .insert(messages)
      .values({
        conversationId: conversation.id,
        userId: user[0].id,
        role: "assistant",
        content: aiResponse,
        metadata: {
          hasRAG: ragSources.length > 0,
          hasTaskDelegation: !!taskResponse,
          ragSources: ragSources.length > 0 ? ragSources : null,
        },
      })
      .returning()

    return NextResponse.json({
      message: aiResponse,
      conversationId: conversation.id,
      messageId: savedMessage.id,
      taskProcessed: !!taskResponse,
    })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json({ error: "Failed to process chat message" }, { status: 500 })
  }
}
