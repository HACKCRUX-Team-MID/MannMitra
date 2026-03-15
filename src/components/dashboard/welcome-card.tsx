"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mic, PenLine } from "lucide-react"
import { cn } from "@/lib/utils"

const moodEmojis = [
  { emoji: "😊", label: "Happy", value: "happy" },
  { emoji: "😌", label: "Calm", value: "calm" },
  { emoji: "😐", label: "Neutral", value: "neutral" },
  { emoji: "😔", label: "Low", value: "low" },
  { emoji: "😫", label: "Stressed", value: "stressed" },
]

export function WelcomeCard() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)

  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-primary/5 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold text-foreground">
          How are you feeling today?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mood emoji selector */}
        <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
          {moodEmojis.map((mood) => (
            <button
              key={mood.value}
              onClick={() => setSelectedMood(mood.value)}
              className={cn(
                "flex h-14 w-14 flex-col items-center justify-center rounded-2xl border-2 transition-all duration-200",
                selectedMood === mood.value
                  ? "border-primary bg-primary/10 scale-110 shadow-md"
                  : "border-border/50 bg-card hover:border-primary/50 hover:bg-primary/5"
              )}
              aria-label={`Select mood: ${mood.label}`}
            >
              <span className="text-2xl">{mood.emoji}</span>
            </button>
          ))}
        </div>

        {selectedMood && (
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            You selected: <span className="font-medium text-foreground">{moodEmojis.find(m => m.value === selectedMood)?.label}</span>
          </p>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="flex-1 bg-primary hover:bg-primary/90">
            <Link to="/journal">
              <PenLine className="mr-2 h-4 w-4" />
              Write Journal Entry
            </Link>
          </Button>
          <Button variant="outline" className="flex-1 border-primary/30 text-primary hover:bg-primary/10">
            <Mic className="mr-2 h-4 w-4" />
            Voice Journal
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
