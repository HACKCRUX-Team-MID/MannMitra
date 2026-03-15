
import { useState } from "react"
import { useLocation } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { SpiralLogo } from "@/components/ui/spiral-logo"
import { Sparkles, ChevronLeft } from "lucide-react"
import { Link } from "react-router-dom"
import { AIChatAssistant } from "@/components/app/ai-chat-assistant"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/journal": "Journal",
  "/insights": "Insights",
  "/settings": "Settings",
}

function getContext(pathname: string) {
  if (pathname.startsWith("/journal")) return "journal"
  if (pathname.startsWith("/insights")) return "insights"
  if (pathname.startsWith("/settings")) return "settings"
  if (pathname.startsWith("/dashboard")) return "dashboard"
  return "general"
}

export function MobileHeader() {
  const location = useLocation()
  const pathname = location.pathname
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const title = pageTitles[pathname] || "MannMitra"
  const showBackButton = pathname !== "/dashboard"

  return (
    <>
      <AIChatAssistant
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        context={getContext(pathname) as any}
      />
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-border/30">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Left section */}
          <div className="flex items-center gap-2">
            {showBackButton ? (
              <Link to="/dashboard">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <SpiralLogo className="h-8 w-8" />
            )}
          </div>

          {/* Center title */}
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>

          {/* Right section */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-full hover:bg-primary/10"
              onClick={() => setShowAIAssistant(true)}
              title="Open AI Assistant"
            >
              <Sparkles className="h-5 w-5 text-primary" />
              {/* Online indicator */}
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-background animate-pulse" />
            </Button>
            <Avatar className="h-8 w-8 ring-2 ring-primary/20">
              <AvatarImage src="" alt="User" />
              <AvatarFallback className="bg-primary/10 text-sm text-primary">J</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
    </>
  )
}
