import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { documents, documentChunks } from "@/lib/schema"
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { processDocument } from "@/lib/document-processor"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Process the document
    const processed = await processDocument(file)

    // Save document to database
    const [document] = await db
      .insert(documents)
      .values({
        userId,
        filename: file.name.toLowerCase().replace(/\s+/g, "-"),
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        content: processed.content,
        summary: processed.summary,
        metadata: processed.metadata,
        isProcessed: true,
        processedAt: new Date(),
      })
      .returning()

    // Save document chunks
    const chunkInserts = processed.chunks.map((chunk) => ({
      documentId: document.id,
      content: chunk.content,
      embedding: chunk.embedding,
      chunkIndex: chunk.chunkIndex,
      tokenCount: chunk.tokenCount,
      metadata: chunk.metadata,
    }))

    await db.insert(documentChunks).values(chunkInserts)

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        filename: document.filename,
        originalName: document.originalName,
        size: document.size,
        mimeType: document.mimeType,
        uploadedAt: document.uploadedAt,
        processedAt: document.processedAt,
        isProcessed: document.isProcessed,
        summary: document.summary,
        chunksCount: processed.chunks.length,
      },
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to process document" }, { status: 500 })
  }
}
