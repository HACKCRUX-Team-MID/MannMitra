"use client"

import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section className="px-4 py-20 md:py-28">
      <div className="container mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 via-primary to-secondary/80 p-8 text-center md:p-16">
          {/* Decorative elements */}
          <div className="absolute left-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-60 w-60 rounded-full bg-accent/20 blur-3xl" />
          
          <div className="relative">
            <h2 className="mb-4 text-balance text-3xl font-bold text-white md:text-4xl">
              Begin your journey of self-discovery
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-pretty text-lg text-white/80">
              No sign-up required to explore. Start reflecting at your own pace, 
              in your own space.
            </p>
            <Button 
              size="lg" 
              asChild
              className="group bg-white px-8 text-primary hover:bg-white/90"
            >
              <Link to="/login">
                Open Your Dashboard
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
