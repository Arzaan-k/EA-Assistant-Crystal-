# Crystal AI Assistant Deployment Script
echo "🚀 Deploying Crystal AI Assistant to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Login to Vercel (if not already logged in)
echo "🔐 Checking Vercel authentication..."
vercel whoami || vercel login

# Set environment variables
echo "⚙️ Setting up environment variables..."

# Database (Neon)
vercel env add DATABASE_URL production
vercel env add POSTGRES_URL production
vercel env add POSTGRES_PRISMA_URL production
vercel env add POSTGRES_URL_NON_POOLING production

# Google OAuth & APIs
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add GOOGLE_API_KEY production

# AI Services
vercel env add GEMINI_API_KEY production

# App Configuration
vercel env add NEXT_PUBLIC_APP_URL production

# Deploy to production
echo "🚀 Deploying to production..."
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Your Crystal AI Assistant is now live!"

# Run post-deployment health check
echo "🔍 Running health check..."
sleep 10
curl -f "$(vercel ls --scope=team | grep crystal-ai | awk '{print $2}')/api/health" || echo "⚠️ Health check failed - please verify manually"

echo "📋 Post-deployment checklist:"
echo "1. ✅ Verify Google OAuth redirect URIs"
echo "2. ✅ Test email synchronization"
echo "3. ✅ Test calendar integration"
echo "4. ✅ Test document upload and RAG"
echo "5. ✅ Test voice assistant functionality"
echo "6. ✅ Test task delegation and reminders"
