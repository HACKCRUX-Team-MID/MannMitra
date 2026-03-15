import React, { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    LineChart, Shield, Activity,
    Battery, Clock, AlertTriangle, ArrowRight,
    Database, Lock, Microchip, Cpu, BookHeart,
    CheckCircle2, Star, Zap, Heart, UserPlus,
    PenLine, BarChart2, Play, Smile
} from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';

const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
};

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.88 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

/* ─── Mini animated chart for hero ─── */
const HeroChart = () => {
    const points = [40, 65, 45, 80, 55, 90, 70, 95, 78, 100];
    const max = Math.max(...points);
    const w = 400; const h = 120;
    const pts = points.map((v, i) => `${(i / (points.length - 1)) * w},${h - (v / max) * h}`).join(' ');

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
            <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor="#22D3EE" />
                </linearGradient>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A855F7" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon
                points={`0,${h} ${pts} ${w},${h}`}
                fill="url(#areaGrad)"
            />
            <polyline
                points={pts}
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {points.map((v, i) => (
                <circle
                    key={i}
                    cx={(i / (points.length - 1)) * w}
                    cy={h - (v / max) * h}
                    r="4"
                    fill="#000FFF"
                    stroke="url(#lineGrad)"
                    strokeWidth="2"
                />
            ))}
        </svg>
    );
};

/* ─── Stat counter widget ─── */
const StatBubble = ({ value, label, color }: { value: string; label: string; color: string }) => (
    <div className="flex flex-col items-center gap-0.5 px-5 py-3 rounded-2xl"
        style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.07)' }}>
        <span className="text-2xl font-black" style={{ color }}>{value}</span>
        <span className="text-xs text-gray-500 font-medium">{label}</span>
    </div>
);

