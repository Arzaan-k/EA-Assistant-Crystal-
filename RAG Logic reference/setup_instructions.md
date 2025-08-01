# RAG Document System Setup Guide

This is a complete RAG (Retrieval Augmented Generation) system that allows users to upload documents and ask AI-powered questions based on the content.

## Features

- **Document Upload**: Support for PDF, DOCX, TXT, and JSON files
- **Text Extraction**: Automatic text extraction from various file formats
- **Vector Embeddings**: Documents are automatically chunked and vectorized using OpenAI embeddings
- **Semantic Search**: Questions are matched against document chunks using cosine similarity
- **AI-Powered Responses**: GPT-4 generates responses based on retrieved context
- **Chat Interface**: Full chat history with source citations
- **User Authentication**: Secure user sessions with NextAuth

## Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** database with **pgvector** extension
3. **OpenAI API key**

## Installation Steps

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Database Setup

Install PostgreSQL and the pgvector extension:

```sql
-- Connect to your PostgreSQL database and run:
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- `DATABASE_URL`: Your PostgreSQL connection string
- `OPENAI_API_KEY`: Your OpenAI API key
- `NEXTAUTH_SECRET`: Random string for NextAuth
- `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for development)

### 4. Database Migration

Generate and run migrations:

```bash
npm run db:generate
npm run db:migrate
```

### 5. Start Development Server

```bash
npm run dev
```

## Usage

### 1. Upload Documents

- Navigate to the upload page
- Drag and drop or select files (PDF, DOCX, TXT, JSON)
- Files are automatically processed and vectorized

### 2. Ask Questions

- Use the chat interface to ask questions about your documents
- The AI will retrieve relevant chunks and provide context-aware answers
- Source citations show which documents were used

## Architecture

### Database Schema

- **users**: User accounts
- **documents**: Uploaded files metadata
- **document_chunks**: Text chunks with vector embeddings
- **chat_sessions**: Chat conversation sessions
- **chat_messages**: Individual messages with sources

### API Endpoints

- `POST /api/documents/upload`: Upload and process documents
- `GET /api/documents/upload`: List user's documents
- `POST /api/chat`: Send chat messages and get AI responses
- `GET /api/chat`: Get chat sessions and messages

### Processing Pipeline

1. **File Upload** → Text extraction
2. **Text Chunking** → Split into manageable pieces
3. **Vectorization** → Generate embeddings using OpenAI
4. **Storage** → Save to database with vector index
5. **Query** → Find relevant chunks using cosine similarity
6. **Generation** → Use GPT-4 to generate response with context

## Configuration Options

### Text Chunking

Modify in `lib/utils/rag.ts`:
```typescript
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,        // Characters per chunk
  chunkOverlap: 200,      // Overlap between chunks
  separators: ['\n\n', '\n', '. ', ' ', ''],
});
```

### Similarity Threshold

Adjust in `app/api/chat/route.ts`:
```typescript
.filter(chunk => chunk.similarity > 0.1) // Minimum similarity
.slice(0, 5); // Number of chunks to retrieve
```

### AI Model Settings

Configure in `lib/utils/rag.ts`:
```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview',
  temperature: 0.7,
  max_tokens: 1000,
});
```

## Production Deployment

### 1. Database Optimization

- Set up connection pooling
- Create indexes on frequently queried columns
- Consider using pgvector for better similarity search performance

### 2. File Storage

For production, consider storing files in:
- AWS S3
- Google Cloud Storage
- Azure Blob Storage

### 3. Caching

Implement caching for:
- Generated embeddings
- Frequently asked questions
- Document chunks

### 4. Security

- Implement rate limiting
- Add file upload validation
- Set up proper CORS policies
- Use environment-specific secrets

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Ensure pgvector extension is installed
   - Verify database permissions

2. **OpenAI API Errors**
   - Verify API key is correct
   - Check API quotas and billing
   - Monitor rate limits

3. **File Upload Issues**
   - Check file size limits (default 10MB)
   - Verify supported file types
   - Ensure proper error handling

4. **Embedding Generation Slow**
   - Consider batching embeddings
   - Implement background processing
   - Use smaller embedding models for testing

### Performance Tips

- Use database indexes on user_id and document_id
- Implement pagination for large document lists
- Consider background processing for large files
- Cache frequently accessed embeddings

## Extending the System

### Add New File Types

1. Extend `extractTextFromFile()` in `lib/utils/rag.ts`
2. Update file validation in upload component
3. Add appropriate text extraction libraries

### Improve Search

1. Implement hybrid search (keyword + semantic)
2. Add filters by document type or date
3. Use re-ranking algorithms

### Enhanced UI

1. Add document preview
2. Implement search within documents
3. Add export/import functionality

This system provides a solid foundation for a production-ready RAG application that can be extended based on specific requirements.