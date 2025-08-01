"use client"

declare const SpeechRecognition: any

export class VoiceAssistantService {
  private recognition: SpeechRecognition | null = null
  private synthesis: SpeechSynthesis
  private isListening = false
  private onResult: ((text: string) => void) | null = null
  private onError: ((error: string) => void) | null = null

  constructor() {
    this.synthesis = window.speechSynthesis

    if ("webkitSpeechRecognition" in window) {
      this.recognition = new (window as any).webkitSpeechRecognition()
    } else if ("SpeechRecognition" in window) {
      this.recognition = new (window as any).SpeechRecognition()
    }

    if (this.recognition) {
      this.recognition.continuous = false
      this.recognition.interimResults = false
      this.recognition.lang = "en-US"

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        if (this.onResult) {
          this.onResult(transcript)
        }
      }

      this.recognition.onerror = (event) => {
        if (this.onError) {
          this.onError(event.error)
        }
      }

      this.recognition.onend = () => {
        this.isListening = false
      }
    }
  }

  startListening(onResult: (text: string) => void, onError?: (error: string) => void): boolean {
    if (!this.recognition) {
      if (onError) onError("Speech recognition not supported")
      return false
    }

    if (this.isListening) {
      return false
    }

    this.onResult = onResult
    this.onError = onError || null

    try {
      this.recognition.start()
      this.isListening = true
      return true
    } catch (error) {
      if (onError) onError("Failed to start speech recognition")
      return false
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
    }
  }

  speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }): void {
    if (!this.synthesis) return

    // Cancel any ongoing speech
    this.synthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)

    if (options) {
      utterance.rate = options.rate || 1
      utterance.pitch = options.pitch || 1
      utterance.volume = options.volume || 1
    }

    // Try to use a professional voice
    const voices = this.synthesis.getVoices()
    const preferredVoice = voices.find(
      (voice) => voice.name.includes("Google") || voice.name.includes("Microsoft") || voice.lang.startsWith("en"),
    )

    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    this.synthesis.speak(utterance)
  }

  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel()
    }
  }

  isSupported(): boolean {
    return !!(this.recognition && this.synthesis)
  }

  getIsListening(): boolean {
    return this.isListening
  }

  isSpeaking(): boolean {
    return this.synthesis ? this.synthesis.speaking : false
  }
}
