"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Volume2, VolumeX, Play, Pause, Settings, Zap, Brain } from "lucide-react"
import { VoiceAssistantService } from "@/lib/voice-assistant"

interface VoiceCommand {
  id: number
  command: string
  response: string
  timestamp: Date
  executed: boolean
  type: "email" | "calendar" | "task" | "reminder" | "document" | "general"
}

export function VoiceAssistant() {
  const [voiceService] = useState(() => new VoiceAssistantService())
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentCommand, setCurrentCommand] = useState("")
  const [commandHistory, setCommandHistory] = useState<VoiceCommand[]>([])
  const [volume, setVolume] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!voiceService.isSupported()) {
      console.warn("Voice assistant not supported in this browser")
    }
  }, [voiceService])

  const startListening = () => {
    if (!voiceService.isSupported()) {
      alert("Voice recognition is not supported in your browser")
      return
    }

    setIsListening(true)
    setCurrentCommand("Listening...")

    voiceService.startListening(
      (transcript) => {
        setCurrentCommand(transcript)
        processVoiceCommand(transcript)
      },
      (error) => {
        console.error("Voice recognition error:", error)
        setIsListening(false)
        setCurrentCommand("")
      },
    )
  }

  const stopListening = () => {
    voiceService.stopListening()
    setIsListening(false)
    setCurrentCommand("")
  }

  const processVoiceCommand = async (command: string) => {
    setIsListening(false)
    setIsProcessing(true)
    setIsSpeaking(true)

    try {
      // Send command to AI chat API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: command }),
      })

      const data = await response.json()
      const aiResponse = data.message

      // Determine command type
      const commandType = determineCommandType(command)

      const newCommand: VoiceCommand = {
        id: commandHistory.length + 1,
        command,
        response: aiResponse,
        timestamp: new Date(),
        executed: true,
        type: commandType,
      }

      setCommandHistory((prev) => [newCommand, ...prev])

      // Speak the response
      if (volume && voiceService.isSupported()) {
        voiceService.speak(aiResponse, { rate: 0.9, pitch: 1.1 })
      }

      setCurrentCommand("")
    } catch (error) {
      console.error("Error processing voice command:", error)
      const errorResponse = "I'm sorry, I couldn't process that command. Please try again."

      if (volume && voiceService.isSupported()) {
        voiceService.speak(errorResponse)
      }
    } finally {
      setIsProcessing(false)
      setIsSpeaking(false)
    }
  }

  const determineCommandType = (command: string): VoiceCommand["type"] => {
    const lowerCommand = command.toLowerCase()

    if (lowerCommand.includes("email") || lowerCommand.includes("mail")) return "email"
    if (lowerCommand.includes("meeting") || lowerCommand.includes("schedule") || lowerCommand.includes("calendar"))
      return "calendar"
    if (lowerCommand.includes("delegate") || lowerCommand.includes("assign") || lowerCommand.includes("task"))
      return "task"
    if (lowerCommand.includes("remind") || lowerCommand.includes("reminder")) return "reminder"
    if (lowerCommand.includes("document") || lowerCommand.includes("file") || lowerCommand.includes("report"))
      return "document"

    return "general"
  }

  const getCommandTypeColor = (type: VoiceCommand["type"]) => {
    switch (type) {
      case "email":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "calendar":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "task":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "reminder":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "document":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const quickCommands = [
    { text: "Read my urgent emails", type: "email" as const },
    { text: "What meetings do I have today?", type: "calendar" as const },
    { text: "Schedule a team meeting tomorrow at 2 PM", type: "calendar" as const },
    { text: "Delegate the budget review to Sarah", type: "task" as const },
    { text: "Remind me to call the client at 3 PM", type: "reminder" as const },
    { text: "Find documents about Q4 performance", type: "document" as const },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Voice Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Voice Assistant Control
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setVolume(!volume)}>
                {volume ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-6">
            {/* Voice Visualization */}
            <div className="relative">
              <div
                className={`w-32 h-32 mx-auto rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                  isListening
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 animate-pulse"
                    : isSpeaking || isProcessing
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-gray-300 bg-gray-50 dark:bg-gray-900/20"
                }`}
              >
                {isListening ? (
                  <div className="flex space-x-1">
                    <div className="w-2 h-8 bg-blue-500 rounded animate-pulse"></div>
                    <div
                      className="w-2 h-12 bg-blue-500 rounded animate-pulse"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div className="w-2 h-6 bg-blue-500 rounded animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                    <div
                      className="w-2 h-10 bg-blue-500 rounded animate-pulse"
                      style={{ animationDelay: "0.3s" }}
                    ></div>
                  </div>
                ) : isSpeaking || isProcessing ? (
                  <Brain className="h-12 w-12 text-green-500 animate-pulse" />
                ) : (
                  <Mic className="h-12 w-12 text-gray-400" />
                )}
              </div>

              {/* Status indicator */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <Badge variant={isListening ? "default" : isSpeaking || isProcessing ? "secondary" : "outline"}>
                  {isListening ? "Listening" : isProcessing ? "Processing" : isSpeaking ? "Speaking" : "Ready"}
                </Badge>
              </div>
            </div>

            {/* Current Command Display */}
            {currentCommand && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  {isListening ? "Voice Input:" : isProcessing ? "Processing:" : "Command:"}
                </p>
                <p className="font-medium">{currentCommand}</p>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex justify-center gap-4">
              <Button
                size="lg"
                onClick={isListening ? stopListening : startListening}
                disabled={isSpeaking || isProcessing}
                className={isListening ? "bg-red-500 hover:bg-red-600" : ""}
              >
                {isListening ? <MicOff className="h-5 w-5 mr-2" /> : <Mic className="h-5 w-5 mr-2" />}
                {isListening ? "Stop Listening" : "Start Listening"}
              </Button>

              <Button variant="outline" size="lg" disabled={!isSpeaking} onClick={() => voiceService.stopSpeaking()}>
                {isSpeaking ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
                {isSpeaking ? "Stop Speaking" : "Speak"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Voice Commands */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Voice Commands
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickCommands.map((command, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-3 text-left justify-start bg-transparent"
                onClick={() => processVoiceCommand(command.text)}
                disabled={isListening || isSpeaking || isProcessing}
              >
                <div className="w-full">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">"{command.text}"</span>
                    <Badge className={getCommandTypeColor(command.type)} variant="outline">
                      {command.type}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">Tap to execute</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Command History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Voice Commands</CardTitle>
        </CardHeader>
        <CardContent>
          {commandHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No voice commands yet. Try saying something!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {commandHistory.map((cmd) => (
                <div key={cmd.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={cmd.executed ? "default" : "secondary"}>
                        {cmd.executed ? "Executed" : "Processing"}
                      </Badge>
                      <Badge className={getCommandTypeColor(cmd.type)} variant="outline">
                        {cmd.type}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{cmd.timestamp.toLocaleTimeString()}</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-blue-600">🎤 You said:</p>
                      <p className="text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded">"{cmd.command}"</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-600">🤖 AI responded:</p>
                      <p className="text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded">{cmd.response}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voice Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Voice Recognition Language</label>
                <select className="w-full mt-1 p-2 border rounded-md bg-background">
                  <option>English (US)</option>
                  <option>English (UK)</option>
                  <option>English (India)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Wake Word</label>
                <select className="w-full mt-1 p-2 border rounded-md bg-background">
                  <option>Hey Crystal</option>
                  <option>Crystal Assistant</option>
                  <option>AI Assistant</option>
                </select>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Voice Response Speed</label>
                <select className="w-full mt-1 p-2 border rounded-md bg-background">
                  <option>Slow (0.7x)</option>
                  <option>Normal (1.0x)</option>
                  <option>Fast (1.3x)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Voice Type</label>
                <select className="w-full mt-1 p-2 border rounded-md bg-background">
                  <option>Professional Female</option>
                  <option>Professional Male</option>
                  <option>Natural Female</option>
                  <option>Natural Male</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Assistant Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Assistant Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Mic className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <h3 className="font-medium">Speech Recognition</h3>
              <p className="text-sm text-muted-foreground">Advanced voice-to-text with context understanding</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Brain className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <h3 className="font-medium">AI Processing</h3>
              <p className="text-sm text-muted-foreground">Intelligent command interpretation and execution</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Volume2 className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <h3 className="font-medium">Natural Speech</h3>
              <p className="text-sm text-muted-foreground">Human-like text-to-speech responses</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
