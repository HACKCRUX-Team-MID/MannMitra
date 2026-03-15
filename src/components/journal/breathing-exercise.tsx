"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface BreathingExerciseProps {
  onDone: () => void
}

type BreathingPhase = "breathe-in" | "breathe-out"

const BREATHE_IN_DURATION = 4000 // 4 seconds
const BREATHE_OUT_DURATION = 4000 // 4 seconds

export function BreathingExercise({ onDone }: BreathingExerciseProps) {
  const [phase, setPhase] = useState<BreathingPhase>("breathe-in")
  const [cycleCount, setCycleCount] = useState(0)
  const [isActive, setIsActive] = useState(true)

  const handlePhaseChange = useCallback(() => {
    if (!isActive) return

    if (phase === "breathe-in") {
      setPhase("breathe-out")
    } else {
      setPhase("breathe-in")
      setCycleCount((prev) => prev + 1)
    }
  }, [phase, isActive])

  useEffect(() => {
    if (!isActive) return

    const duration = phase === "breathe-in" ? BREATHE_IN_DURATION : BREATHE_OUT_DURATION
    const timer = setTimeout(handlePhaseChange, duration)

    return () => clearTimeout(timer)
  }, [phase, isActive, handlePhaseChange])

  const handleDone = () => {
    setIsActive(false)
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      {/* Modal container */}
      <div className="relative flex flex-col items-center rounded-3xl bg-card p-8 shadow-2xl border border-border/50">
        {/* Close button */}
        <button
          onClick={handleDone}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close breathing exercise"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Breathing circle animation */}
        <div className="relative flex items-center justify-center h-48 w-48">
          {/* Outer glow */}
          <div
            className={`absolute rounded-full bg-primary/20 blur-xl transition-all duration-[4000ms] ease-in-out ${
              phase === "breathe-in" ? "h-44 w-44" : "h-24 w-24"
            }`}
          />

          {/* Main breathing circle */}
          <div
            className={`relative flex items-center justify-center rounded-full bg-gradient-to-br from-primary/40 to-secondary/40 shadow-lg transition-all duration-[4000ms] ease-in-out ${
              phase === "breathe-in" ? "h-40 w-40" : "h-20 w-20"
            }`}
          >
            {/* Inner circle */}
            <div
              className={`flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary transition-all duration-[4000ms] ease-in-out ${
                phase === "breathe-in" ? "h-32 w-32" : "h-14 w-14"
              }`}
            >
              {/* Phase text */}
              <span className={`text-center font-semibold text-primary-foreground transition-all duration-[4000ms] ${
                phase === "breathe-in" ? "text-sm" : "text-[10px]"
              }`}>
                {phase === "breathe-in" ? "Breathe In" : "Breathe Out"}
              </span>
            </div>
          </div>
        </div>

        {/* Cycle counter */}
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">Cycles Completed</p>
          <p className="text-2xl font-bold text-foreground">{cycleCount}</p>
        </div>

        {/* Done button */}
        <Button
          onClick={handleDone}
          className="mt-4 h-10 rounded-full bg-primary px-6 text-sm font-semibold"
        >
          Done
        </Button>
      </div>
    </div>
  )
}