const Home: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [activeStep, setActiveStep] = useState(0);

    const features = [
        { title: "Guided Journaling", desc: "Write or speak your daily reflections with tailored prompts that adapt to your current mood.", icon: BookHeart, color: "#EC4899", bg: "rgba(236,72,153,0.1)" },
        { title: "Emotion Detection", desc: "Local engine analyzes your text to surface subtle emotional signals with high fidelity.", icon: Smile, color: "#A855F7", bg: "rgba(168,85,247,0.1)" },
        { title: "Pattern Recognition", desc: "Discover hidden behavioral trends across days, weeks, and months through smart analytics.", icon: LineChart, color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
        { title: "Smart Emotion Tags", desc: "Automatic context tags like #sleep #work #stress based on your writing content.", icon: Zap, color: "#EAB308", bg: "rgba(234,179,8,0.1)" },
        { title: "Adaptive Learning", desc: "Emotion detection improves over time, tuning itself to your unique emotional vocabulary.", icon: Zap, color: "#22D3EE", bg: "rgba(34,211,238,0.1)" },
        { title: "100% Private", desc: "All data stays on your device. Zero cloud uploads, zero tracking, AES-256 encrypted locally.", icon: Shield, color: "#10B981", bg: "rgba(16,185,129,0.1)" },
    ];

    const pipeline = [
        { label: "Journal / Voice Input", icon: BookHeart, color: "#EC4899" },
        { label: "Local Processing Engine", icon: Cpu, color: "#A855F7" },
        { label: "Emotion Detection NLP", icon: Microchip, color: "#3B82F6" },
        { label: "Pattern Analyzer", icon: LineChart, color: "#22D3EE" },
        { label: "Encrypted Storage", icon: Database, color: "#10B981" },
    ];

    const problems = [
        { icon: Clock, color: "#EF4444", label: "Irregular sleep patterns" },
        { icon: Battery, color: "#F97316", label: "Emotional fatigue & low energy" },
        { icon: Battery, color: "#EAB308", label: "Subtle loss of motivation" },
        { icon: AlertTriangle, color: "#EC4899", label: "Early burnout signals" },
    ];

    /* ── Demo steps ── */
    const demoSteps = [
        {
            step: 1,
            icon: UserPlus,
            color: '#A855F7',
            title: 'Create Your Account',
            desc: 'Sign up in 30 seconds — just your name, email, and a password. No credit card, no hidden fees.',
            preview: (
                <div style={{ fontFamily: 'inherit' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem' }} className="text-gradient">MannMitra</span>
                    </div>
                    <p style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Create Account</p>
                    {[
                        { label: 'Full Name', val: 'Ishan Agrawal', done: true },
                        { label: 'Email', val: 'ishan@example.com', done: true },
                        { label: 'Password', val: '••••••••', done: true },
                    ].map(f => (
                        <div key={f.label} style={{ marginBottom: '0.5rem' }}>
                            <p style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(0,0,0,0.4)', marginBottom: '0.2rem' }}>{f.label}</p>
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                background: 'rgba(0,0,0,0.04)', borderRadius: '8px', padding: '0.45rem 0.7rem',
                                border: `1px solid ${f.done ? 'rgba(168,85,247,0.3)' : 'rgba(0,0,0,0.07)'}`,
                                fontSize: '0.78rem', color: 'rgba(0,0,0,0.6)',
                            }}>
                                {f.val}
                                {f.done && <CheckCircle2 size={12} color="#10B981" />}
                            </div>
                        </div>
                    ))}
                    <motion.div
                        animate={{ scale: [1, 1.03, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{ marginTop: '0.75rem', background: 'linear-gradient(135deg, #A855F7, #22D3EE)', borderRadius: '8px', padding: '0.6rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'white', cursor: 'pointer' }}
                    >
                        Create Account ✨
                    </motion.div>
                </div>
            ),
        },
        {
            step: 2,
            icon: PenLine,
            color: '#22D3EE',
            title: 'Log Your Emotions',
            desc: 'Select how you\'re feeling, rate the intensity, and optionally tag triggers like #work or #sleep.',
            preview: (
                <div>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(0,0,0,0.35)', marginBottom: '0.6rem' }}>How are you feeling?</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', marginBottom: '0.75rem' }}>
                        {[
                            { e: '🌟', l: 'Joy', c: '#F59E0B', active: false },
                            { e: '😌', l: 'Calm', c: '#14B8A6', active: true },
                            { e: '😰', l: 'Stress', c: '#EF4444', active: false },
                            { e: '🙏', l: 'Grateful', c: '#10B981', active: false },
                        ].map(em => (
                            <div key={em.l} style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.45rem 0.2rem',
                                borderRadius: '10px', border: `1.5px solid ${em.active ? em.c + '80' : 'transparent'}`,
                                background: em.active ? `${em.c}15` : 'rgba(0,0,0,0.04)',
                                fontSize: '1.1rem',
                            }}>
                                {em.e}
                                <span style={{ fontSize: '0.55rem', fontWeight: 600, color: em.active ? em.c : 'rgba(0,0,0,0.4)', marginTop: '0.15rem' }}>{em.l}</span>
                            </div>
                        ))}
                    </div>
                    <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(0,0,0,0.4)', marginBottom: '0.35rem' }}>Intensity</p>
                    <div style={{ position: 'relative', height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: 99, marginBottom: '0.6rem' }}>
                        <motion.div animate={{ width: ['20%', '65%', '65%'] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                            style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #14B8A6, #22D3EE)', borderRadius: 99 }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {['#calm', '#work', '#sleep'].map(t => (
                            <span key={t} style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '99px', background: 'rgba(34,211,238,0.12)', color: '#22D3EE', border: '1px solid rgba(34,211,238,0.3)' }}>{t}</span>
                        ))}
                    </div>
                </div>
            ),
        },
        {
            step: 3,
            icon: PenLine,
            color: '#EC4899',
            title: 'Write & Reflect',
            desc: 'Use clear prompts to guide your thoughts. Type freely, or use voice-to-text for hands-free journaling.',
            preview: (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(168,85,247,0.06)', borderRadius: '8px', padding: '0.5rem 0.75rem', marginBottom: '0.6rem', border: '1px solid rgba(168,85,247,0.1)' }}>
                        <p style={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.5)', fontStyle: 'italic' }}>"What gave you energy today?"</p>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.02)', borderRadius: '10px', padding: '0.75rem', minHeight: '80px', border: '1px solid rgba(0,0,0,0.06)', marginBottom: '0.5rem', position: 'relative' }}>
                        <motion.p
                            style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.6)', lineHeight: 1.6 }}
                        >
                            Today I finished the project early and had time to take a walk. It felt really refreshing…
                        </motion.p>
                        <motion.span
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ duration: 0.9, repeat: Infinity }}
                            style={{ display: 'inline-block', width: 2, height: 14, background: '#A855F7', borderRadius: 1, verticalAlign: 'middle', marginLeft: 1 }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: 'rgba(0,0,0,0.3)' }}>22 words · 134 chars</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', fontWeight: 600, color: '#EC4899', background: 'rgba(236,72,153,0.08)', borderRadius: '6px', padding: '0.25rem 0.5rem', border: '1px solid rgba(236,72,153,0.2)' }}>
                            🎙 Voice On
                        </div>
                    </div>
                </div>
            ),
        },
        {
            step: 4,
            icon: BarChart2,
            color: '#10B981',
            title: 'Discover Your Insights',
            desc: 'The app analyzes your patterns over time and surfaces personalized recommendations unique to you.',
            preview: (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.6rem' }}>
                        {[
                            { label: 'Mood Score', val: '8.4', color: '#A855F7' },
                            { label: 'Streak', val: '14d', color: '#22D3EE' },
                            { label: 'Positivity', val: '73%', color: '#10B981' },
                            { label: 'Top Emotion', val: 'Joy', color: '#EAB308' },
                        ].map(s => (
                            <div key={s.label} style={{ background: `${s.color}10`, borderRadius: '10px', padding: '0.5rem 0.6rem', border: `1px solid ${s.color}25` }}>
                                <p style={{ fontSize: '0.6rem', color: 'rgba(0,0,0,0.4)', fontWeight: 600, marginBottom: '0.15rem' }}>{s.label}</p>
                                <p style={{ fontSize: '1rem', fontWeight: 900, color: s.color }}>{s.val}</p>
                            </div>
                        ))}
                    </div>
                    {/* Mini chart */}
                    <div style={{ background: 'rgba(0,0,0,0.02)', borderRadius: '8px', padding: '0.5rem', border: '1px solid rgba(0,0,0,0.06)' }}>
                        <p style={{ fontSize: '0.6rem', color: 'rgba(0,0,0,0.35)', marginBottom: '0.4rem' }}>7-Day Mood Trend</p>
                        <svg viewBox="0 0 200 40" style={{ width: '100%', height: 40 }}>
                            <defs>
                                <linearGradient id="demoGrad" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#A855F7" />
                                    <stop offset="100%" stopColor="#22D3EE" />
                                </linearGradient>
                            </defs>
                            <polyline points="0,32 33,22 66,28 100,10 133,18 166,6 200,4"
                                fill="none" stroke="url(#demoGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            {[32, 22, 28, 10, 18, 6, 4].map((y, i) => (
                                <circle key={i} cx={i * 33.3} cy={y} r="3" fill="white" stroke="url(#demoGrad)" strokeWidth="1.5" />
                            ))}
                        </svg>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6rem' }}>

            {/* ══════════ HERO ══════════ */}
            <section style={{ paddingTop: '3rem', textAlign: 'center' }}>
                <motion.div variants={stagger} initial="hidden" animate="show" style={{ maxWidth: '820px', margin: '0 auto' }}>

                    <motion.div variants={fadeUp}>
                        <div className="hero-badge">
                            <Zap size={14} />
                            Emotional Intelligence · Privacy First
                        </div>
                    </motion.div>

                    <motion.h1 variants={fadeUp}
                        style={{ fontSize: 'clamp(2.5rem, 6vw, 5.5rem)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.04em', marginBottom: '1.5rem' }}
                    >
                        Understand Your Mind<br />
                        <span className="text-gradient">Before It Breaks You</span>
                    </motion.h1>

                    <motion.p variants={fadeUp}
                        style={{ fontSize: '1.15rem', color: 'rgba(0,0,0,0.55)', maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: 1.75 }}
                    >
                        Your emotional wellness companion — it spots burnout signals, tracks mood patterns, and helps you reflect daily before the damage is done.
                    </motion.p>

                    <motion.div variants={fadeUp} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to={isAuthenticated ? '/journal' : '/login'} style={{ textDecoration: 'none' }}>
                            <Button size="xl" className="glow-purple">
                                {isAuthenticated ? 'New Reflection' : 'Start Free'} <ArrowRight size={18} />
                            </Button>
                        </Link>
                        <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                            <Button variant="glass" size="xl">View Dashboard</Button>
                        </Link>
                    </motion.div>

                    {/* Social proof */}
                    <motion.div variants={fadeUp}
                        style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem', alignItems: 'center', flexWrap: 'wrap' }}
                    >
                        {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#EAB308" color="#EAB308" />)}
                        <span style={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.45)', marginLeft: '0.5rem' }}>
                            Trusted by 2,400+ early users
                        </span>
                    </motion.div>
                </motion.div>

                {/* Hero dashboard preview */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                    style={{ marginTop: '4rem', position: 'relative', maxWidth: '900px', margin: '4rem auto 0' }}
                >
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid rgba(0,0,0,0.08)',
                        borderRadius: '24px',
                        padding: '2rem',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(168,85,247,0.1)',
                    }}>
                        {/* Window chrome */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            {['#EF4444', '#EAB308', '#10B981'].map((c, i) => (
                                <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c, opacity: 0.8 }} />
                            ))}
                            <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.06)', marginLeft: '0.5rem' }} />
                            <span style={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.2)', fontFamily: 'monospace' }}>dashboard</span>
                        </div>

                        {/* Mini stat row */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                            <StatBubble value="8.4" label="Mood Score" color="#A855F7" />
                            <StatBubble value="14" label="Day Streak" color="#22D3EE" />
                            <StatBubble value="87%" label="Positivity" color="#10B981" />
                            <StatBubble value="Joy" label="Top Emotion" color="#EAB308" />
                        </div>

                        {/* Chart */}
                        <div style={{ background: 'rgba(0,0,0,0.02)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(0,0,0,0.05)' }}>
                            <p style={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.4)', marginBottom: '1rem' }}>7-Day Mood Trend</p>
                            <HeroChart />
                        </div>
                    </div>

                    {/* Floating alert card */}
                    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            position: 'absolute', top: '20%', right: '-60px',
                            background: 'var(--bg-card)', border: '1px solid rgba(0,0,0,0.1)',
                            borderRadius: '16px', padding: '1rem', backdropFilter: 'blur(20px)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)', minWidth: '160px',
                            display: 'none',
                        }}
                        className="md:block"
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <AlertTriangle size={16} color="#EF4444" />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>Stress Spike</p>
                                <p style={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.4)' }}>Linked to 4h sleep</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                        style={{
                            position: 'absolute', bottom: '20%', left: '-50px',
                            background: 'var(--bg-card)', border: '1px solid rgba(0,0,0,0.1)',
                            borderRadius: '16px', padding: '1rem', backdropFilter: 'blur(20px)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)', minWidth: '155px',
                            display: 'none',
                        }}
                        className="md:block"
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(20,184,166,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Activity size={16} color="#14B8A6" />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>Mood Up ↑12%</p>
                                <p style={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.4)' }}>vs last week</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Glow */}
                    <div style={{
                        position: 'absolute', bottom: '-60px', left: '10%', right: '10%', height: '80px',
                        background: 'radial-gradient(ellipse, rgba(168,85,247,0.18) 0%, transparent 70%)',
                        filter: 'blur(20px)', zIndex: -1,
                    }} />
                </motion.div>
            </section>

            {/* ══════════ PROBLEM SECTION ══════════ */}
            <section>
                <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
                    <motion.div variants={fadeUp} style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3.5rem' }}>
                        <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3.2rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
                            Mental health decline doesn't happen <span style={{ color: '#EF4444' }}>suddenly.</span>
                        </h2>
                        <p style={{ fontSize: '1.1rem', color: 'rgba(0,0,0,0.5)' }}>
                            It builds through small, invisible signals that most people miss until it's too late.
                        </p>
                    </motion.div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', maxWidth: '900px', margin: '0 auto 3rem' }}>
                        {problems.map((p, i) => (
                            <motion.div key={i} variants={fadeUp}>
                                <Card hoverEffect>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: 44, height: 44, borderRadius: '12px', background: `${p.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <p.icon size={20} color={p.color} />
                                        </div>
                                        <span style={{ fontWeight: 600 }}>{p.label}</span>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div variants={scaleIn}
                        style={{
                            maxWidth: '680px', margin: '0 auto',
                            background: 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(34,211,238,0.05) 100%)',
                            border: '1px solid rgba(168,85,247,0.2)',
                            borderRadius: '20px', padding: '2rem 2.5rem', textAlign: 'center'
                        }}
                    >
                        <Zap size={28} color="#A855F7" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }} className="text-gradient">The Solution</h3>
                        <p style={{ color: 'rgba(0,0,0,0.6)', lineHeight: 1.75 }}>
                            We use consistent micro-reflection to detect behavioral patterns in your daily life. Invisible emotional trends are surfaced before burnout sets in — giving you power to course-correct early.
                        </p>
                    </motion.div>
                </motion.div>
            </section>

            {/* ══════════ FEATURES ══════════ */}
            <section>
                <motion.div initial="hidden" whileInView="show" variants={stagger} viewport={{ once: true, margin: '-80px' }}>
                    <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                        <div className="section-label" style={{ justifyContent: 'center' }}>
                            <Zap size={14} />
                            Features
                        </div>
                        <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
                            A Complete Emotional Toolkit
                        </h2>
                        <p style={{ color: 'rgba(0,0,0,0.5)', maxWidth: '500px', margin: '0 auto' }}>
                            Everything you need to understand your patterns and build healthier mental habits.
                        </p>
                    </motion.div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                        {features.map((f, i) => (
                            <motion.div key={i} variants={fadeUp}>
                                <Card hoverEffect glowEffect style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ width: 52, height: 52, borderRadius: '14px', background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                                        <f.icon size={26} color={f.color} />
                                    </div>
                                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.6rem' }}>{f.title}</h3>
                                    <p style={{ fontSize: '0.9rem', color: 'rgba(0,0,0,0.5)', lineHeight: 1.7, flex: 1 }}>{f.desc}</p>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ══════════ HOW TO USE — INTERACTIVE DEMO ══════════ */}
            <section>
                <motion.div initial="hidden" whileInView="show" variants={stagger} viewport={{ once: true, margin: '-80px' }}>
                    <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                        <div className="section-label" style={{ justifyContent: 'center' }}>
                            <Play size={13} />
                            Interactive Demo
                        </div>
                        <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
                            How to Use <span className="text-gradient">the Journal</span>
                        </h2>
                        <p style={{ color: 'rgba(0,0,0,0.5)', maxWidth: '500px', margin: '0 auto' }}>
                            Get from zero to your first insight in under 2 minutes. Here's the full flow.
                        </p>
                    </motion.div>

                    <motion.div variants={fadeUp} style={{ maxWidth: '900px', margin: '0 auto' }}>
                        {/* Step tabs */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {demoSteps.map((s, i) => {
                                const Icon = s.icon;
                                const active = activeStep === i;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setActiveStep(i)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            padding: '0.6rem 1.1rem', borderRadius: '12px', border: 'none',
                                            cursor: 'pointer', transition: 'all 0.25s', fontWeight: 700,
                                            fontSize: '0.85rem',
                                            background: active ? s.color : 'rgba(0,0,0,0.05)',
                                            color: active ? 'white' : 'rgba(0,0,0,0.45)',
                                            boxShadow: active ? `0 4px 20px ${s.color}40` : 'none',
                                            transform: active ? 'scale(1.03)' : 'scale(1)',
                                        }}
                                    >
                                        <span style={{
                                            width: 20, height: 20, borderRadius: '50%',
                                            background: active ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.7rem', fontWeight: 900,
                                        }}>
                                            {i + 1}
                                        </span>
                                        <Icon size={14} />
                                        <span className="hidden md:inline">{s.title.split(' ')[0]}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Step content */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeStep}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                            >
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '2rem',
                                    alignItems: 'center',
                                }}>
                                    {/* Left: explanation */}
                                    <div>
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                            background: `${demoSteps[activeStep].color}15`,
                                            border: `1px solid ${demoSteps[activeStep].color}30`,
                                            borderRadius: '99px', padding: '0.35rem 0.85rem',
                                            marginBottom: '1.25rem',
                                        }}>
                                            {React.createElement(demoSteps[activeStep].icon, { size: 15, color: demoSteps[activeStep].color })}
                                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: demoSteps[activeStep].color }}>
                                                Step {activeStep + 1} of {demoSteps.length}
                                            </span>
                                        </div>
                                        <h3 style={{ fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.85rem', lineHeight: 1.2 }}>
                                            {demoSteps[activeStep].title}
                                        </h3>
                                        <p style={{ color: 'rgba(0,0,0,0.55)', lineHeight: 1.75, fontSize: '1rem', marginBottom: '1.75rem' }}>
                                            {demoSteps[activeStep].desc}
                                        </p>

                                        {/* Navigation */}
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                            {activeStep > 0 && (
                                                <button
                                                    onClick={() => setActiveStep(p => p - 1)}
                                                    className="btn btn-glass btn-sm"
                                                >
                                                    ← Back
                                                </button>
                                            )}
                                            {activeStep < demoSteps.length - 1 ? (
                                                <button
                                                    onClick={() => setActiveStep(p => p + 1)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                        padding: '0.6rem 1.25rem', borderRadius: '10px', border: 'none',
                                                        background: demoSteps[activeStep].color, color: 'white',
                                                        cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem',
                                                        boxShadow: `0 4px 16px ${demoSteps[activeStep].color}40`,
                                                    }}
                                                >
                                                    Next Step <ArrowRight size={14} />
                                                </button>
                                            ) : (
                                                <Link to={isAuthenticated ? '/journal' : '/login'} style={{ textDecoration: 'none' }}>
                                                    <button
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                            padding: '0.6rem 1.25rem', borderRadius: '10px', border: 'none',
                                                            background: 'linear-gradient(135deg, #A855F7, #22D3EE)', color: 'white',
                                                            cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem',
                                                            boxShadow: '0 4px 20px rgba(168,85,247,0.4)',
                                                        }}
                                                    >
                                                        <Zap size={14} />
                                                        {isAuthenticated ? 'Start Journaling' : 'Get Started Free'}
                                                    </button>
                                                </Link>
                                            )}
                                        </div>

                                        {/* Step dots */}
                                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '1.5rem' }}>
                                            {demoSteps.map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setActiveStep(i)}
                                                    style={{
                                                        width: i === activeStep ? 24 : 8, height: 8, borderRadius: 99,
                                                        border: 'none', cursor: 'pointer', padding: 0,
                                                        background: i === activeStep ? demoSteps[activeStep].color : 'rgba(0,0,0,0.12)',
                                                        transition: 'all 0.3s',
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right: animated mockup */}
                                    <div style={{
                                        background: 'var(--bg-card)',
                                        border: `1px solid ${demoSteps[activeStep].color}25`,
                                        borderRadius: '20px',
                                        padding: '1.5rem',
                                        boxShadow: `0 20px 60px ${demoSteps[activeStep].color}15, 0 0 0 1px ${demoSteps[activeStep].color}10`,
                                        backdropFilter: 'blur(20px)',
                                    }}>
                                        {/* Fake window bar */}
                                        <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem' }}>
                                            {['#EF4444', '#EAB308', '#10B981'].map((c, i) => (
                                                <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.7 }} />
                                            ))}
                                        </div>
                                        {demoSteps[activeStep].preview}
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            </section>

            {/* ══════════ HOW IT WORKS / PIPELINE ══════════ */}
            <section>
                <motion.div initial="hidden" whileInView="show" variants={stagger} viewport={{ once: true, margin: '-80px' }}>
                    <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                        <div className="section-label" style={{ justifyContent: 'center' }}>
                            <Cpu size={14} />
                            Architecture
                        </div>
                        <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>
                            How It Works
                        </h2>
                        <p style={{ color: 'rgba(0,0,0,0.5)' }}>A privacy-first pipeline that never leaves your device.</p>
                    </motion.div>

                    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0', position: 'relative' }}>
                        {pipeline.map((node, i) => (
                            <motion.div key={i} variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    background: 'var(--bg-card)',
                                    border: `1px solid ${node.color}30`,
                                    borderRadius: '16px', padding: '1.1rem 1.75rem',
                                    width: '100%',
                                    boxShadow: `0 0 30px ${node.color}12`,
                                    backdropFilter: 'blur(16px)',
                                }}>
                                    <div style={{ width: 42, height: 42, borderRadius: '10px', background: `${node.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <node.icon size={20} color={node.color} />
                                    </div>
                                    <span style={{ fontWeight: 600 }}>{node.label}</span>
                                    <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: node.color, boxShadow: `0 0 8px ${node.color}` }} />
                                </div>
                                {i < pipeline.length - 1 && (
                                    <div style={{ width: 2, height: 28, background: `linear-gradient(to bottom, ${node.color}60, ${pipeline[i + 1].color}30)` }} />
                                )}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ══════════ PRIVACY ══════════ */}
            <section>
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
                    <div style={{
                        maxWidth: '800px', margin: '0 auto',
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.07) 0%, var(--bg-card) 100%)',
                        border: '1px solid rgba(16,185,129,0.2)',
                        borderRadius: '24px', padding: '3rem', textAlign: 'center',
                        position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.12), transparent)', filter: 'blur(30px)', pointerEvents: 'none' }} />

                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <Lock size={30} color="#10B981" />
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1rem' }}>Your Mind is Private Territory</h2>
                        <p style={{ color: 'rgba(0,0,0,0.55)', fontSize: '1.05rem', maxWidth: '520px', margin: '0 auto 2.5rem', lineHeight: 1.75 }}>
                            We are built so we never see your data — ever. Everything happens locally, encrypted, on your own device.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', textAlign: 'left' }}>
                            {[
                                { icon: Shield, title: 'Locally Processed', desc: 'No cloud. Everything on your device.' },
                                { icon: Database, title: 'AES-256 Encrypted', desc: 'Military-grade encryption, always.' },
                                { icon: Lock, title: 'Per-User Private', desc: 'Each account has its own isolated data.' },
                                { icon: CheckCircle2, title: 'Open Auditable', desc: 'Our privacy model is publicly documented.' },
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                    <item.icon size={18} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} />
                                    <div>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>{item.title}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.4)', lineHeight: 1.5 }}>{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* ══════════ CTA ══════════ */}
            <section style={{ textAlign: 'center', paddingBottom: '4rem' }}>
                <motion.div initial={{ opacity: 0, scale: 0.92 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                    <Heart size={32} color="#EC4899" style={{ margin: '0 auto 1.25rem' }} />
                    <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
                        Start Your Journey Today
                    </h2>
                    <p style={{ color: 'rgba(0,0,0,0.5)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
                        It only takes 2 minutes. Your data stays private. Just you and a place to reflect.
                    </p>
                    <Link to={isAuthenticated ? '/journal' : '/login'} style={{ textDecoration: 'none' }}>
                        <Button size="xl" className="glow-purple">
                            {isAuthenticated ? 'Write Today\'s Reflection' : 'Create Free Account'} <ArrowRight size={18} />
                        </Button>
                    </Link>
                </motion.div>
            </section>

            {/* Footer */}
            <footer style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '2rem 0', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }} className="text-gradient">MannMitra</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.3)' }}>
                    © {new Date().getFullYear()} MannMitra · A privacy-first emotional wellness initiative
                </p>
            </footer>
        </div>
    );
};

export default Home;
