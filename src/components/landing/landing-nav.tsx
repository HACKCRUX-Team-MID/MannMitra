import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { SpiralLogo } from "@/components/ui/spiral-logo"

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <SpiralLogo className="h-8 w-8" />
          <span className="text-lg font-semibold text-foreground">MannMitra</span>
        </Link>
        
        <nav className="hidden items-center gap-6 md:flex">
          <a 
            href="#features" 
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </a>
          <a 
            href="#privacy" 
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Privacy
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link to="/login">Sign In</Link>
          </Button>
          <Button size="sm" asChild className="bg-primary hover:bg-primary/90">
            <Link to="/login">Start Reflecting</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
