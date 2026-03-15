import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, Flame, TrendingUp, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "../context/AuthContext"
import { storage } from "../utils/storage"
import GoogleFitWidget from "../components/GoogleFitWidget"

// moodScore: 0-100 maps to Journal's moodValue slider
const moodEmojis = [
  { emoji: "😊", label: "Happy", value: "happy", moodScore: 80, message: "Wonderful! It's great to see you feeling happy today." },
  { emoji: "😌", label: "Calm", value: "calm", moodScore: 70, message: "That's lovely. A calm mind is a peaceful mind." },
  { emoji: "😐", label: "Neutral", value: "neutral", moodScore: 50, message: "It's okay to feel neutral. Every day is a new opportunity." },
  { emoji: "😔", label: "Low", value: "low", moodScore: 25, message: "We're sorry you're feeling low. Remember, it's okay to not be okay." },
  { emoji: "😫", label: "Stressed", value: "stressed", moodScore: 10, message: "Take a deep breath. You've got this, and we're here for you." },
]

const Dashboard = () => {
  const { user } = useAuth()
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [entries, setEntries] = useState<any[]>([])

  useEffect(() => {
    if (user?.id) {
      storage.getAnalytics(user.id).then(setAnalytics).catch(console.error)
      
      // Fetch all entries, then slice the first 3 for Recent Reflections
      storage.getEntries(user.id)
        .then((e) => setEntries(e.slice(0, 3)))
        .catch(console.error)
    }
  }, [user?.id])

  const streakDays = analytics?.streak || 0
  
  // Feature 2: Dashboard Mood Score
  // Mean of the last (up to) 3 reflections shown in Recent Reflections
  const recentScores = entries.slice(0, 3).filter(e => e.intensity != null);
  const avgMood = recentScores.length > 0
    ? Math.round(recentScores.reduce((sum, e) => sum + e.intensity, 0) / recentScores.length)
    : "—"
    
  // Real-time total entries calculation
  const totalEntries = analytics?.count || 0
  const userName = user?.name?.split(' ')[0] || 'Friend'

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      {/* Greeting */}
      <div className="space-y-1">
        <p className="text-2xl font-bold text-foreground">Hello {userName}! 👋</p>
        <p className="text-muted-foreground">How are you feeling today?</p>
      </div>

      {/* Quick Mood Check-in */}
      <Card className="border-border/50 bg-card/80 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <p className="text-sm font-medium text-foreground">Quick mood check-in</p>
          <div className="grid grid-cols-5 gap-1 sm:gap-3">
            {moodEmojis.map((mood) => (
              <button
                key={mood.value}
                onClick={() => {
                  setSelectedMood(mood.value)
                  localStorage.setItem('dashboard-mood-score', String(mood.moodScore))
                  localStorage.setItem('dashboard-mood-emoji', mood.emoji)
                  localStorage.setItem('dashboard-mood-label', mood.label)
                }}
                className={cn(
                  "flex flex-col items-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl py-2 sm:py-3 px-1 sm:px-2 transition-all duration-200",
                  selectedMood === mood.value
                    ? "bg-primary/15 ring-2 ring-primary/50"
                    : "bg-muted/50 hover:bg-muted"
                )}
              >
                <span
                  className={cn(
                    "text-xl sm:text-2xl transition-transform duration-200",
                    selectedMood === mood.value && "scale-110"
                  )}
                >
                  {mood.emoji}
                </span>
                <span
                  className={cn(
                    "text-[9px] sm:text-[11px] font-medium transition-colors duration-200 truncate w-full text-center",
                    selectedMood === mood.value ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {mood.label}
                </span>
              </button>
            ))}
          </div>
          {selectedMood && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pt-1">
              <p className="text-sm text-center text-muted-foreground">
                {moodEmojis.find((m) => m.value === selectedMood)?.message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Fit Health Data */}
      <GoogleFitWidget />

      {/* Stats Cards */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        <Card className="min-w-[140px] flex-shrink-0 border-border/50 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="flex flex-col items-center gap-2 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
              <Flame className="h-6 w-6 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{streakDays}</p>
            <p className="text-xs text-muted-foreground">Day streak</p>
          </CardContent>
        </Card>

        <Card className="min-w-[140px] flex-shrink-0 border-border/50 bg-gradient-to-br from-secondary/10 to-secondary/5">
          <CardContent className="flex flex-col items-center gap-2 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/20">
              <TrendingUp className="h-6 w-6 text-secondary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{avgMood}</p>
            <p className="text-xs text-muted-foreground">Mood Score</p>
          </CardContent>
        </Card>

        <Card className="min-w-[140px] flex-shrink-0 border-border/50 bg-gradient-to-br from-accent/20 to-accent/10">
          <CardContent className="flex flex-col items-center gap-2 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/30">
              <BookOpen className="h-6 w-6 text-accent-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">{totalEntries}</p>
            <p className="text-xs text-muted-foreground">Total Entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Journal Action */}
      <Card className="border-border/50 bg-gradient-to-r from-primary to-primary/80 shadow-md transition-transform duration-300 hover:scale-[1.02]">
        <CardContent className="flex items-center justify-between p-4">
          <div className="space-y-1">
            <p className="font-semibold text-primary-foreground">Start journaling</p>
            <p className="text-sm text-primary-foreground/80">Write your thoughts</p>
          </div>
          <div className="flex gap-2">
            <Link to="/journal">
              <Button size="icon" className="h-10 w-10 rounded-full bg-white text-primary hover:bg-white/90">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reflections */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-foreground">Recent Reflections</p>
          <Link to="/journal" className="text-sm text-primary hover:underline">
            See all
          </Link>
        </div>

        {entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map((entry: any, idx: number) => (
              <Card key={idx} className="border-border/50 transition-all duration-300 hover:border-primary/30 hover:scale-[1.01] hover:shadow-sm">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                    <span className="text-2xl">
                      {entry.emotions?.[0]?.includes('joy') ? '😊' :
                       entry.emotions?.[0]?.includes('calm') ? '😌' :
                       entry.emotions?.[0]?.includes('sad') ? '😔' :
                       entry.emotions?.[0]?.includes('stress') ? '😫' : '😐'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {entry.text?.substring(0, 40) || 'Untitled entry'}...
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      Mood: {entry.intensity || '—'}/10
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(entry.timestamp || Date.now()).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border/50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <BookOpen className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                No reflections yet. Start your first journal entry!
              </p>
              <Link to="/journal">
                <Button size="sm" className="mt-1">
                  Write Now <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default Dashboard
