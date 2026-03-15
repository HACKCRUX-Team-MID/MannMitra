"use client"

import { Link } from "react-router-dom"
import { useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SpiralLogo } from "@/components/ui/spiral-logo"
import { cn } from "@/lib/utils"
import { LayoutDashboard, BookOpen, BarChart3, Settings, Menu, X, Sparkles } from "lucide-react"
import { useState } from "react"
import { AIChatAssistant } from "@/components/app/ai-chat-assistant"

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
]

function getContext(pathname: string) {
  if (pathname.startsWith("/journal")) return "journal"
  if (pathname.startsWith("/insights")) return "insights"
  if (pathname.startsWith("/settings")) return "settings"
  if (pathname.startsWith("/dashboard")) return "dashboard"
  return "general"
}

export function AppNav() {
  const { pathname } = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showAI, setShowAI] = useState(false)

  return (
    <>
      <AIChatAssistant
        isOpen={showAI}
        onClose={() => setShowAI(false)}
        context={getContext(pathname) as any}
      />
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 shadow-sm backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <SpiralLogo className="h-8 w-8" />
            <span className="text-lg font-semibold text-foreground">MannMitra</span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link key={link.href} to={link.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={cn("gap-2", isActive && "bg-primary/10 text-primary hover:bg-primary/15")}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Button>
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            {/* AI Assistant button — visible on all screen sizes */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-full hover:bg-primary/10"
              onClick={() => setShowAI(true)}
              title="Open AI Assistant"
            >
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-background" />
            </Button>

            <Avatar className="h-8 w-8 ring-2 ring-primary/20">
              <AvatarImage src="" alt="User avatar" />
              <AvatarFallback className="bg-primary/10 text-sm text-primary">U</AvatarFallback>
            </Avatar>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile navigation dropdown */}
        {mobileMenuOpen && (
          <nav className="border-t border-border/40 bg-background p-4 md:hidden">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn("w-full justify-start gap-3", isActive && "bg-primary/10 text-primary hover:bg-primary/15")}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </nav>
        )}
      </header>
    </>
  )
}
