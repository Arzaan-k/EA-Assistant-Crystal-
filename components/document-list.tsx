"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { FileText, Trash2, Eye, Download, Calendar, HardDrive, Layers, CheckCircle, Clock, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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

interface DocumentListProps {
  documents: Document[]
  onDocumentSelect: (document: Document) => void
  onDocumentDelete: (id: number) => void
  isLoading?: boolean
}

export function DocumentList({ documents, onDocumentSelect, onDocumentDelete, isLoading = false }: DocumentListProps) {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const { toast } = useToast()

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) return "📄"
    if (mimeType.includes("word")) return "📝"
    if (mimeType.includes("text")) return "📃"
    if (mimeType.includes("json")) return "🔧"
    if (mimeType.includes("csv")) return "📊"
    return "📄"
  }

  const getStatusBadge = (document: Document) => {
    if (document.isProcessed) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Processed
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
          <Clock className="h-3 w-3 mr-1" />
          Processing
        </Badge>
      )
    }
  }

  const handleDeleteDocument = async (id: number) => {
    try {
      setDeletingId(id)
      
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete document')
      }
      
      onDocumentDelete(id)
      toast({
        title: "Document deleted",
        description: "The document has been successfully deleted.",
      })
    } catch (error: any) {
      console.error('Error deleting document:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex justify-center items-center space-x-2">
            <div className="animate-spin">
              <Loader2 className="h-8 w-8 text-primary" />
            </div>
            <p>Loading documents...</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No documents found</h3>
          <p className="text-muted-foreground">
            Upload some documents to get started with AI-powered document processing.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {documents.map((document) => (
        <Card key={document.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* File Icon */}
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-lg">{getFileIcon(document.mimeType)}</AvatarFallback>
              </Avatar>

              {/* Document Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium truncate">{document.originalName}</h3>
                  {getStatusBadge(document)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    {formatFileSize(document.size)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(document.uploadedAt)}
                  </div>
                  {document.chunksCount && (
                    <div className="flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      {document.chunksCount} chunks
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {document.mimeType.split("/")[1]?.toUpperCase() || "FILE"}
                  </div>
                </div>

                {document.summary && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{document.summary}</p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedDoc(document)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{document.originalName}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">File Size:</span> {formatFileSize(document.size)}
                          </div>
                          <div>
                            <span className="font-medium">Type:</span> {document.mimeType}
                          </div>
                          <div>
                            <span className="font-medium">Uploaded:</span> {formatDate(document.uploadedAt)}
                          </div>
                          {document.processedAt && (
                            <div>
                              <span className="font-medium">Processed:</span> {formatDate(document.processedAt)}
                            </div>
                          )}
                        </div>

                        {document.summary && (
                          <div>
                            <h4 className="font-medium mb-2">AI Summary</h4>
                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">{document.summary}</p>
                          </div>
                        )}

                        {document.chunksCount && (
                          <div>
                            <h4 className="font-medium mb-2">Processing Details</h4>
                            <div className="bg-muted p-3 rounded-lg text-sm">
                              <p>✅ Document successfully processed into {document.chunksCount} semantic chunks</p>
                              <p>✅ Vector embeddings generated for semantic search</p>
                              <p>✅ Ready for RAG queries and AI assistance</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteDocument(document.id)}
                    className="text-red-600 hover:text-red-700"
                    disabled={deletingId === document.id}
                  >
                    {deletingId === document.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
