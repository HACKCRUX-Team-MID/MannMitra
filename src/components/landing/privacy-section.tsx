"use client"

import { Shield, Lock, Eye, Database } from "lucide-react"

const privacyFeatures = [
  {
    icon: Shield,
    title: "Your data, your control",
    description: "Full control over what gets tracked and stored",
  },
  {
    icon: Lock,
    title: "Private by design",
    description: "End-to-end encryption for all your entries",
  },
  {
    icon: Eye,
    title: "No third-party access",
    description: "We never share or sell your personal data",
  },
  {
    icon: Database,
    title: "Local-first storage",
    description: "Your reflections stay on your device",
  },
]

export function PrivacySection() {
  return (
    <section id="privacy" className="relative overflow-hidden px-4 py-20 md:py-28">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />
      
      <div className="container mx-auto max-w-4xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-sm text-secondary">
          <Shield className="h-4 w-4" />
          <span>Privacy-first approach</span>
        </div>

        <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Your thoughts deserve a safe space
        </h2>
        
        <p className="mx-auto mb-12 max-w-2xl text-pretty text-muted-foreground">
          We built MannMitra with privacy at its core. Your reflections and emotions 
          are deeply personal — they should stay that way.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {privacyFeatures.map((feature) => (
            <div 
              key={feature.title}
              className="group flex flex-col items-center rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/50 transition-all duration-300 hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 transition-colors group-hover:bg-secondary/20">
                <feature.icon className="h-5 w-5 text-secondary" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
