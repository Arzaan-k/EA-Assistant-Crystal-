import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { performRAGQuery } from "@/lib/rag"
import { generateResponse } from "@/lib/gemini"
import type { RAGResult } from "@/lib/rag"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const { query, maxResults = 3 } = await request.json()
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: "Query is required and must be a string" }, { status: 400 })
    }

    // Get relevant document chunks using RAG
    const ragResult = await performRAGQuery(query, session.user.id, maxResults)
    
    if (ragResult.sources.length === 0) {
      // If no relevant chunks found, generate a response without context
      const response = await generateResponse(query)
      return NextResponse.json({
        answer: response,
        sources: []
      })
    }

    // Generate a response using the retrieved context
    const context = ragResult.sources.map(s => s.content).join('\n\n')
    const response = await generateResponse(query, context)

    return NextResponse.json({
      answer: response,
      sources: ragResult.sources
    })
  } catch (error) {
    console.error("RAG query error:", error)
    return NextResponse.json({ error: "Failed to process query" }, { status: 500 })
  }
}
