"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useDropzone } from "react-dropzone"

interface UploadFile {
  file: File
  id: string
  progress: number
  status: "uploading" | "processing" | "completed" | "error"
  error?: string
}

interface DocumentUploadProps {
  onUploadComplete: (document: any) => void
}

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const filesToUploadRef = useRef<UploadFile[]>([]);

  // Process any pending uploads
  useEffect(() => {
    const processUploads = async () => {
      if (filesToUploadRef.current.length === 0) return;
      
      setIsUploading(true);
      const fileToUpload = filesToUploadRef.current[0];
      
      try {
        await simulateUpload(fileToUpload);
        // Remove the processed file from the queue
        filesToUploadRef.current = filesToUploadRef.current.slice(1);
        
        // Process next file if any
        if (filesToUploadRef.current.length > 0) {
          processUploads();
        } else {
          setIsUploading(false);
        }
      } catch (error) {
        console.error('Upload error:', error);
        setIsUploading(false);
      }
    };
    
    if (!isUploading && filesToUploadRef.current.length > 0) {
      processUploads();
    }
  }, [isUploading, uploadFiles]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const newFiles = acceptedFiles.map((file) => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
        status: "uploading" as const,
      }));

      setUploadFiles((prev) => {
        const updatedFiles = [...prev, ...newFiles];
        filesToUploadRef.current = [...filesToUploadRef.current, ...newFiles];
        return updatedFiles;
      });
    },
    [onUploadComplete]
  )

  const simulateUpload = async (uploadFile: UploadFile) => {
    try {
      // Update progress to show upload starting
      setUploadFiles((prev) =>
        prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 10 } : f))
      )

      // Create form data for file upload
      const formData = new FormData()
      formData.append('file', uploadFile.file)

      // Upload the file to the new endpoint
      const response = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      // Update to processing state
      setUploadFiles((prev) =>
        prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "processing", progress: 50 } : f)),
      )

      // Get the processed document data
      const data = await response.json()

      // Complete
      setUploadFiles((prev) =>
        prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "completed", progress: 100 } : f)),
      )

      // Pass the document data to parent component
      onUploadComplete(data.document)
    } catch (error) {
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: "error",
                error: "Upload failed. Please try again.",
              }
            : f,
        ),
      )
    }

    // Check if all uploads are complete
    setUploadFiles((prev) => {
      const allComplete = prev.every((f) => f.status === "completed" || f.status === "error")
      if (allComplete) {
        setIsUploading(false)
      }
      return prev
    })
  }

  const removeFile = (id: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const clearCompleted = () => {
    setUploadFiles((prev) => prev.filter((f) => f.status !== "completed"))
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/plain": [".txt"],
      "text/markdown": [".md"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/json": [".json"],
      "text/csv": [".csv"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  })

  const getStatusIcon = (status: UploadFile["status"]) => {
    switch (status) {
      case "uploading":
        return <Upload className="h-4 w-4 text-blue-500" />
      case "processing":
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status: UploadFile["status"]) => {
    switch (status) {
      case "uploading":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "processing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-medium">{isDragActive ? "Drop files here" : "Drag & drop files here"}</p>
                <p className="text-sm text-muted-foreground">or click to browse files</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline">PDF</Badge>
                <Badge variant="outline">DOC/DOCX</Badge>
                <Badge variant="outline">TXT</Badge>
                <Badge variant="outline">MD</Badge>
                <Badge variant="outline">JSON</Badge>
                <Badge variant="outline">CSV</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Maximum file size: 10MB per file</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadFiles.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upload Progress</CardTitle>
              <Button variant="outline" size="sm" onClick={clearCompleted}>
                Clear Completed
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadFiles.map((uploadFile) => (
                <div key={uploadFile.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(uploadFile.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{uploadFile.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(uploadFile.status)}>{uploadFile.status}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => removeFile(uploadFile.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {uploadFile.status !== "completed" && uploadFile.status !== "error" && (
                    <div className="space-y-1">
                      <Progress value={uploadFile.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {uploadFile.status === "uploading" ? "Uploading..." : "Processing with AI..."} (
                        {uploadFile.progress}%)
                      </p>
                    </div>
                  )}

                  {uploadFile.error && <p className="text-xs text-red-600">{uploadFile.error}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Processing Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Upload className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <h3 className="font-medium">1. Upload</h3>
              <p className="text-sm text-muted-foreground">Files are securely uploaded and validated</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <FileText className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <h3 className="font-medium">2. Extract</h3>
              <p className="text-sm text-muted-foreground">Text content is extracted and chunked</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <h3 className="font-medium">3. Index</h3>
              <p className="text-sm text-muted-foreground">Vector embeddings are generated for semantic search</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
