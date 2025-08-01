import { db } from "./db"
import { documentChunks, documents } from "./schema"
import { generateEmbedding, generateResponse } from "./gemini"
import { documentChunks, documents } from "./schema"
import { generateEmbedding, generateResponse } from "./gemini"
import { cosineSimilarity } from "./document-processor"
import { eq } from "drizzle-orm"
import { db } from "./db"

export interface RAGResult {
  answer: string
  sources: Array<{
    documentId: number
    documentName: string
    content: string
    similarity: number
  }>
}

export async function performRAGQuery(query: string, userId: number, topK = 5): Promise<RAGResult> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Get all document chunks for the user
    const chunks = await db
      .select({
        id: documentChunks.id,
        documentId: documentChunks.documentId,
        content: documentChunks.content,
        embedding: documentChunks.embedding,
        documentName: documents.originalName,
      })
      .from(documentChunks)
      .leftJoin(documents, eq(documentChunks.documentId, documents.id))
      .where(eq(documents.userId, userId));

    if (chunks.length === 0) {
      return {
        answer: "I don't have any documents to search through. Please upload some documents first.",
        sources: [],
      };
    }

    // Calculate similarity manually
    const similarities = chunks.map((chunk) => {
      try {
        const embedding = chunk.embedding ? JSON.parse(chunk.embedding) : [];
        return {
          chunk,
          similarity: cosineSimilarity(queryEmbedding, embedding)
        };
      } catch (e) {
        console.error("Error parsing embedding:", e);
        return { chunk, similarity: 0 };
      }
    });

    // Sort by similarity and take top K
    const topResults = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    // Create context from top similar chunks
    const context = topResults
      .map(result => `Document: ${result.chunk.documentName}\nContent: ${result.chunk.content}`)
      .join("\n\n---\n\n");

    // Generate response
    const answer = await generateResponse(query, context);

    return {
      answer,
      sources: topResults.map(result => ({
        documentId: result.chunk.documentId!,
        documentName: result.chunk.documentName!,
        content: result.chunk.content.slice(0, 200) + "...",
        similarity: result.similarity,
      })),
    };
  } catch (error) {
    console.error("Error performing RAG query:", error);
    return {
      answer: "I encountered an error while searching through your documents. Please try again.",
      sources: [],
    };
  }
}
