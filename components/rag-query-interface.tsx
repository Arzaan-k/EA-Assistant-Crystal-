"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Search, Brain, FileText, Zap, Copy, ThumbsUp, ThumbsDown, ExternalLink, Sparkles } from "lucide-react"
import { performRAGQuery } from "@/lib/rag"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"

interface Document {
  id: number
  filename: string
  originalName: string
  isProcessed: boolean
}

interface RAGQuery {
  id: number
  query: string
  answer: string
  sources: Array<{
    documentId: number
    documentName: string
    content: string
    similarity: number
  }>
  timestamp: Date
}

interface RAGQueryInterfaceProps {
  documents: Document[]
}

const sampleQueries = [
  "What are the key financial metrics from Q4?",
  "Summarize the marketing strategy for 2025",
  "What are the main HR policies for remote work?",
  "Find information about budget allocations",
  "What are the company's growth targets?",
  "Explain the new employee onboarding process",
]

export function RAGQueryInterface({ documents }: RAGQueryInterfaceProps) {
  const [query, setQuery] = useState("")
  const [isQuerying, setIsQuerying] = useState(false)
  const [queryHistory, setQueryHistory] = useState<RAGQuery[]>([])
  const { toast } = useToast()
  const { data: session } = useSession()

  const handleQuery = async () => {
    if (!query.trim()) return

    setIsQuerying(true)

    try {
      if (!session?.user?.id) {
        toast({
          title: "Error",
          description: "User not authenticated.",
        })
        return
      }

      // Call the RAG API endpoint
      const response = await fetch('/api/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process query')
      }

      const result = await response.json()

      const newQuery: RAGQuery = {
        id: Date.now(),
        query: query.trim(),
        answer: result.answer,
        sources: result.sources || [],
        timestamp: new Date(),
      }

      setQueryHistory((prev) => [newQuery, ...prev])
      setQuery("")
    } catch (error: any) {
      console.error("RAG query error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to retrieve answer. Please try again.",
      })
    } finally {
      setIsQuerying(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No processed documents</h3>
          <p className="text-muted-foreground">Upload and process some documents first to enable RAG queries.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Query Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            RAG Query Interface
            <Badge variant="secondary" className="ml-auto">
              {documents.length} documents indexed
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Query Input */}
          <div className="space-y-2">
            <Textarea
              placeholder="Ask anything about your documents... (e.g., 'What are the key financial metrics from Q4?')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                AI will search through {documents.length} processed documents
              </p>
              <Button onClick={handleQuery} disabled={!query.trim() || isQuerying}>
                {isQuerying ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Query Documents
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Sample Queries */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Try these sample queries:</p>
            <div className="flex flex-wrap gap-2">
              {sampleQueries.map((sampleQuery, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery(sampleQuery)}
                  className="text-xs"
                >
                  {sampleQuery}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Query Results */}
      {queryHistory.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Query Results</h3>
          {queryHistory.map((result) => (
            <Card key={result.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">"{result.query}"</h4>
                    <p className="text-xs text-muted-foreground">{result.timestamp.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(result.answer)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* AI Answer */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>
                        <Brain className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">AI Response</span>
                  </div>
                  <p className="text-sm leading-relaxed">{result.answer}</p>
                </div>

                {/* Sources */}
                {result.sources.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Sources ({result.sources.length})
                    </h5>
                    <div className="space-y-2">
                      {result.sources.map((source, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{source.documentName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {Math.round(source.similarity * 100)}% match
                              </Badge>
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{source.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* RAG Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            How RAG Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Search className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <h3 className="font-medium">1. Semantic Search</h3>
              <p className="text-sm text-muted-foreground">
                Your query is converted to embeddings and matched against document chunks
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <FileText className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <h3 className="font-medium">2. Context Retrieval</h3>
              <p className="text-sm text-muted-foreground">Most relevant document sections are retrieved as context</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Brain className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <h3 className="font-medium">3. AI Generation</h3>
              <p className="text-sm text-muted-foreground">
                AI generates accurate answers based on your document context
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
