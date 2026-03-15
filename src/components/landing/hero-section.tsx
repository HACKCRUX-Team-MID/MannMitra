"use client"

import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-20 md:py-32">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute right-1/4 top-1/4 h-[400px] w-[400px] rounded-full bg-secondary/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-accent/20 blur-[100px]" />
      </div>

      <div className="container mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
          <Sparkles className="h-4 w-4" />
          <span>Your personal reflection companion</span>
        </div>

        <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
          Understand your mind through{" "}
          <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            reflection and patterns
          </span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
          MannMitra is a gentle mental-state awareness companion that helps you observe 
          emotional patterns and behavioral trends. No diagnosis, no pressure — just quiet 
          self-discovery at your own pace.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" asChild className="group bg-primary px-8 hover:bg-primary/90">
            <Link to="/login">
              Start Reflecting
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="px-8">
            <Link to="#features">Learn More</Link>
          </Button>
        </div>

        {/* Decorative illustration */}
        <div className="relative mt-16 flex justify-center">
          <div className="relative h-64 w-full max-w-lg">
            {/* Floating cards illustration */}
            <div className="absolute left-1/2 top-1/2 h-32 w-48 -translate-x-1/2 -translate-y-1/2 rotate-[-6deg] rounded-2xl bg-card shadow-lg ring-1 ring-border/50">
              <div className="p-4">
                <div className="mb-2 h-2 w-16 rounded-full bg-primary/30" />
                <div className="h-2 w-24 rounded-full bg-muted" />
                <div className="mt-4 flex gap-2">
                  <div className="h-6 w-6 rounded-full bg-[var(--mood-calm)]" />
                  <div className="h-6 w-6 rounded-full bg-[var(--mood-energetic)]" />
                  <div className="h-6 w-6 rounded-full bg-[var(--mood-low)]" />
                </div>
              </div>
            </div>
            <div className="absolute left-1/2 top-1/2 h-28 w-44 -translate-x-[30%] -translate-y-[70%] rotate-[4deg] rounded-2xl bg-card shadow-lg ring-1 ring-border/50">
              <div className="p-4">
                <div className="mb-2 h-2 w-12 rounded-full bg-secondary/40" />
                <div className="flex items-end gap-1">
                  <div className="h-8 w-3 rounded-sm bg-primary/40" />
                  <div className="h-12 w-3 rounded-sm bg-primary/60" />
                  <div className="h-6 w-3 rounded-sm bg-primary/40" />
                  <div className="h-10 w-3 rounded-sm bg-primary/50" />
                  <div className="h-14 w-3 rounded-sm bg-primary/70" />
                </div>
              </div>
            </div>
            <div className="absolute left-1/2 top-1/2 h-24 w-40 -translate-x-[70%] -translate-y-[30%] rotate-[-3deg] rounded-2xl bg-card shadow-lg ring-1 ring-border/50">
              <div className="p-4">
                <div className="mb-3 h-2 w-20 rounded-full bg-accent/40" />
                <div className="h-2 w-full rounded-full bg-muted" />
                <div className="mt-1 h-2 w-3/4 rounded-full bg-muted" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
