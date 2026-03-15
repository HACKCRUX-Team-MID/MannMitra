"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookHeart, Brain, LineChart } from "lucide-react"

const features = [
  {
    icon: BookHeart,
    title: "Journaling Reflection",
    description: "Express your thoughts freely in a safe, private space. Our gentle prompts help you explore feelings without pressure or judgment.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Brain,
    title: "Behavioral Pattern Awareness",
    description: "Discover how your daily habits — sleep, movement, screen time — subtly influence your emotional state over time.",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    icon: LineChart,
    title: "Gentle Emotional Insights",
    description: "Receive supportive observations about your patterns, never alerts or warnings. Understanding comes through gentle awareness.",
    color: "text-accent",
    bgColor: "bg-accent/20",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="px-4 py-20 md:py-28">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            A kinder way to know yourself
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-muted-foreground">
            MannMitra combines thoughtful journaling with behavioral awareness 
            to help you understand your emotional landscape.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card 
              key={feature.title} 
              className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
            >
              <CardHeader>
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bgColor} transition-transform duration-300 group-hover:scale-110`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <CardTitle className="text-xl text-foreground">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
