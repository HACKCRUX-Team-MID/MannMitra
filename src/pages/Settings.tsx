import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  ChevronRight, ChevronDown, Palette, Check,
  Activity, Moon as MoonIcon, Smartphone, Footprints, BedDouble, Bell,
  Info, Download, Shield, HelpCircle, Phone, Trash2, LogOut, Languages,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { supabase } from '../utils/supabase'
import { connectGoogleFit, disconnectGoogleFit, isConnected as isGFitConnected } from '../utils/googleFit'

/* ─── Toggle Row ─── */
const ToggleRow = ({
  icon: Icon, iconBg, iconColor, title, description, checked, onCheckedChange, className,
}: {
  icon: any; iconBg: string; iconColor: string
  title: string; description: string
  checked: boolean; onCheckedChange: (v: boolean) => void
  className?: string
}) => (
  <div className={cn('flex items-center justify-between gap-3 py-3.5', className)}>
    <div className="flex items-center gap-3 min-w-0">
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', iconBg)}>
        <Icon className={cn('h-4 w-4', iconColor)} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} className="shrink-0" />
  </div>
)

/* ─── Tappable Row ─── */
const TappableRow = ({
  icon: Icon, iconBg, iconColor, title, onClick, className,
}: {
  icon: any; iconBg: string; iconColor: string; title: string
  onClick: () => void; className?: string
}) => (
  <button
    onClick={onClick}
    className={cn(
      'flex w-full items-center justify-between gap-3 py-3.5 text-left transition-colors hover:bg-muted/30 rounded-lg cursor-pointer',
      className,
    )}
  >
    <div className="flex items-center gap-3 min-w-0">
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', iconBg)}>
        <Icon className={cn('h-4 w-4', iconColor)} />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
    </div>
    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
  </button>
)

/* ─── Section Label ─── */
const SectionLabel = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p className={cn('text-xs font-semibold uppercase tracking-wider text-primary/70 mb-2', className)}>
    {children}
  </p>
)

/* ─── Helpline data (non-US) ─── */
const helplines = [
  { country: '🇮🇳 India', name: 'iCall', number: '9152987821' },
  { country: '🇮🇳 India', name: 'Vandrevala Foundation', number: '1860-2662-345' },
  { country: '🇮🇳 India', name: 'AASRA', number: '91-22-27546669' },
  { country: '🇬🇧 UK', name: 'Samaritans', number: '116 123' },
  { country: '🇨🇦 Canada', name: 'Crisis Services Canada', number: '1-833-456-4566' },
  { country: '🇦🇺 Australia', name: 'Lifeline', number: '13 11 14' },
  { country: '🌍 International', name: 'Befrienders Worldwide', number: 'befrienders.org' },
]

