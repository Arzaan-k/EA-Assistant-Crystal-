import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: Request) {
  console.log('New upload endpoint hit!');
  
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      console.log('No file found in request');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('Received file:', file.name);
    
    // Just return a success response for now to test the endpoint
    return NextResponse.json({
      success: true,
      message: 'File received successfully',
      filename: file.name,
      size: file.size,
      type: file.type,
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
