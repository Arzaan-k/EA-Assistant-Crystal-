import { NextResponse } from 'next/server';
import { generateResponse } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { subject, body } = await request.json();

    if (!subject || !body) {
      return NextResponse.json(
        { error: 'Subject and body are required.' },
        { status: 400 }
      );
    }

    // Strip HTML tags from the body to create a cleaner prompt for the AI
    const plainTextBody = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    const prompt = `Please provide a concise, one-paragraph summary of the following email. Focus on the key message and any required actions. Email Subject: "${subject}". Email Body: "${plainTextBody.substring(0, 2000)}"`;

    const summary = await generateResponse(prompt);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error generating summary:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json(
      { error: `Failed to generate summary: ${errorMessage}` },
      { status: 500 }
    );
  }
}
