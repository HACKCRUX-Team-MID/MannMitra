"use client"

import { Link } from "react-router-dom"
import { SpiralLogo } from "@/components/ui/spiral-logo"

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30 px-4 py-12">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <SpiralLogo className="h-6 w-6" />
            <span className="font-semibold text-foreground">MannMitra</span>
          </div>
          
          <nav className="flex gap-6">
            <Link 
              to="/login" 
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link 
              to="/journal" 
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Journal
            </Link>
            <Link 
              to="/insights" 
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Insights
            </Link>
            <Link 
              to="/settings" 
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Settings
            </Link>
          </nav>

          <p className="text-sm text-muted-foreground">
            Built with care for your peace of mind.
          </p>
        </div>
      </div>
    </footer>
  )
}
