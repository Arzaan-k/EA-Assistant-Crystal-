// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { documentChunks, chatSessions, chatMessages } from '@/lib/db/schema';
import { sql, desc, eq } from 'drizzle-orm';
import { generateEmbedding, generateRAGResponse, cosineSimilarity } from '@/lib/utils/rag';

interface ChatRequest {
  message: string;
  sessionId?: number;
  sessionTitle?: string;
}

interface RetrievedChunk {
  id: number;
  content: string;
  similarity: number;
  documentTitle: string;
  documentId: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, sessionId, sessionTitle }: ChatRequest = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);

    // Create or get chat session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const [newSession] = await db.insert(chatSessions).values({
        userId,
        title: sessionTitle || `Chat ${new Date().toLocaleDateString()}`,
      }).returning();
      currentSessionId = newSession.id;
    }

    // Generate embedding for the user's question
    const questionEmbedding = await generateEmbedding(message);

    // Retrieve relevant document chunks using vector similarity
    // This is a simplified version - in production, you'd use pgvector
    const allChunks = await db.select({
      id: documentChunks.id,
      content: documentChunks.content,
      embedding: documentChunks.embedding,
      documentId: documentChunks.documentId,
      documentTitle: sql<string>`d.title`,
    })
    .from(documentChunks)
    .innerJoin(
      sql`documents d`, 
      sql`d.id = ${documentChunks.documentId} AND d.user_id = ${userId}`
    );

    // Calculate similarities and get top relevant chunks
    const chunksWithSimilarity: RetrievedChunk[] = allChunks
      .map(chunk => ({
        id: chunk.id,
        content: chunk.content,
        similarity: cosineSimilarity(questionEmbedding, chunk.embedding as number[]),
        documentTitle: chunk.documentTitle,
        documentId: chunk.documentId,
      }))
      .filter(chunk => chunk.similarity > 0.1) // Filter out very low similarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5); // Get top 5 most relevant chunks

    // Get conversation history for context
    const recentMessages = await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, currentSessionId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(10);

    const conversationHistory = recentMessages
      .reverse()
      .map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

    // Generate AI response using retrieved context
    const context = chunksWithSimilarity.map(chunk => chunk.content);
    const aiResponse = await generateRAGResponse(message, context, conversationHistory);

    // Save user message
    await db.insert(chatMessages).values({
      sessionId: currentSessionId,
      role: 'user',
      content: message,
    });

    // Save AI response with sources
    const sources = chunksWithSimilarity.map(chunk => ({
      chunkId: chunk.id,
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle,
      similarity: chunk.similarity,
      excerpt: chunk.content.substring(0, 200) + '...',
    }));

    await db.insert(chatMessages).values({
      sessionId: currentSessionId,
      role: 'assistant',
      content: aiResponse,
      sources: sources,
    });

    return NextResponse.json({
      response: aiResponse,
      sessionId: currentSessionId,
      sources: sources,
      retrievedChunks: chunksWithSimilarity.length,
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' }, 
      { status: 500 }
    );
  }
}

// Get chat sessions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      // Get specific session with messages
      const messages = await db.select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, parseInt(sessionId)))
        .orderBy(chatMessages.createdAt);

      return NextResponse.json({ messages });
    } else {
      // Get all user's chat sessions
      const sessions = await db.select()
        .from(chatSessions)
        .where(eq(chatSessions.userId, parseInt(session.user.id)))
        .orderBy(desc(chatSessions.updatedAt));

      return NextResponse.json({ sessions });
    }

  } catch (error) {
    console.error('Error fetching chat data:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}