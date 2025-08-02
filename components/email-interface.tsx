"use client"

"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Archive, Trash2, Reply, Forward, MoreHorizontal, CreditCard, RefreshCw, Sparkles, ArrowDownUp } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import DOMPurify from "dompurify"

interface Email {
  id: string
  from: string
  subject: string
  body: string
  date: Date
  category: "urgent" | "financial" | "internal" | "external" | "meetings" | "credit_card" | "general"
  priority: "high" | "medium" | "low"
  summary: string
  isRead: boolean
}

const categoryColors = {
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  financial: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  internal: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  external: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  meetings: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  credit_card: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  general: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
}

export function EmailInterface() {
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [isSummaryLoading, setIsSummaryLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'from-asc'>('date-desc')

  const handleGenerateSummary = async (emailId: string) => {
    setIsSummaryLoading(true);
    try {
      const emailToSummarize = emails.find(e => e.id === emailId);
      if (!emailToSummarize) return;

      const response = await fetch('/api/emails/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: emailToSummarize.subject, body: emailToSummarize.body }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary.');
      }

      const { summary } = await response.json();

      const updatedEmails = emails.map(e => 
        e.id === emailId ? { ...e, summary } : e
      );
      setEmails(updatedEmails);

      if (selectedEmail?.id === emailId) {
        setSelectedEmail(prev => prev ? { ...prev, summary } : null);
      }

    } catch (error) {
      console.error("Summary generation failed:", error);
      // Optionally, set an error state to show in the UI
    } finally {
      setIsSummaryLoading(false);
    }
  };

  useEffect(() => {
    syncEmails()
  }, [])

  const syncEmails = async () => {
    console.log('Starting email sync...')
    setIsLoading(true)
    setError(null)
    try {
      // First sync emails
      console.log('Calling sync endpoint...')
      const syncResponse = await fetch("/api/emails/sync", { 
        method: "POST",
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      console.log('Sync response status:', syncResponse.status)
      
      if (!syncResponse.ok) {
        const errorText = await syncResponse.text()
        console.error('Sync error:', errorText)
        throw new Error(`Failed to sync emails: ${syncResponse.statusText}`)
      }

      const syncData = await syncResponse.json()
      console.log('Sync successful, emails processed:', syncData.emailsProcessed)
      
      // Update the dashboard stats if we have them
      if (syncData.stats) {
        // Dispatch a custom event that the dashboard can listen to
        window.dispatchEvent(new CustomEvent('emailsSynced', { 
          detail: syncData.stats 
        }));
      }
      
      // Then fetch the updated list with cache busting
      console.log('Fetching emails...')
      const timestamp = new Date().getTime(); // Cache buster
      const response = await fetch(`/api/emails?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      console.log('Fetch response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Fetch error:', errorText)
        throw new Error(`Failed to fetch emails: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Received data:', data)

      if (data.success) {
        // Transform the dates from strings to Date objects if needed
        const emailsWithDates = data.emails.map((email: any) => ({
          ...email,
          date: email.date ? new Date(email.date) : new Date(),
          // Ensure all required fields have default values
          summary: email.summary || "No summary available",
          category: email.category || "general",
          priority: email.priority || "medium",
          isRead: email.isRead || false,
          labels: email.labels || []
        }))
        
        setEmails(emailsWithDates)
        setLastSynced(new Date())
        
        if (emailsWithDates.length > 0 && !selectedEmail) {
          setSelectedEmail(emailsWithDates[0])
        }
      } else {
        throw new Error(data.error || "Failed to process emails")
      }
    } catch (err) {
      console.error("Failed to sync or fetch emails:", err)
      setError(err instanceof Error ? err.message : "Failed to load emails. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const sortedEmails = useMemo(() => {
    if (!emails.length) return [];
    
    return [...emails].sort((a, b) => {
      // Convert dates to timestamps for comparison
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      
      switch (sortBy) {
        case 'date-asc':
          return timeA - timeB;
        case 'from-asc':
          return (a.from || '').localeCompare(b.from || '');
        case 'date-desc':
        default:
          return timeB - timeA;
      }
    });
  }, [emails, sortBy]);

  const filteredEmails = sortedEmails.filter((email) => {
    const matchesSearch =
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.summary.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === "all") return matchesSearch
    if (activeTab === "unread") return matchesSearch && !email.isRead
    if (activeTab === "urgent") return matchesSearch && email.category === "urgent"
    if (activeTab === "credit_card") return matchesSearch && email.category === "credit_card"

    return matchesSearch
  })

  const creditCardEmails = emails.filter((email) => email.category === "credit_card")

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
      {/* Email List */}
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Email Intelligence</CardTitle>
              <div className="flex items-center gap-2">
                {lastSynced && (
                  <span className="text-xs text-muted-foreground">
                    Last synced: {lastSynced.toLocaleTimeString()}
                  </span>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={syncEmails} 
                  disabled={isLoading}
                  title="Refresh emails"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  <span className="sr-only">Refresh</span>
                </Button>
              </div>
            </div>
                        <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-full"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="shrink-0">
                    <ArrowDownUp className="h-4 w-4 mr-2" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortBy('date-desc')}>Newest First</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('date-asc')}>Oldest First</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('from-asc')}>By Sender</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mx-4 mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
                <TabsTrigger value="urgent">Urgent</TabsTrigger>
                <TabsTrigger value="credit_card">
                  <CreditCard className="h-3 w-3 mr-1" />
                  Cards
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                {error && (
                  <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
                    {error}
                  </div>
                )}
                {isLoading && emails.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <RefreshCw className="w-8 h-8 mb-4 text-muted-foreground animate-spin" />
                    <p className="text-muted-foreground">Loading your emails...</p>
                  </div>
                ) : emails.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground">No emails found. Try syncing your inbox.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4" 
                      onClick={syncEmails}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Syncing...' : 'Sync Emails'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                    {filteredEmails.map((email) => (
                      <div
                        key={email.id}
                        className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                          selectedEmail?.id === email.id ? "bg-muted" : ""
                        } ${!email.isRead ? "font-semibold" : ""}`}
                        onClick={() => setSelectedEmail(email)}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`/placeholder.svg?height=32&width=32`} />
                            <AvatarFallback>
                              {email.from
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium truncate">{email.from}</p>
                              <span className="text-xs text-muted-foreground">
                                {email.date.toLocaleTimeString(undefined, {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-sm truncate">{email.subject}</p>
                            <p className="text-xs text-muted-foreground truncate">{email.summary}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={categoryColors[email.category as keyof typeof categoryColors]}>
                                {email.category === "credit_card" ? (
                                  <>
                                    <CreditCard className="h-3 w-3 mr-1" />
                                    Credit Card
                                  </>
                                ) : (
                                  email.category
                                )}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {email.priority}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Email Content */}
      <div className="lg:col-span-2">
        {selectedEmail ? (
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`/placeholder.svg?height=32&width=32`} />
                    <AvatarFallback>
                      {selectedEmail.from
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedEmail.from}</p>
                    <p className="text-sm text-muted-foreground">{selectedEmail.date.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Reply className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Forward className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">{selectedEmail.subject}</h2>
                <div className="flex items-center gap-2">
                  <Badge className={categoryColors[selectedEmail.category]}>
                    {selectedEmail.category === "credit_card" ? (
                      <>
                        <CreditCard className="h-3 w-3 mr-1" />
                        Credit Card
                      </>
                    ) : (
                      selectedEmail.category
                    )}
                  </Badge>
                  <Badge variant="outline">{selectedEmail.priority} priority</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium flex items-center"><Sparkles className="h-4 w-4 mr-2 text-purple-500" />AI Summary</h3>
                    {selectedEmail.summary && !isSummaryLoading && (
                       <Button variant="ghost" size="sm" onClick={() => handleGenerateSummary(selectedEmail.id)} disabled={isSummaryLoading}>Re-generate</Button>
                    )}
                  </div>
                  {isSummaryLoading ? (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      <span>Generating summary...</span>
                    </div>
                  ) : selectedEmail.summary ? (
                    <p className="text-sm text-muted-foreground">{selectedEmail.summary}</p>
                  ) : (
                    <Button onClick={() => handleGenerateSummary(selectedEmail.id)} disabled={isSummaryLoading}>
                      Generate Summary
                    </Button>
                  )}
                </div>

                {selectedEmail.category === "credit_card" && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800 dark:text-yellow-300">Credit Card Alert</span>
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      This email contains credit card related information. Please review carefully for any transactions,
                      payments, or account updates.
                    </p>
                  </div>
                )}

                                <div 
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEmail.body) }}
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-muted-foreground">Select an email to view its content</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
