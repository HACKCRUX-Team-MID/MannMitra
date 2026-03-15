import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookHeart, LayoutDashboard, Lightbulb, Menu, X, LogOut, HeartHandshake, Palette, HeartPulse, MessageCircle, Shield, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { BreathingExercise } from './BreathingExercise';
import MicroCheckin from './MicroCheckin';
import { behavioralDataStore } from '../utils/behavioralDataStore';
import { deviceSignalCollector } from '../utils/deviceSignalCollector';

interface LayoutProps { children: ReactNode; }

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
    const [themeMenuOpen, setThemeMenuOpen] = useState(false);
    const [showSOS, setShowSOS] = useState(false);
    const [showCheckin, setShowCheckin] = useState(false);
    const [privacyMode, setPrivacyMode] = useState(() => localStorage.getItem('privacy-mode') === 'true');
    
    // Theme state
    const themes = ['light', 'dark', 'ocean', 'nature', 'sunset'];
    const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('app-theme') || 'light');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('app-theme', currentTheme);
    }, [currentTheme]);

    useEffect(() => {
        document.documentElement.setAttribute('data-privacy', privacyMode ? 'on' : 'off');
        localStorage.setItem('privacy-mode', String(privacyMode));
    }, [privacyMode]);

    // Start background device signal collection
    useEffect(() => {
        if (user?.id && isAuthenticated) {
            deviceSignalCollector.startCollection(user.id);
            return () => deviceSignalCollector.stopCollection();
        }
    }, [user?.id, isAuthenticated]);

    // Trigger daily check-in
    useEffect(() => {
        if (user?.id && isAuthenticated) {
            const hasCheckedIn = behavioralDataStore.hasCheckedInToday(user.id);
            if (!hasCheckedIn) {
                // Show after 3 second delay so it doesn't interrupt page load
                const timer = setTimeout(() => setShowCheckin(true), 3000);
                return () => clearTimeout(timer);
            }
        }
    }, [user?.id, isAuthenticated]);

    const navItems = [
        { path: '/', label: 'Home', icon: HeartHandshake },
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/journal', label: 'Journal', icon: BookHeart },
        { path: '/companion', label: 'Companion', icon: MessageCircle },
        { path: '/insights', label: 'Insights', icon: Lightbulb },
        { path: '/mood-prediction', label: 'Mood AI', icon: Brain },
    ];

    const handleLogout = () => {
        logout();
        setAvatarMenuOpen(false);
        setMobileMenuOpen(false);
        navigate('/');
    };

    return (
        <div className="app-container">
            {/* Animated background blobs */}
            <div className="animated-background">
                <div className="bg-blob blob-1" />
                <div className="bg-blob blob-2" />
                <div className="bg-blob blob-3" />
                <div className="bg-blob blob-4" />
            </div>

            {/* Navigation */}
            <nav className="sticky-nav">
                <div className="nav-container">
                    {/* Brand */}
                    <Link to="/" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }} className="text-gradient">
                            MannMitra
                        </span>
                    </Link>

                    {/* Desktop nav links */}
                    <div className="nav-links hidden md:flex">
                        {navItems.map(item => {
                            const isActive = location.pathname === item.path;
                            const Icon = item.icon;
                            return (
                                <Link key={item.path} to={item.path} className={`nav-item ${isActive ? 'active' : ''}`}>
                                    <Icon className="nav-icon" size={17} />
                                    <span className="nav-label">{item.label}</span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="active-indicator"
                                            initial={false}
                                            transition={{ type: 'spring', stiffness: 380, damping: 35 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right side */}
                    <div className="hidden md:flex items-center gap-3">
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowSOS(true)}
                                className="btn btn-sm"
                                aria-label="SOS Breathing Exercise"
                                style={{
                                    padding: '0.4rem 0.6rem', borderRadius: '8px',
                                    background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700
                                }}
                            >
                                <HeartPulse size={16} /> SOS
                            </button>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setPrivacyMode(p => !p)}
                                className="btn btn-sm"
                                aria-label="Toggle Privacy Mode"
                                style={{
                                    padding: '0.4rem 0.6rem', borderRadius: '8px',
                                    background: privacyMode ? 'rgba(16,185,129,0.12)' : 'rgba(0,0,0,0.05)',
                                    color: privacyMode ? '#10B981' : 'rgba(0,0,0,0.5)',
                                    border: `1px solid ${privacyMode ? 'rgba(16,185,129,0.3)' : 'rgba(0,0,0,0.08)'}`,
                                    display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600,
                                    fontSize: '0.78rem', transition: 'all 0.2s',
                                }}
                            >
                                <Shield size={14} /> {privacyMode ? 'Private' : 'Privacy'}
                            </button>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <button onClick={() => setThemeMenuOpen(p => !p)} className="btn btn-glass btn-sm" aria-label="Toggle theme" style={{ padding: '0.4rem', borderRadius: '50%' }}>
                                <Palette size={18} />
                            </button>
                            <AnimatePresence>
                                {themeMenuOpen && (
                                    <>
                                        <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setThemeMenuOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.92, y: -6 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.92, y: -6 }}
                                            transition={{ duration: 0.15 }}
                                            style={{
                                                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                                                background: 'var(--bg-card, white)',
                                                border: '1px solid var(--glass-border, rgba(0,0,0,0.08))',
                                                borderRadius: '14px', padding: '0.5rem',
                                                boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                                                minWidth: '140px', zIndex: 100,
                                                display: 'flex', flexDirection: 'column', gap: '4px'
                                            }}
                                        >
                                            {themes.map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => { setCurrentTheme(t); setThemeMenuOpen(false); }}
                                                    style={{
                                                        padding: '0.5rem 0.8rem', textAlign: 'left',
                                                        background: currentTheme === t ? 'rgba(168,85,247,0.1)' : 'transparent',
                                                        color: currentTheme === t ? 'var(--accent-purple, #A855F7)' : 'var(--text-primary)',
                                                        border: 'none', borderRadius: '8px', cursor: 'pointer',
                                                        fontWeight: currentTheme === t ? 700 : 500, textTransform: 'capitalize',
                                                        transition: 'all 0.1s'
                                                    }}
                                                    onMouseEnter={e => {
                                                        if (currentTheme !== t) e.currentTarget.style.background = 'var(--bg-glass-hover, rgba(0,0,0,0.04))';
                                                    }}
                                                    onMouseLeave={e => {
                                                        if (currentTheme !== t) e.currentTarget.style.background = 'transparent';
                                                    }}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        {isAuthenticated && user ? (
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setAvatarMenuOpen(p => !p)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                                        background: 'rgba(168,85,247,0.08)',
                                        border: '1px solid rgba(168,85,247,0.2)',
                                        borderRadius: '99px', padding: '0.35rem 0.75rem 0.35rem 0.4rem',
                                        cursor: 'pointer', transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(168,85,247,0.14)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(168,85,247,0.08)')}
                                >
                                    <div style={{
                                        width: 28, height: 28, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #A855F7, #22D3EE)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.72rem', fontWeight: 800, color: 'white', flexShrink: 0,
                                    }}>
                                        {user.avatar}
                                    </div>
                                    <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'rgba(0,0,0,0.7)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {user.name.split(' ')[0]}
                                    </span>
                                </button>

                                {/* Dropdown */}
                                <AnimatePresence>
                                    {avatarMenuOpen && (
                                        <>
                                            <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setAvatarMenuOpen(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.92, y: -6 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.92, y: -6 }}
                                                transition={{ duration: 0.15 }}
                                                style={{
                                                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                                                    background: 'var(--bg-card, white)',
                                                    border: '1px solid rgba(0,0,0,0.08)',
                                                    borderRadius: '14px', padding: '0.5rem',
                                                    boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                                                    minWidth: '200px', zIndex: 100,
                                                }}
                                            >
                                                <div style={{ padding: '0.75rem 0.875rem 0.75rem', borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: '0.4rem' }}>
                                                    <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.15rem' }}>{user.name}</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.4)' }}>{user.email}</p>
                                                </div>
                                                <button
                                                    onClick={handleLogout}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                                                        width: '100%', padding: '0.65rem 0.875rem',
                                                        background: 'none', border: 'none', cursor: 'pointer',
                                                        borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600,
                                                        color: '#EF4444', transition: 'background 0.15s',
                                                    }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                                >
                                                    <LogOut size={15} /> Sign Out
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <Link to="/login" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                                Get Started
                            </Link>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center gap-2">
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowSOS(true)}
                                className="btn btn-sm"
                                aria-label="SOS Breathing Exercise"
                                style={{
                                    padding: '0.35rem', borderRadius: '8px',
                                    background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700
                                }}
                            >
                                <HeartPulse size={16} />
                            </button>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <button onClick={() => setThemeMenuOpen(p => !p)} className="btn btn-glass btn-sm" aria-label="Toggle theme" style={{ padding: '0.4rem', borderRadius: '50%' }}>
                                <Palette size={18} />
                            </button>
                            <AnimatePresence>
                                {themeMenuOpen && (
                                    <>
                                        <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setThemeMenuOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.92, y: -6 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.92, y: -6 }}
                                            transition={{ duration: 0.15 }}
                                            style={{
                                                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                                                background: 'var(--bg-card, white)',
                                                border: '1px solid var(--glass-border, rgba(0,0,0,0.08))',
                                                borderRadius: '14px', padding: '0.5rem',
                                                boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                                                minWidth: '140px', zIndex: 100,
                                                display: 'flex', flexDirection: 'column', gap: '4px'
                                            }}
                                        >
                                            {themes.map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => { setCurrentTheme(t); setThemeMenuOpen(false); }}
                                                    style={{
                                                        padding: '0.5rem 0.8rem', textAlign: 'left',
                                                        background: currentTheme === t ? 'rgba(168,85,247,0.1)' : 'transparent',
                                                        color: currentTheme === t ? 'var(--accent-purple, #A855F7)' : 'var(--text-primary)',
                                                        border: 'none', borderRadius: '8px', cursor: 'pointer',
                                                        fontWeight: currentTheme === t ? 700 : 500, textTransform: 'capitalize',
                                                    }}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                        <button
                            className="btn btn-glass btn-sm"
                            onClick={() => setMobileMenuOpen(p => !p)}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden overflow-hidden border-t border-black/5"
                        >
                            <div className="flex flex-col gap-1 p-3">
                                {navItems.map(item => {
                                    const isActive = location.pathname === item.path;
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={`nav-item ${isActive ? 'active' : ''}`}
                                            onClick={() => setMobileMenuOpen(false)}
                                            style={{ padding: '0.75rem 1rem', borderRadius: '12px' }}
                                        >
                                            <Icon size={18} />
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                                <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                                    {isAuthenticated ? (
                                        <button
                                            onClick={handleLogout}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.6rem',
                                                width: '100%', padding: '0.75rem 1rem',
                                                background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)',
                                                borderRadius: '12px', cursor: 'pointer',
                                                fontSize: '0.88rem', fontWeight: 600, color: '#EF4444',
                                            }}
                                        >
                                            <LogOut size={16} /> Sign Out ({user?.name.split(' ')[0]})
                                        </button>
                                    ) : (
                                        <Link
                                            to="/login"
                                            className="btn btn-primary"
                                            style={{ textDecoration: 'none', justifyContent: 'center', width: '100%' }}
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Get Started
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            <main className="main-content">{children}</main>

            {/* Global SOS Breathing Exercise */}
            <AnimatePresence>
                {showSOS && <BreathingExercise onClose={() => setShowSOS(false)} />}
            </AnimatePresence>

            {/* Daily Micro Check-in */}
            <AnimatePresence>
                {showCheckin && user && (
                    <MicroCheckin
                        userId={user.id}
                        onClose={() => setShowCheckin(false)}
                        onComplete={() => setShowCheckin(false)}
                    />
                )}
            </AnimatePresence>

            {/* Mobile Bottom Navigation */}
            {isAuthenticated && (
                <div className="mobile-bottom-nav">
                    <div className="mobile-bottom-nav-inner">
                        {[
                            { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
                            { path: '/journal', label: 'Journal', icon: BookHeart },
                            { path: '/companion', label: 'Chat', icon: MessageCircle },
                            { path: '/insights', label: 'Insights', icon: Lightbulb },
                            { path: '/mood-prediction', label: 'Mood AI', icon: Brain },
                        ].map(item => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                                >
                                    <Icon size={20} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Layout;
