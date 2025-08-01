import { generateEmbedding } from "./gemini"
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import * as pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export interface ProcessedDocument {
  content: string
  chunks: DocumentChunk[]
  summary: string
  metadata: Record<string, any>
}

export interface DocumentChunk {
  content: string
  embedding: number[]
        chunkIndex: number
        tokenCount: number
        metadata: Record<string, any>
      }

export async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  
  switch (file.type) {
    case 'application/pdf':
      const pdfData = await pdfParse(buffer);
      return pdfData.text;
    
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      const docxResult = await mammoth.extractRawText({ buffer });
      return docxResult.value;
    
    case 'text/plain':
      return buffer.toString('utf-8');
    
    case 'application/json':
      return buffer.toString('utf-8');
    
    default:
      // Try to parse as text
      return buffer.toString('utf-8');
  }
}

export async function chunkText(text: string, chunkSize = 1000, chunkOverlap = 200): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: ['\n\n', '\n', '. ', ' ', ''],
  });
  
  return await splitter.splitText(text);
}

export async function processDocument(file: File): Promise<ProcessedDocument> {
  try {
    // Extract text content
    const content = await extractTextFromFile(file)

    // Generate summary
    const summary = content.length > 500 ? `${content.slice(0, 500)}...` : content

    // Create chunks
    const textChunks = await chunkText(content)

    // Generate embeddings for each chunk
    const chunks: DocumentChunk[] = []
    for (let i = 0; i < textChunks.length; i++) {
      const embedding = await generateEmbedding(textChunks[i])
      const tokenCount = countTokens(textChunks[i]);
      chunks.push({
        content: textChunks[i],
        embedding,
        chunkIndex: i,
        tokenCount,
        metadata: {
          chunkSize: textChunks[i].length,
          position: i,
        },
      })
    }

    return {
      content,
      chunks,
      summary,
      metadata: {
        filename: file.name,
        size: file.size,
        type: file.type,
        chunksCount: chunks.length,
        processedAt: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error("Error processing document:", error)
    throw new Error("Failed to process document")
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

export function countTokens(text: string): number {
  // Rough approximation: 1 token \u2248 4 characters
  return Math.ceil(text.length / 4);
}
