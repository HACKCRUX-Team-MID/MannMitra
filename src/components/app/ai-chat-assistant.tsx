// @ts-nocheck
"use client"

import { useState, useRef, useEffect } from "react"
import { X, Send, Sparkles, Mic, MicOff, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { generateCompanionResponse } from "../../utils/companionEngine"

interface Message {
  id: string
  role: "assistant" | "user"
  content: string
}

interface AIChatAssistantProps {
  isOpen: boolean
  onClose: () => void
  journalText?: string
  /** Page context: used to personalize the greeting */
  context?: "journal" | "dashboard" | "insights" | "settings" | "general"
}

function getGreeting(context?: AIChatAssistantProps["context"], journalText?: string): string {
  if (context === "journal" && journalText && journalText.trim().length > 0) {
    return "Hi! 👋 Would you like help refining your journal entry? I can improve clarity, expand emotional reflections, or suggest supportive insights."
  }
  if (context === "journal") {
    return "Hi! 👋 I'm here to help with your journaling. You can ask me to suggest prompts, help express feelings, or chat about anything on your mind."
  }
  if (context === "insights") {
    return "Hi! 👋 I can help you understand your mood patterns, explain your insights, or suggest ways to improve your emotional wellbeing."
  }
  if (context === "settings") {
    return "Hi! 👋 Need help navigating settings or understanding any feature? I'm here for you."
  }
  return "Hi! 👋 How may I help you today? I can help you reflect on your feelings, refine journal entries, or just have a supportive conversation."
}

const QUICK_REPLIES = [
  "Help me reflect on my feelings",
  "Suggest a journal prompt",
  "How do I improve my mood?",
  "Explain my mood patterns",
]

export function AIChatAssistant({ isOpen, onClose, journalText, context = "general" }: AIChatAssistantProps) {
  const greeting = getGreeting(context, journalText)

  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "assistant", content: greeting },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [inputMode, setInputMode] = useState<"text" | "voice">("text")
  const [quickRepliesShown, setQuickRepliesShown] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset messages when context changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setMessages([{ id: "1", role: "assistant", content: getGreeting(context, journalText) }])
      setInputValue("")
      setQuickRepliesShown(true)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, context])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Init speech recognition
  useEffect(() => {
    if (typeof window === "undefined") return
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      if (transcript) sendMessage(transcript)
      setIsRecording(false)
    }
    recognition.onerror = () => setIsRecording(false)
    recognition.onend = () => setIsRecording(false)
    recognitionRef.current = recognition
  }, [])

  const sendMessage = async (text: string) => {
    if (!text.trim()) return
    setQuickRepliesShown(false)
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text }
    setMessages(prev => [...prev, userMsg])
    setInputValue("")
    setIsTyping(true)

    try {
      // Build a contextual prompt combining journal text if available
      const contextHint = journalText?.trim()
        ? `[User's journal entry context: "${journalText.slice(0, 300)}..."]\n\nUser says: ${text}`
        : text
      const res = await generateCompanionResponse(contextHint, "there")
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.message,
      }])
    } catch {
      const fallbacks = [
        "I understand. Would you like to explore these feelings a bit more?",
        "That's worth reflecting on. What do you think is underneath this feeling?",
        "Thank you for sharing. What would feel helpful right now?",
        "I hear you. Sometimes putting feelings into words is a first step toward clarity.",
      ]
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fallbacks[Math.floor(Math.random() * fallbacks.length)],
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Voice input not supported in this browser. Try Chrome.")
      return
    }
    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  if (!isOpen) return null

  return (
    /* Full-screen overlay — sits above everything */
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" aria-hidden />

      {/* Chat panel */}
      <div
        className={cn(
          "relative flex flex-col rounded-3xl bg-card border border-border shadow-2xl",
          "w-full max-w-sm",
          /* Fit between navbar (56px top) and bottom nav (64px) with padding */
          "max-h-[calc(100dvh-140px)]",
          "md:max-w-md md:max-h-[75vh]",
        )}
        style={{ minHeight: 0 }}
      >
        {/* ── Header ── */}
        <div className="flex shrink-0 items-center justify-between rounded-t-3xl border-b border-border bg-gradient-to-r from-primary/10 to-secondary/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-md">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">AI Assistant</h3>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] text-muted-foreground">Always here for you</p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-muted/60"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Journal context badge */}
        {journalText && journalText.length > 10 && (
          <div className="shrink-0 border-b border-border/50 bg-primary/5 px-4 py-2">
            <p className="text-[11px] text-primary/70">
              ✍️ Reviewing your journal entry ({journalText.length} chars) — ask me anything about it
            </p>
          </div>
        )}

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: 0 }}>
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "assistant" && (
                <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 self-end">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-muted text-foreground",
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="mr-2 h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
                <div className="flex gap-1">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick replies */}
          {quickRepliesShown && messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {QUICK_REPLIES.map((r) => (
                <button
                  key={r}
                  onClick={() => sendMessage(r)}
                  className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Mode toggle ── */}
        <div className="shrink-0 flex justify-center border-t border-border pt-2 px-4">
          <div className="flex gap-1 rounded-full bg-muted p-1">
            {(["text", "voice"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setInputMode(mode)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                  inputMode === mode ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {mode === "text" ? <Send className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ── Input area ── */}
        <div className="shrink-0 rounded-b-3xl px-4 pt-2 pb-4">
          {inputMode === "text" ? (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message..."
                className="h-10 flex-1 rounded-full border border-border bg-muted/50 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage(inputValue)
                  }
                }}
              />
              <Button
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full bg-primary hover:bg-primary/90"
                onClick={() => sendMessage(inputValue)}
                disabled={!inputValue.trim() || isTyping}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <button
                onClick={toggleRecording}
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all",
                  isRecording
                    ? "bg-destructive text-white animate-pulse scale-110"
                    : "bg-gradient-to-br from-primary to-secondary text-white hover:scale-105",
                )}
              >
                {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </button>
              {isRecording && (
                <div className="flex h-6 items-center gap-[3px]">
                  {[...Array(12)].map((_, i) => (
                    <span
                      key={i}
                      className="w-1 rounded-full bg-destructive/70"
                      style={{ height: `${Math.random() * 16 + 4}px`, animation: `bounce 0.4s ease-in-out ${i * 0.05}s infinite alternate` }}
                    />
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {isRecording ? "Listening… tap to stop" : "Tap to speak"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
