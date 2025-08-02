import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing',
    googleApiKey: process.env.GOOGLE_API_KEY ? '✅ Set' : '❌ Missing',
    geminiApiKey: process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing',
    databaseUrl: process.env.DATABASE_URL ? '✅ Set' : '❌ Missing',
    nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL ? '✅ Set' : '❌ Missing',
  });
}
