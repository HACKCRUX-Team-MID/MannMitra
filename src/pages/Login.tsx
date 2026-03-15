import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Lock, Mail, ArrowRight, Eye, EyeOff, User, Sparkles, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SpiralLogo } from '@/components/ui/spiral-logo'
import { cn } from '@/lib/utils'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabase'

const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

const Login: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const { login, signup } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname || '/dashboard'

  // Login state
  const [lEmail, setLEmail] = useState('')
  const [lPass, setLPass] = useState('')
  const [lShowPass, setLShowPass] = useState(false)
  const [lLoading, setLLoading] = useState(false)
  const [lError, setLError] = useState('')

  // Signup state
  const [sName, setSName] = useState('')
  const [sEmail, setSEmail] = useState('')
  const [sPass, setSPass] = useState('')
  const [sConfirm, setSConfirm] = useState('')
  const [sShowPass, setSShowPass] = useState(false)
  const [sLoading, setSLoading] = useState(false)
  const [sError, setSError] = useState('')

  // Forgot password
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateEmail(lEmail) || lPass.length < 6) {
      setLError('Please enter a valid email and password (min 6 chars).')
      return
    }
    setLError('')
    setLLoading(true)
    const res = await login(lEmail, lPass)
    setLLoading(false)
    if (res.success) navigate(from, { replace: true })
    else setLError(res.error || 'Login failed.')
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sName.trim()) { setSError('Full name is required.'); return }
    if (!validateEmail(sEmail)) { setSError('Enter a valid email.'); return }
    if (sPass.length < 6) { setSError('Password must be at least 6 characters.'); return }
    if (sConfirm !== sPass) { setSError('Passwords do not match.'); return }
    setSError('')
    setSLoading(true)
    const res = await signup(sName, sEmail, sPass)
    setSLoading(false)
    if (res.success) navigate('/dashboard', { replace: true })
    else setSError(res.error || 'Sign up failed.')
  }

  const handleForgot = async () => {
    if (!lEmail || !validateEmail(lEmail)) { setLError('Enter your email first.'); return }
    setForgotLoading(true)
    await supabase.auth.resetPasswordForEmail(lEmail)
    setForgotLoading(false)
    setForgotSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <SpiralLogo className="h-10 w-10" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {mode === 'login' ? 'Continue your reflection journey.' : 'Start understanding your mind today.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-muted p-1">
          {(['login', 'signup'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setLError(''); setSError('') }}
              className={cn(
                "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200",
                mode === m
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Form Card */}
        <Card className="border-border/50 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6 space-y-5">
            {/* Error */}
            {(lError || sError) && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {lError || sError}
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email" value={lEmail} onChange={e => setLEmail(e.target.value)}
                      placeholder="you@example.com" autoComplete="email"
                      className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type={lShowPass ? 'text' : 'password'} value={lPass}
                      onChange={e => setLPass(e.target.value)}
                      placeholder="••••••••" autoComplete="current-password"
                      className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                    <button type="button" onClick={() => setLShowPass(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {lShowPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Forgot */}
                <div className="text-right">
                  {forgotSent ? (
                    <span className="text-xs text-green-500 font-medium">✅ Reset link sent!</span>
                  ) : (
                    <button type="button" onClick={handleForgot} disabled={forgotLoading}
                      className="text-xs text-primary font-medium hover:underline">
                      {forgotLoading ? 'Sending...' : 'Forgot Password?'}
                    </button>
                  )}
                </div>

                <Button type="submit" disabled={lLoading} className="w-full">
                  {lLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign In <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text" value={sName} onChange={e => setSName(e.target.value)}
                      placeholder="Your Name" autoComplete="name"
                      className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email" value={sEmail} onChange={e => setSEmail(e.target.value)}
                      placeholder="you@example.com" autoComplete="email"
                      className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type={sShowPass ? 'text' : 'password'} value={sPass}
                      onChange={e => setSPass(e.target.value)}
                      placeholder="Min. 6 characters" autoComplete="new-password"
                      className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                    <button type="button" onClick={() => setSShowPass(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {sShowPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type={sShowPass ? 'text' : 'password'} value={sConfirm}
                      onChange={e => setSConfirm(e.target.value)}
                      placeholder="Re-enter password" autoComplete="new-password"
                      className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={sLoading} className="w-full">
                  {sLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> Create Account
                    </span>
                  )}
                </Button>

                {/* Benefits */}
                <div className="space-y-2 pt-2">
                  {['Your data stays private & secure', 'Free forever — no credit card', 'Delete your account anytime'].map(t => (
                    <div key={t} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                      {t}
                    </div>
                  ))}
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Bottom toggle */}
        <p className="text-center text-sm text-muted-foreground">
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setLError(''); setSError('') }}
            className="text-primary font-semibold hover:underline"
          >
            {mode === 'login' ? 'Sign up free' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default Login