/* ─── Main Settings Page ─── */
const Settings = () => {
  const { user, logout } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const navigate = useNavigate()

  // Toggle states
  const [behavioralInsights, setBehavioralInsights] = useState(() => localStorage.getItem('setting-behavioral') !== 'false')
  const [sleepData, setSleepData] = useState(() => localStorage.getItem('setting-sleep') !== 'false')
  const [screenTime, setScreenTime] = useState(() => localStorage.getItem('setting-screen') !== 'false')
  const [stepCount, setStepCount] = useState(() => localStorage.getItem('setting-steps') !== 'false')
  const [reminders, setReminders] = useState(() => localStorage.getItem('setting-reminders') === 'true')
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('setting-darkmode') === 'true')
  const [googleFitConnected, setGoogleFitConnected] = useState(() => isGFitConnected())
  const [gfitLoading, setGfitLoading] = useState(false)
  const [activePalette, setActivePalette] = useState(() => localStorage.getItem('setting-palette') || 'lavender')

  // Apply palette: set data-palette attribute on <html> so CSS vars take effect
  const applyPalette = (id: string) => {
    document.documentElement.setAttribute('data-palette', id)
    localStorage.setItem('setting-palette', id)
    setActivePalette(id)
  }

  // Restore saved palette on mount
  useState(() => {
    const saved = localStorage.getItem('setting-palette') || 'lavender'
    document.documentElement.setAttribute('data-palette', saved)
  })

  // Expandable states
  const [aboutOpen, setAboutOpen] = useState(false)
  const [crisisOpen, setCrisisOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Persist toggle helpers
  const toggle = (key: string, setter: (v: boolean) => void) => (val: boolean) => {
    localStorage.setItem(key, String(val))
    setter(val)
  }

  const handleBehavioralToggle = (val: boolean) => {
    localStorage.setItem('setting-behavioral', String(val))
    setBehavioralInsights(val)
    if (!val) {
      localStorage.setItem('setting-sleep', 'false')
      localStorage.setItem('setting-screen', 'false')
      localStorage.setItem('setting-steps', 'false')
      setSleepData(false)
      setScreenTime(false)
      setStepCount(false)
    }
  }

  const handleDarkMode = (val: boolean) => {
    localStorage.setItem('setting-darkmode', String(val))
    setDarkMode(val)
    document.documentElement.classList.toggle('dark', val)
  }

  const handleDeleteAll = async () => {
    if (!user?.id) return
    try {
      await supabase.from('journal_entries').delete().eq('user_id', user.id)
      setDeleteDialogOpen(false)
    } catch (err) {
      console.error('Failed to delete data:', err)
    }
  }

  const handleExport = async () => {
    if (!user?.id) return
    try {
      const { data } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
      if (!data) return
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mannmitra_data_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const handleSignOut = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6 max-w-2xl mx-auto">

      {/* ─── 1. Profile Section ─── */}
      <Card className="border-border/40 shadow-sm">
        <CardContent className="p-4">
          <button
            className="flex w-full items-center justify-between gap-3 cursor-pointer text-left"
            onClick={() => {}}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
                  {user?.avatar || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-bold text-foreground">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email || 'user@example.com'}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        </CardContent>
      </Card>

      {/* ─── 2. Google Fit + Color Palettes ─── */}
      <div className="flex flex-col gap-4">
        {/* Google Fit Connected */}
        <Card className="border-border/40 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="none"/>
                    <path d="M16.5 7.5L12 12l-2.5-2.5" stroke={googleFitConnected ? '#10b981' : '#94a3b8'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    <path d="M12 12l-2.5 2.5" stroke={googleFitConnected ? '#3b82f6' : '#94a3b8'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    <path d="M12 12l4.5 4.5" stroke={googleFitConnected ? '#ef4444' : '#94a3b8'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    <path d="M12 12L7.5 7.5" stroke={googleFitConnected ? '#f59e0b' : '#94a3b8'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Google Fit</p>
                  <p className="text-xs text-muted-foreground">
                    {googleFitConnected ? 'Connected • Syncing health data' : 'Connect to sync health data'}
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (googleFitConnected) {
                    disconnectGoogleFit()
                    setGoogleFitConnected(false)
                  } else {
                    setGfitLoading(true)
                    try {
                      await connectGoogleFit()
                      setGoogleFitConnected(true)
                    } catch (err) {
                      console.error('Google Fit connect failed:', err)
                    } finally {
                      setGfitLoading(false)
                    }
                  }
                }}
                disabled={gfitLoading}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer disabled:opacity-50',
                  googleFitConnected
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90',
                )}
              >
                {gfitLoading ? (
                  'Connecting...'
                ) : googleFitConnected ? (
                  <><Check className="h-3 w-3" /> Connected</>
                ) : (
                  'Connect'
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Color Palettes */}
        <div>
          <SectionLabel>
            <span className="flex items-center gap-1.5"><Palette className="h-3.5 w-3.5" /> Appearance</span>
          </SectionLabel>
          <Card className="border-border/40 shadow-sm overflow-hidden">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-4">Choose a colour theme for the entire app</p>
              <div className="grid grid-cols-3 gap-3">
                {([
                  {
                    id: 'cosmic', label: 'Cosmic', emoji: '✨',
                    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 50%, #C4B5FD 100%)',
                    glow: 'rgba(139,92,246,0.55)',
                  },
                  {
                    id: 'ocean', label: 'Ocean', emoji: '🌊',
                    gradient: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 50%, #67E8F9 100%)',
                    glow: 'rgba(8,145,178,0.55)',
                  },
                  {
                    id: 'sage', label: 'Sage', emoji: '🌿',
                    gradient: 'linear-gradient(135deg, #059669 0%, #34D399 50%, #6EE7B7 100%)',
                    glow: 'rgba(5,150,105,0.55)',
                  },
                  {
                    id: 'aurora', label: 'Aurora', emoji: '🌸',
                    gradient: 'linear-gradient(135deg, #DB2777 0%, #EC4899 50%, #F9A8D4 100%)',
                    glow: 'rgba(219,39,119,0.55)',
                  },
                  {
                    id: 'solar', label: 'Solar', emoji: '☀️',
                    gradient: 'linear-gradient(135deg, #D97706 0%, #F59E0B 50%, #FCD34D 100%)',
                    glow: 'rgba(217,119,6,0.55)',
                  },
                  {
                    id: 'midnight', label: 'Midnight', emoji: '🌙',
                    gradient: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #818CF8 100%)',
                    glow: 'rgba(79,70,229,0.55)',
                  },
                ] as const).map((palette) => {
                  const isActive = activePalette === palette.id
                  return (
                    <button
                      key={palette.id}
                      onClick={() => applyPalette(palette.id)}
                      className={cn(
                        'relative flex flex-col items-center gap-2 rounded-2xl p-3 transition-all duration-300 cursor-pointer border',
                        isActive
                          ? 'bg-card border-primary/40 scale-[1.04] shadow-lg'
                          : 'border-transparent hover:border-border/60 hover:bg-muted/30',
                      )}
                    >
                      {/* Gradient bubble */}
                      <div
                        className="relative h-14 w-14 rounded-2xl transition-all duration-300"
                        style={{
                          background: palette.gradient,
                          boxShadow: isActive ? `0 0 20px 4px ${palette.glow}` : 'none',
                        }}
                      >
                        <span className="absolute inset-0 flex items-center justify-center text-2xl select-none">
                          {palette.emoji}
                        </span>
                        {/* Checkmark overlay */}
                        {isActive && (
                          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <span className={cn(
                        'text-[11px] font-semibold transition-colors',
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      )}>
                        {palette.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── 3. Tracking Section ─── */}
      <div>
        <SectionLabel>{t('tracking.title')}</SectionLabel>
        <Card className="border-border/40 shadow-sm">
          <CardContent className="px-4 py-1 divide-y divide-border/40">
            <ToggleRow
              icon={Activity}
              iconBg="bg-violet-500/10"
              iconColor="text-violet-500"
              title={t('tracking.behavioral')}
              description={t('tracking.behavioralDesc')}
              checked={behavioralInsights}
              onCheckedChange={handleBehavioralToggle}
            />

            {/* Nested items — collapse when Behavioral Insights off */}
            <div
              className={cn(
                'overflow-hidden transition-all duration-300 ease-in-out',
                behavioralInsights ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0',
              )}
            >
              <div className="divide-y divide-border/40">
                <ToggleRow
                  icon={BedDouble}
                  iconBg="bg-indigo-500/10"
                  iconColor="text-indigo-500"
                  title={t('tracking.sleep')}
                  description={t('tracking.sleepDesc')}
                  checked={sleepData}
                  onCheckedChange={toggle('setting-sleep', setSleepData)}
                  className="pl-2"
                />
                <ToggleRow
                  icon={Smartphone}
                  iconBg="bg-orange-500/10"
                  iconColor="text-orange-400"
                  title={t('tracking.screen')}
                  description={t('tracking.screenDesc')}
                  checked={screenTime}
                  onCheckedChange={toggle('setting-screen', setScreenTime)}
                  className="pl-2"
                />
                <ToggleRow
                  icon={Footprints}
                  iconBg="bg-emerald-500/10"
                  iconColor="text-emerald-500"
                  title={t('tracking.steps')}
                  description={t('tracking.stepsDesc')}
                  checked={stepCount}
                  onCheckedChange={toggle('setting-steps', setStepCount)}
                  className="pl-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── 4. Preferences Section ─── */}
      <div>
        <SectionLabel>{t('prefs.title')}</SectionLabel>
        <Card className="border-border/40 shadow-sm">
          <CardContent className="px-4 py-1 divide-y divide-border/40">
            <ToggleRow
              icon={Bell}
              iconBg="bg-sky-500/10"
              iconColor="text-sky-500"
              title={t('prefs.reminders')}
              description={t('prefs.remindersDesc')}
              checked={reminders}
              onCheckedChange={toggle('setting-reminders', setReminders)}
            />
            <ToggleRow
              icon={MoonIcon}
              iconBg="bg-slate-500/10"
              iconColor="text-slate-500"
              title={t('prefs.darkMode')}
              description={t('prefs.darkModeDesc')}
              checked={darkMode}
              onCheckedChange={handleDarkMode}
            />
          </CardContent>
        </Card>
      </div>

      {/* ─── 5. Language / भाषा Section ─── */}
      <div>
        <SectionLabel>{t('lang.title')}</SectionLabel>
        <Card className="border-border/40 shadow-sm">
          <CardContent className="px-4 py-1">
            <ToggleRow
              icon={Languages}
              iconBg="bg-purple-500/10"
              iconColor="text-purple-500"
              title={t('lang.english')}
              description={t('lang.switchHindi')}
              checked={language === 'hi'}
              onCheckedChange={(val) => setLanguage(val ? 'hi' : 'en')}
            />
          </CardContent>
        </Card>
      </div>

      {/* ─── 6. About Section ─── */}
      <div>
        <SectionLabel>{t('about.title')}</SectionLabel>
        <Card className="border-border/40 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <button
              onClick={() => setAboutOpen(v => !v)}
              className={cn(
                'flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer rounded-xl',
                aboutOpen ? 'bg-muted/60' : 'hover:bg-muted/30',
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                  <Info className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-sm font-semibold text-foreground">{t('about.mannmitra')}</p>
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-primary transition-transform duration-200',
                  aboutOpen && 'rotate-180',
                )}
              />
            </button>
            <div
              className={cn(
                'overflow-hidden transition-all duration-300 ease-in-out',
                aboutOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0',
              )}
            >
              <div className="px-4 pb-4 pt-1">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('about.body')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── 7. Data & Account Section ─── */}
      <div>
        <SectionLabel>{t('data.title')}</SectionLabel>
        <Card className="border-border/40 shadow-sm">
          <CardContent className="px-4 py-1 divide-y divide-border/40">
            <TappableRow
              icon={Download}
              iconBg="bg-blue-500/10"
              iconColor="text-blue-500"
              title={t('data.export')}
              onClick={handleExport}
            />
            <TappableRow
              icon={Shield}
              iconBg="bg-green-500/10"
              iconColor="text-green-500"
              title={t('data.privacy')}
              onClick={() => window.open('/privacy', '_blank')}
            />
            <TappableRow
              icon={HelpCircle}
              iconBg="bg-teal-500/10"
              iconColor="text-teal-500"
              title={t('data.help')}
              onClick={() => window.open('/help', '_blank')}
            />
          </CardContent>
        </Card>
      </div>

      {/* ─── 8. Crisis Resources Section ─── */}
      <div>
        <SectionLabel className="text-red-400">{t('crisis.title')}</SectionLabel>
        <Card className="border-red-200/60 bg-red-50/30 dark:bg-red-950/10 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <button
              onClick={() => setCrisisOpen(v => !v)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                  <Phone className="h-4 w-4 text-red-500" />
                </div>
                <p className="text-sm font-semibold text-foreground">{t('crisis.helplines')}</p>
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-red-400 transition-transform duration-200',
                  crisisOpen && 'rotate-180',
                )}
              />
            </button>
            <div
              className={cn(
                'overflow-hidden transition-all duration-300 ease-in-out',
                crisisOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0',
              )}
            >
              <div className="px-4 pb-4 space-y-2">
                {helplines.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-background/80 border border-border/40 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-xs text-muted-foreground">{h.country}</p>
                      <p className="text-sm font-semibold text-foreground">{h.name}</p>
                    </div>
                    <a
                      href={h.number.startsWith('http') ? h.number : `tel:${h.number.replace(/\s/g, '')}`}
                      className="text-sm font-bold text-red-500 hover:underline"
                    >
                      {h.number}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── 9. Danger Zone Section ─── */}
      <div>
        <SectionLabel className="text-red-400">{t('danger.title')}</SectionLabel>
        <Card className="border-red-200/60 bg-red-50/30 dark:bg-red-950/10 shadow-sm">
          <CardContent className="px-4 py-1">
            <button
              onClick={() => setDeleteDialogOpen(true)}
              className="flex w-full items-center justify-between gap-3 py-3.5 text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-500">{t('danger.delete')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('danger.deleteDesc')}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500">{t('danger.confirmTitle')}</DialogTitle>
            <DialogDescription>{t('danger.confirmDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('danger.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteAll}>
              {t('danger.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── 10. Sign Out Button ─── */}
      <Card className="border-border/40 shadow-sm">
        <CardContent className="p-0">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 py-3.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            {t('signOut')}
          </button>
        </CardContent>
      </Card>

      {/* ─── 11. Footer ─── */}
      <p className="text-center text-xs text-muted-foreground pb-4">
        MannMitra v1.0.0
      </p>
    </div>
  )
}

export default Settings
