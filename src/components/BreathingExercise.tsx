import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const BreathingExercise: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('inhale');
    const [count, setCount] = useState(4);
    const [cycles, setCycles] = useState(0);
    const [technique] = useState<'box' | '478'>('box');
    const PHASES = technique === 'box' ? [
        { phase: 'inhale', label: 'Breathe In', duration: 4, color: '#06B6D4', scale: 1.3 },
        { phase: 'hold', label: 'Hold', duration: 4, color: '#8B5CF6', scale: 1.3 },
        { phase: 'exhale', label: 'Breathe Out', duration: 4, color: '#10B981', scale: 0.85 },
        { phase: 'rest', label: 'Rest', duration: 4, color: '#64748B', scale: 0.85 },
    ] : [
        { phase: 'inhale', label: 'Breathe In', duration: 4, color: '#06B6D4', scale: 1.3 },
        { phase: 'hold', label: 'Hold', duration: 7, color: '#8B5CF6', scale: 1.3 },
        { phase: 'exhale', label: 'Breathe Out', duration: 8, color: '#10B981', scale: 0.85 },
    ] as { phase: string; label: string; duration: number; color: string; scale: number }[];
    

    useEffect(() => {
        const current = PHASES.find(p => p.phase === phase)!; 
        setCount(current.duration);
        const interval = setInterval(() => {
            setCount(c => {
                if (c <= 1) {
                    const idx = PHASES.findIndex(p => p.phase === phase);
                    const next = PHASES[(idx + 1) % PHASES.length];
                    setPhase(next.phase as 'inhale' | 'hold' | 'exhale' | 'rest');
                    if (next.phase === 'inhale') setCycles(cy => cy + 1);
                    return next.duration;
                }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [phase]);

    const current = PHASES.find(p => p.phase === phase)!;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg-card)', backdropFilter: 'blur(30px)',
            }}
        >
            <div style={{ textAlign: 'center', maxWidth: '380px', padding: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Breathing Exercise</h2>
                <p style={{ color: 'rgba(0,0,0,0.4)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>
                    Cycle {cycles + 1} · Follow the circle
                </p>

                {/* Animated circle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ position: 'relative', width: 200, height: 200 }}>
                        {/* Outer pulse ring */}
                        <motion.div
                            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
                            transition={{ duration: current.duration, repeat: Infinity, ease: 'easeInOut' }}
                            style={{
                                position: 'absolute', inset: -20, borderRadius: '50%',
                                border: `2px solid ${current.color}`,
                            }}
                        />
                        {/* Main circle */}
                        <motion.div
                            animate={{ scale: current.scale }}
                            transition={{ duration: current.duration * 0.9, ease: 'easeInOut' }}
                            style={{
                                position: 'absolute', inset: 0, borderRadius: '50%',
                                background: `radial-gradient(circle at 40% 40%, ${current.color}30, ${current.color}08)`,
                                border: `2px solid ${current.color}60`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexDirection: 'column', gap: '0.25rem',
                            }}
                        >
                            <motion.span
                                key={count}
                                initial={{ opacity: 0, scale: 0.6 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1, color: current.color }}
                            >
                                {count}
                            </motion.span>
                            <span style={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.5)' }}>seconds</span>
                        </motion.div>
                    </div>
                </div>

                <motion.p
                    key={phase}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ fontSize: '1.3rem', fontWeight: 700, color: current.color, marginBottom: '0.5rem' }}
                >
                    {current.label}
                </motion.p>
                <p style={{ color: 'rgba(0,0,0,0.35)', fontSize: '0.85rem', marginBottom: '2rem' }}>
                    {phase === 'inhale' && 'Fill your lungs slowly and deeply'}
                    {phase === 'hold' && 'Keep your breath steady'}
                    {phase === 'exhale' && 'Release all tension slowly'}
                    {phase === 'rest' && 'Pause before the next breath'}
                </p>

                <button
                    onClick={onClose}
                    className="btn btn-glass btn-lg"
                    style={{ width: '100%', justifyContent: 'center' }}
                >
                    Done · {cycles} cycles complete
                </button>
            </div>
        </motion.div>
    );
};
