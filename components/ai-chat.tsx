"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Mic, Paperclip, Zap } from "lucide-react"
import { VoiceAssistantService } from "@/lib/voice-assistant"

interface Message {
  id: number
  type: "user" | "assistant"
  content: string
  timestamp: Date
  context?: string[]
  taskProcessed?: boolean
}

const initialMessages: Message[] = [
  {
    id: 1,
    type: "assistant",
    content:
      "Hello! I'm your Crystal AI Executive Assistant. I have access to your emails, calendar, KPIs, and documents. I can also delegate tasks and set reminders. How can I help you today?",
    timestamp: new Date(),
    context: ["system"],
  },
]

const suggestedQueries = [
  "Summarize today's urgent emails",
  "What meetings do I have this week?",
  "Delegate the budget review task to Sarah for Friday",
  "Remind me to call the client tomorrow at 3 PM",
  "Find documents about Q4 financial performance",
  "Schedule a team meeting for next Monday at 2 PM",
]

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [voiceService] = useState(() => new VoiceAssistantService())
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          conversationId,
        }),
      })

      const data = await response.json()

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId)
      }

      const aiResponse: Message = {
        id: messages.length + 2,
        type: "assistant",
        content: data.message,
        timestamp: new Date(),
        context: ["emails", "calendar", "kpis", "documents"],
        taskProcessed: data.taskProcessed,
      }

      setMessages((prev) => [...prev, aiResponse])

      // Speak the response if voice is enabled
      if (voiceService.isSupported()) {
        voiceService.speak(data.message)
      }
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        id: messages.length + 2,
        type: "assistant",
        content: "I apologize, but I'm having trouble processing your request right now. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleVoiceInput = () => {
    if (!voiceService.isSupported()) {
      alert("Voice recognition is not supported in your browser")
      return
    }

    if (isListening) {
      voiceService.stopListening()
      setIsListening(false)
    } else {
      const success = voiceService.startListening(
        (transcript) => {
          setInput(transcript)
          setIsListening(false)
        },
        (error) => {
          console.error("Voice recognition error:", error)
          setIsListening(false)
        },
      )
      setIsListening(success)
    }
  }

  const handleSuggestedQuery = (query: string) => {
    setInput(query)
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Crystal AI Assistant
            <Badge variant="secondary" className="ml-auto">
              Context: Emails, Calendar, KPIs, Documents, Tasks
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.type === "assistant" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs opacity-70">{message.timestamp.toLocaleTimeString()}</span>
                    {message.taskProcessed && (
                      <Badge variant="outline" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        Task Processed
                      </Badge>
                    )}
                    {message.context && (
                      <div className="flex gap-1">
                        {message.context.map((ctx) => (
                          <Badge key={ctx} variant="outline" className="text-xs">
                            {ctx}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {message.type === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Queries */}
          {messages.length === 1 && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQueries.map((query) => (
                  <Button
                    key={query}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestedQuery(query)}
                    className="text-xs"
                  >
                    {query}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleVoiceInput}
              className={isListening ? "bg-red-100 border-red-300" : ""}
            >
              <Mic className={`h-4 w-4 ${isListening ? "text-red-600" : ""}`} />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything, delegate tasks, or set reminders..."
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!input.trim() || isTyping}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
