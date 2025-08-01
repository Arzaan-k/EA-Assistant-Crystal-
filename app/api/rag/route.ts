import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { performRAGQuery } from "@/lib/rag"
import { generateResponse } from "@/lib/gemini"
import { authOptions } from "../auth/[...nextauth]/route"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { query, maxResults = 3 } = await request.json()
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: "Query is required and must be a string" }, { status: 400 })
    }

    // Get relevant document chunks using RAG
    const relevantChunks = await performRAGQuery(query, maxResults)
    
    if (!relevantChunks || relevantChunks.length === 0) {
      // If no relevant chunks found, generate a response without context
      const aiResponse = await generateResponse(query)
      
      return NextResponse.json({
        response: aiResponse,
        sources: [],
      })
    }

    // Format context from relevant chunks
    const context = relevantChunks
      .map(chunk => `Document: ${chunk.documentName}\n${chunk.content}`)
      .join('\n\n')

    // Generate AI response with context
    const aiResponse = await generateResponse(query, context)

    // Format sources for the frontend
    const sources = relevantChunks.map(chunk => ({
      documentId: chunk.documentId,
      documentName: chunk.documentName,
      content: chunk.content,
      similarity: chunk.similarity,
    }))

    const result = {
      response: aiResponse,
      sources,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("RAG query error:", error)
    return NextResponse.json({ error: "Failed to process query" }, { status: 500 })
  }
}
