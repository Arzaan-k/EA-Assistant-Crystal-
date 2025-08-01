# Crystal AI Assistant - Production Deployment Guide

## 🚀 Quick Deploy to Vercel

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Neon Database**: Create account at [neon.tech](https://neon.tech)
3. **Google Cloud Project**: Set up at [console.cloud.google.com](https://console.cloud.google.com)
4. **Google AI Studio**: Get Gemini API key at [aistudio.google.com](https://aistudio.google.com)

### Step 1: Database Setup (Neon)

1. Create a new Neon project
2. Copy the connection string
3. Run the database initialization:
   \`\`\`sql
   -- Copy and run the contents of scripts/init-database.sql
   \`\`\`

### Step 2: Google Cloud Setup

1. **Create OAuth 2.0 Credentials**:
   - Go to Google Cloud Console → APIs & Services → Credentials
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URIs:
     - `https://your-domain.vercel.app/api/auth/google/callback`
     - `http://localhost:3000/api/auth/google/callback` (for development)

2. **Enable Required APIs**:
   - Gmail API
   - Google Calendar API
   - Google People API

3. **Create API Key**:
   - Go to Credentials → Create Credentials → API Key
   - Restrict to Gmail, Calendar, and People APIs

### Step 3: Get Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com)
2. Create a new API key
3. Copy the key for environment variables

### Step 4: Deploy to Vercel

#### Option A: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/crystal-ai-assistant)

#### Option B: Manual Deploy

1. **Install Vercel CLI**:
   \`\`\`bash
   npm install -g vercel
   \`\`\`

2. **Login to Vercel**:
   \`\`\`bash
   vercel login
   \`\`\`

3. **Deploy**:
   \`\`\`bash
   vercel --prod
   \`\`\`

### Step 5: Environment Variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

\`\`\`env
# Database
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
POSTGRES_URL=postgresql://username:password@host/database?sslmode=require
POSTGRES_PRISMA_URL=postgresql://username:password@host/database?sslmode=require&pgbouncer=true&connect_timeout=15
POSTGRES_URL_NON_POOLING=postgresql://username:password@host/database?sslmode=require

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_API_KEY=your-google-api-key

# AI Services
GEMINI_API_KEY=your-gemini-api-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
\`\`\`

### Step 6: Domain Configuration

1. **Custom Domain** (Optional):
   - Go to Vercel Dashboard → Project → Settings → Domains
   - Add your custom domain
   - Update Google OAuth redirect URIs

2. **SSL Certificate**:
   - Automatically handled by Vercel

### Step 7: Post-Deployment Setup

1. **Test Authentication**:
   - Visit your deployed app
   - Test Google OAuth login
   - Verify domain restriction (@crystalgroup.in)

2. **Initialize Database**:
   - The database should auto-initialize on first API call
   - Verify tables are created correctly

3. **Test Integrations**:
   - Email sync functionality
   - Calendar integration
   - Document upload and processing
   - Voice assistant (requires HTTPS)
   - Task delegation and reminders

## 🔧 Production Configuration

### Performance Optimizations

1. **Database Connection Pooling**: Already configured with Neon
2. **API Route Optimization**: 30-second timeout for AI operations
3. **Image Optimization**: Next.js automatic optimization
4. **Static Asset Caching**: Vercel CDN

### Security Features

1. **Domain Restriction**: OAuth limited to @crystalgroup.in
2. **Environment Variables**: Secure server-side storage
3. **HTTPS Only**: Enforced by Vercel
4. **Cookie Security**: HttpOnly, Secure flags in production

### Monitoring & Logging

1. **Health Check Endpoint**: `/api/health`
2. **Error Tracking**: Built-in Next.js error boundaries
3. **Performance Monitoring**: Vercel Analytics (optional)

## 🚨 Troubleshooting

### Common Issues

1. **OAuth Redirect Mismatch**:
   - Verify redirect URIs in Google Cloud Console
   - Ensure NEXT_PUBLIC_APP_URL matches your domain

2. **Database Connection Issues**:
   - Check DATABASE_URL format
   - Verify Neon database is active
   - Test connection with health check endpoint

3. **API Rate Limits**:
   - Google APIs have daily quotas
   - Gemini API has rate limits
   - Monitor usage in respective consoles

4. **Voice Assistant Not Working**:
   - Requires HTTPS (works in production)
   - Check browser permissions
   - Verify microphone access

### Support

- **Health Check**: `https://your-domain.vercel.app/api/health`
- **Logs**: Vercel Dashboard → Project → Functions tab
- **Database**: Neon Console for database monitoring

## 📊 Production Checklist

- [ ] Database initialized and connected
- [ ] Google OAuth configured and working
- [ ] Gmail API integration tested
- [ ] Calendar API integration tested
- [ ] Gemini AI responses working
- [ ] Document upload and RAG functional
- [ ] Voice assistant working (HTTPS required)
- [ ] Task delegation sending emails
- [ ] Reminder notifications active
- [ ] Health check endpoint responding
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Performance monitoring enabled

## 🔄 Updates and Maintenance

### Automated Deployments

Connect your GitHub repository to Vercel for automatic deployments on push to main branch.

### Database Migrations

For schema changes:
1. Update `lib/db/schema.ts`
2. Create migration script in `scripts/`
3. Run migration after deployment

### Environment Updates

Update environment variables through Vercel Dashboard and redeploy if needed.

---

**🎉 Your Crystal AI Executive Assistant is now live in production!**

Access your deployed application at: `https://your-domain.vercel.app`
