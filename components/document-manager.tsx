"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Search, Download, Brain, CheckCircle, Clock, Loader2 } from "lucide-react"
import { DocumentUpload } from "./document-upload"
import { DocumentList } from "./document-list"
import { RAGQueryInterface } from "./rag-query-interface"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"

interface Document {
  id: number
  filename: string
  originalName: string
  size: number
  mimeType: string
  uploadedAt: string
  processedAt?: string
  isProcessed: boolean
  summary?: string
  chunksCount?: number
}

const mockDocuments: Document[] = [
  {
    id: 1,
    filename: "q4-financial-report.pdf",
    originalName: "Q4 Financial Report 2024.pdf",
    size: 2048576,
    mimeType: "application/pdf",
    uploadedAt: "2024-01-15T10:30:00Z",
    processedAt: "2024-01-15T10:32:00Z",
    isProcessed: true,
    summary: "Comprehensive financial analysis for Q4 2024 showing 15% revenue growth...",
    chunksCount: 24,
  },
  {
    id: 2,
    filename: "marketing-strategy-2025.docx",
    originalName: "Marketing Strategy 2025.docx",
    size: 1536000,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    uploadedAt: "2024-01-14T14:20:00Z",
    processedAt: "2024-01-14T14:22:00Z",
    isProcessed: true,
    summary: "Strategic marketing plan for 2025 focusing on digital transformation...",
    chunksCount: 18,
  },
  {
    id: 3,
    filename: "employee-handbook.pdf",
    originalName: "Employee Handbook v3.2.pdf",
    size: 3072000,
    mimeType: "application/pdf",
    uploadedAt: "2024-01-13T09:15:00Z",
    isProcessed: false,
    summary: undefined,
    chunksCount: 0,
  },
]

export function DocumentManager() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { data: session } = useSession()

  // Fetch documents on component mount
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!session?.user?.id) return
      
      try {
        setIsLoading(true)
        const response = await fetch('/api/documents')
        
        if (response.ok) {
          const data = await response.json()
          setDocuments(data.documents || [])
        }
      } catch (error) {
        console.error('Error fetching documents:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchDocuments()
  }, [session])

  const handleDocumentDelete = (id: number) => {
    setDocuments(documents.filter((doc) => doc.id !== id))
  }
  
  const handleDocumentUploadComplete = (document: Document) => {
    setDocuments((prevDocuments) => [document, ...prevDocuments])
    setIsUploading(false)
  }

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const stats = {
    total: documents.length,
    processed: documents.filter((d) => d.isProcessed).length,
    processing: documents.filter((d) => !d.isProcessed).length,
    totalSize: documents.reduce((acc, doc) => acc + doc.size, 0),
    totalChunks: documents.reduce((acc, doc) => acc + (doc.chunksCount || 0), 0),
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Document Management</h2>
          <p className="text-muted-foreground">Upload, process, and query your documents with AI</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Documents</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Processed</p>
                <p className="text-2xl font-bold">{stats.processed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Processing</p>
                <p className="text-2xl font-bold">{stats.processing}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Vector Chunks</p>
                <p className="text-2xl font-bold">{stats.totalChunks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Total Size</p>
                <p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">Document Library</TabsTrigger>
          <TabsTrigger value="upload">Upload Documents</TabsTrigger>
          <TabsTrigger value="query">RAG Query</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <Input
                  placeholder="Search documents by name or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Document List */}
          <DocumentList
            documents={filteredDocuments}
            onDocumentSelect={setSelectedDocument}
            onDocumentDelete={handleDocumentDelete}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <DocumentUpload
            onUploadStart={() => setIsUploading(true)}
            onUploadComplete={handleDocumentUploadComplete}
          />
        </TabsContent>

        <TabsContent value="query" className="space-y-4">
          <RAGQueryInterface documents={documents.filter((d) => d.isProcessed)} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
