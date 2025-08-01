import { db } from '@/lib/db';
import { documents } from '@/lib/schema';
import { asc, desc, eq, sql } from 'drizzle-orm';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
// GET /api/documents - Retrieve all documents for the current user
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      console.error('Session user ID is missing or undefined');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log('Fetching documents for userId:', userId);
    
    // Fetch documents from the database
    const userDocuments = await db.query.documents.findMany({
      where: eq(documents.userId, userId),
      orderBy: sql.raw('createdAt DESC'),
    });

    return NextResponse.json(userDocuments.map(doc => ({
      id: doc.id,
      name: doc.originalName,
      isProcessed: doc.isProcessed,
      uploadedAt: doc.uploadedAt,
      processedAt: doc.processedAt,
      summary: doc.summary
    })));
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}