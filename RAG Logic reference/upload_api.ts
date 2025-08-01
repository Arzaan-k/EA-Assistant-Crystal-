// app/api/documents/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { documents, documentChunks } from '@/lib/db/schema';
import { 
  extractTextFromFile, 
  splitTextIntoChunks, 
  generateEmbeddings, 
  validateFile,
  countTokens 
} from '@/lib/utils/rag';

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Extract text from file
    let extractedText: string;
    try {
      extractedText = await extractTextFromFile(file);
    } catch (error) {
      console.error('Text extraction error:', error);
      return NextResponse.json(
        { error: 'Failed to extract text from file' }, 
        { status: 500 }
      );
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: 'No text content found in file' }, 
        { status: 400 }
      );
    }

    // Save document to database
    const [document] = await db.insert(documents).values({
      userId: parseInt(session.user.id),
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      content: extractedText,
      metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    }).returning();

    // Split text into chunks
    const chunks = await splitTextIntoChunks(extractedText);
    
    // Generate embeddings for all chunks
    const embeddings = await generateEmbeddings(chunks);

    // Save chunks with embeddings
    const chunkData = chunks.map((chunk, index) => ({
      documentId: document.id,
      chunkIndex: index,
      content: chunk,
      embedding: embeddings[index],
      tokenCount: countTokens(chunk),
    }));

    await db.insert(documentChunks).values(chunkData);

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        fileName: document.fileName,
        fileSize: document.fileSize,
        chunksCount: chunks.length,
        uploadedAt: document.uploadedAt,
      },
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Get user's documents
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userDocuments = await db.query.documents.findMany({
      where: (documents, { eq }) => eq(documents.userId, parseInt(session.user.id)),
      orderBy: (documents, { desc }) => desc(documents.uploadedAt),
      with: {
        chunks: {
          columns: {
            id: true,
          },
        },
      },
    });

    const documentsWithStats = userDocuments.map(doc => ({
      id: doc.id,
      title: doc.title,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      chunksCount: doc.chunks.length,
      uploadedAt: doc.uploadedAt,
    }));

    return NextResponse.json({ documents: documentsWithStats });

  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}