import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Wand2, Save, ChevronRight, Plus, X, Hash, Wind, Brain, ChevronDown, Shield, ThumbsUp, ThumbsDown, BookOpen, Lightbulb, MessageCircle, HeartHandshake, Sparkles, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Slider } from '../components/ui/slider';
import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';
import { BreathingExercise } from '../components/journal/breathing-exercise';
import { AIChatAssistant } from '../components/app/ai-chat-assistant';
import { useAuth } from '../context/AuthContext';
import { storage } from '../utils/storage';
import { getEmotionEmoji, preloadModel, type EmotionResult } from '../utils/emotionEngine';
import { runJournalPipeline, type PipelineResult } from '../utils/journalPipeline';
import type { EmotionalPattern } from '../utils/patternEngine';


/* ──── DATA ──── */
const emotionChips = [
    { label: 'melancholy', category: 'low' },
    { label: 'drained', category: 'low' },
    { label: 'overwhelmed', category: 'stressed' },
    { label: 'anxious', category: 'stressed' },
    { label: 'content', category: 'calm' },
    { label: 'peaceful', category: 'calm' },
    { label: 'energized', category: 'energetic' },
    { label: 'hopeful', category: 'energetic' },
    { label: 'grateful', category: 'calm' },
    { label: 'frustrated', category: 'stressed' },
];

const predefinedHashtags = ['work', 'exam', 'relationship', 'family', 'health', 'finance', 'selfcare', 'travel', 'friends', 'goals'];

const categoryColors: Record<string, string> = {
    low: "bg-[var(--mood-low)]/20 text-[var(--mood-low)] border-[var(--mood-low)]/30",
    stressed: "bg-[var(--mood-stressed)]/20 text-[var(--mood-stressed)] border-[var(--mood-stressed)]/30",
    calm: "bg-[var(--mood-calm)]/20 text-[var(--mood-calm)] border-[var(--mood-calm)]/30",
    energetic: "bg-[var(--mood-energetic)]/20 text-[var(--mood-energetic)] border-[var(--mood-energetic)]/30",
};

const moodLevels = [
    { value: 0, label: 'Terrible', emoji: '😢' },
    { value: 25, label: 'Low', emoji: '😔' },
    { value: 50, label: 'Okay', emoji: '😐' },
    { value: 75, label: 'Good', emoji: '😊' },
    { value: 100, label: 'Amazing', emoji: '😄' },
];

function getMoodFromValue(value: number) {
    if (value <= 12) return moodLevels[0];
    if (value <= 37) return moodLevels[1];
    if (value <= 62) return moodLevels[2];
    if (value <= 87) return moodLevels[3];
    return moodLevels[4];
}

/* ──── HELPERS ──── */
const getIntensityColor = (score: number) => {
    if (score <= 3) return '#22D3EE';
    if (score <= 6) return '#F59E0B';
    return '#EF4444';
};

const getTriggerCategoryColor = (category: string) => {
    switch (category) {
        case 'joy': return '#F59E0B';
        case 'sadness': return '#22D3EE';
        case 'anger': return '#EF4444';
        case 'fear': return '#6366F1';
        case 'fatigue': return '#A855F7';
        default: return '#6B7280';
    }
};

const getConfidenceLabel = (conf: number) => {
    if (conf >= 0.8) return "We're fairly sure";
    if (conf >= 0.6) return "This might be";
    return "We could be wrong, but";
};

/* ──── MAIN COMPONENT ──── */
export default function Journal() {
    const { user } = useAuth();
    const [step, setStep] = useState<'mood' | 'write' | 'analysis'>('write');

    // Pre-fill mood from Dashboard Quick Mood Check-in if the user selected one
    const [moodValue, setMoodValue] = useState(() => {
        const saved = localStorage.getItem('dashboard-mood-score')
        return saved ? parseInt(saved, 10) : 50
    });
    // Dashboard mood pill shown at the top of journal
    const [dashboardMood] = useState(() => {
        const emoji = localStorage.getItem('dashboard-mood-emoji')
        const label = localStorage.getItem('dashboard-mood-label')
        return emoji && label ? { emoji, label } : null
    });
    const [showBreathing, setShowBreathing] = useState(false);

    // Write step
    const [journalText, setJournalText] = useState('');
    const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
    const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
    const [customHashtags, setCustomHashtags] = useState<string[]>([]);
    const [newHashtag, setNewHashtag] = useState('');
    const [showHashtagInput, setShowHashtagInput] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [voiceError, setVoiceError] = useState<string | null>(null);
    const [micLang, setMicLang] = useState<'en-IN' | 'hi-IN' | 'en-US'>('en-IN');
    const recognitionRef = useRef<any>(null);
    const baseTextRef = useRef<string>(''); // text before recording started
    const [showAIAssistant, setShowAIAssistant] = useState(false);

    // Analysis overlay states
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<EmotionResult | null>(null);
    const [remixText, setRemixText] = useState<string | null>(null);
    const [showTriggers, setShowTriggers] = useState(false);
    const [vocabExpanded, setVocabExpanded] = useState(false);
    const [isLoadingRemix, setIsLoadingRemix] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [modelReady, setModelReady] = useState(false);
    // Pipeline result state
    const [pipelinePatterns, setPipelinePatterns] = useState<EmotionalPattern[]>([]);
    const [pipelineNudges, setPipelineNudges] = useState<string[]>([]);
    const [spiralAlert, setSpiralAlert] = useState<string | null>(null);
    const [encryptedBadge, setEncryptedBadge] = useState(false);

    const currentMood = getMoodFromValue(moodValue);
    const allHashtags = [...predefinedHashtags, ...customHashtags];

    useEffect(() => {
        preloadModel().then(() => setModelReady(true)).catch(console.error);
    }, []);

    /* ── Mic / Speech Recognition ── */
    const langLabels: Record<string, string> = { 'en-IN': 'EN', 'hi-IN': 'HI', 'en-US': 'US' };

    const cycleLang = () => {
        const order: Array<'en-IN' | 'hi-IN' | 'en-US'> = ['en-IN', 'hi-IN', 'en-US'];
        setMicLang(prev => order[(order.indexOf(prev) + 1) % order.length]);
    };

    const handleMicToggle = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
            return;
        }

        const SpeechRecognitionAPI =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognitionAPI) {
            setVoiceError('Voice input not supported. Use Chrome or Edge.');
            return;
        }

        setVoiceError(null);

        // Remember the text that exists BEFORE this recording session
        baseTextRef.current = journalText;

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = micLang;
        recognition.maxAlternatives = 1;

        // Track only the finals from THIS session
        let sessionFinal = '';

        recognition.onresult = (event: any) => {
            let sessionInterim = '';
            // Rebuild from all results in this session
            for (let i = 0; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    // Only count results from this session (resultIndex resets per session)
                    sessionFinal = '';
                    for (let j = 0; j <= i; j++) {
                        if (event.results[j].isFinal) {
                            sessionFinal += event.results[j][0].transcript;
                        }
                    }
                } else {
                    sessionInterim = transcript;
                }
            }
            // Base + this session's finals + current interim
            const base = baseTextRef.current.trimEnd();
            const divider = base.length > 0 ? ' ' : '';
            setJournalText(base + divider + sessionFinal + sessionInterim);
        };

        recognition.onerror = (event: any) => {
            if (event.error === 'no-speech') return; // ignore, keep recording
            if (event.error === 'not-allowed') {
                setVoiceError('Microphone permission denied. Allow mic access in browser.');
            } else if (event.error === 'network') {
                setVoiceError('Network error. Mic requires internet for speech recognition.');
            } else {
                setVoiceError(`Mic error: ${event.error}`);
            }
            setIsRecording(false);
        };

        recognition.onend = () => {
            setIsRecording(false);
            // Commit: trim trailing interim, keep only finals
            if (sessionFinal.trim()) {
                const base = baseTextRef.current.trimEnd();
                const divider = base.length > 0 ? ' ' : '';
                setJournalText((base + divider + sessionFinal).trimEnd());
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
    };

    const toggleEmotion = (emotion: string) => {
        setSelectedEmotions(prev => prev.includes(emotion) ? prev.filter(e => e !== emotion) : [...prev, emotion]);
    };

    const toggleHashtag = (tag: string) => {
        setSelectedHashtags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const addCustomHashtag = () => {
        const tag = newHashtag.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (tag && !customHashtags.includes(tag) && !predefinedHashtags.includes(tag)) {
            setCustomHashtags(prev => [...prev, tag]);
            setSelectedHashtags(prev => [...prev, tag]);
            setNewHashtag('');
            setShowHashtagInput(false);
        }
    };

    const removeCustomHashtag = (tag: string) => {
        setCustomHashtags(prev => prev.filter(t => t !== tag));
        setSelectedHashtags(prev => prev.filter(t => t !== tag));
    };

    const handleSave = async () => {
        if (!journalText.trim()) return;
        setIsLoading(true);

        // Load existing entries for pattern + spiral analysis
        const allEntries = await storage.getEntries(user?.id).catch(() => []);

        try {
            const result: PipelineResult = await runJournalPipeline({
                text: journalText,
                userId: user?.id,
                userName: user?.name || user?.email?.split('@')[0] || 'there',
                moodHint: dashboardMood?.label?.toLowerCase() || selectedEmotions[0],
                tags: selectedHashtags.map(t => `#${t}`),
                moodSliderValue: moodValue,
                allEntries,
            });

            // BERT + NLP result
            setAnalysisResult(result.emotionResult);

            // Companion reflection (auto-shown, no button needed)
            setRemixText(result.companionResponse.message);

            // Patterns detected from history
            setPipelinePatterns(result.patterns.filter(p => p.type === 'negative').slice(0, 2));

            // Behavioral nudges
            setPipelineNudges(result.nudges);

            // Spiral risk alert (gentle message only, score never shown)
            if (result.spiralRisk.shouldAlert) {
                setSpiralAlert(result.spiralRisk.gentleMessage);
            } else {
                setSpiralAlert(null);
            }

            // AES-256 local backup badge
            setEncryptedBadge(result.encryptedBackupSaved);

        } catch (err) {
            console.error('Pipeline error:', err);
            // ⚠️ DO NOT block analysis display — only log the error.
            // If Supabase fails, we still show the local AI analysis result.
            // If emotionEngine itself failed, analysisResult will be null so
            // we fall back gracefully.
        }

        setIsLoading(false);
        setStep('analysis');
    };

    const handleRemix = async () => {
        // Remix now regenerates a fresh companion response
        if (isLoadingRemix || !analysisResult) return;
        setIsLoadingRemix(true);
        try {
            const { generateCompanionResponse } = await import('../utils/companionEngine');
            const res = await generateCompanionResponse(journalText, user?.name || 'there');
            setRemixText(res.message);
        } catch (err) {
            console.error('Remix failed:', err);
        } finally {
            setIsLoadingRemix(false);
        }
    };

    const handleDone = () => {
        setStep('write');
        setJournalText('');
        setSelectedEmotions([]);
        setSelectedHashtags([]);
        setCustomHashtags([]);
        setMoodValue(50);
        setAnalysisResult(null);
        setRemixText(null);
        setShowTriggers(false);
        setVocabExpanded(false);
        setPipelinePatterns([]);
        setPipelineNudges([]);
        setSpiralAlert(null);
        setEncryptedBadge(false);
    };

    /* ──── MOOD STEP ──── */
    if (step === 'mood') {
        return (
            <div className="flex min-h-[calc(100vh-8rem)] flex-col px-4 py-6">
                {!modelReady && (
                    <div className="mb-4 rounded-full bg-primary/10 px-4 py-2 text-center text-xs text-primary">
                        🧠 AI model loading in background…
                    </div>
                )}

                <div className="mb-6 text-center">
                    <h2 className="text-xl font-semibold text-foreground">Track Your Feelings</h2>
                    <p className="mt-1 text-sm text-muted-foreground">How are you feeling right now?</p>
                </div>

                <div className="mb-6 flex justify-center">
                    <button onClick={() => setShowBreathing(true)} className="flex items-center gap-2 rounded-full bg-secondary/15 px-4 py-2.5 text-secondary transition-colors hover:bg-secondary/25">
                        <Wind className="h-4 w-4" />
                        <span className="text-sm font-medium">Feeling Panicked?</span>
                    </button>
                </div>

                <div className="flex flex-1 flex-col items-center justify-center gap-8">
                    <div className="relative">
                        <motion.div key={currentMood.emoji} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 shadow-lg">
                            <span className="text-8xl transition-all duration-300">{currentMood.emoji}</span>
                        </motion.div>
                        <div className="absolute inset-0 -z-10 rounded-full bg-primary/20 blur-2xl" />
                    </div>
                    <p className="text-2xl font-semibold text-foreground">{currentMood.label}</p>
                    <div className="w-full max-w-xs px-8">
                        <Slider value={[moodValue]} onValueChange={(v) => setMoodValue(v[0])} max={100} step={1} className="w-full" />
                        <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                            <span>Terrible</span>
                            <span>Amazing</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <Button onClick={() => setStep('write')} className="h-14 w-full rounded-full bg-primary text-lg font-semibold">
                        Continue <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>

                {showBreathing && <BreathingExercise onDone={() => setShowBreathing(false)} />}
            </div>
        );
    }

    /* ──── ANALYSIS STEP — error fallback ──── */
    if (step === 'analysis' && !analysisResult) {
        return (
            <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-4 px-4 py-6">
                <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-6 text-center max-w-sm">
                    <p className="text-2xl mb-2">⚠️</p>
                    <h3 className="font-semibold text-foreground mb-1">Could not analyse right now</h3>
                    <p className="text-sm text-muted-foreground mb-4">Your journal entry was saved locally. AI analysis may be unavailable offline or due to a network issue.</p>
                    <Button onClick={handleDone} className="rounded-full px-6">Go Back</Button>
                </div>
            </div>
        );
    }

    /* ──── ANALYSIS STEP ──── */
    if (step === 'analysis' && analysisResult) {
        return (
            <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-4 px-4 py-6 pb-12">

                {/* Non-clinical disclaimer */}
                <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-500/10 px-4 py-3">
                    <Shield className="h-4 w-4 text-amber-500" />
                    <p className="text-xs text-muted-foreground">This app helps you reflect — not a clinical diagnostic tool.</p>
                </div>

                {/* Multilingual badge */}
                {(analysisResult.method?.includes('hindi') || analysisResult.method?.includes('hinglish')) && (
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5">
                        <span className="text-sm">🌐</span>
                        <span className="text-xs text-muted-foreground">
                            {analysisResult.method.includes('hindi') ? 'Detected Hindi text' : 'Detected Hinglish text'}
                        </span>
                    </div>
                )}

                {/* Header */}
                <div className="text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                        className="mb-4 flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-secondary/20">
                        <Brain className="h-10 w-10 text-primary" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-primary">Reflection Saved ✨</h2>
                </div>

                {/* Detected Emotion Card */}
                <Card className="border-primary/30 bg-card overflow-hidden">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
                                <span className="text-4xl">{getEmotionEmoji(analysisResult.primaryEmotion)}</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground mb-0.5">Detected Emotion</p>
                                <h3 className="text-xl font-bold capitalize text-primary mb-1.5">{analysisResult.primaryEmotion}</h3>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${(analysisResult.intensityScore / 10) * 100}%` }}
                                            transition={{ duration: 1, delay: 0.3 }}
                                            style={{ background: getIntensityColor(analysisResult.intensityScore) }}
                                            className="h-full rounded-full" />
                                    </div>
                                    <span className="text-sm font-bold" style={{ color: getIntensityColor(analysisResult.intensityScore) }}>
                                        {analysisResult.intensityScore}/10
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                            <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <span className="text-xs text-muted-foreground">
                                    {getConfidenceLabel(analysisResult.confidence)} ({Math.round(analysisResult.confidence * 100)}% match)
                                </span>
                            </div>
                            {analysisResult.triggers?.length > 0 && (
                                <button onClick={() => setShowTriggers(!showTriggers)} className="flex items-center gap-1 text-xs font-semibold text-blue-500">
                                    Why this?
                                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showTriggers && "rotate-180")} />
                                </button>
                            )}
                        </div>

                        {/* Triggers Panel */}
                        <AnimatePresence>
                            {showTriggers && analysisResult.triggers?.length > 0 && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="mt-3 rounded-xl bg-muted/50 p-3">
                                        <p className="mb-2 text-xs text-muted-foreground">Emotional triggers in your text:</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {analysisResult.triggers.map((t, i) => (
                                                <span key={i} style={{ background: `${getTriggerCategoryColor(t.category)}20`, border: `1px solid ${getTriggerCategoryColor(t.category)}40`, color: getTriggerCategoryColor(t.category) }}
                                                    className="rounded-md px-2 py-0.5 text-xs font-medium">
                                                    "{t.word}"{t.negated && <span className="ml-1 opacity-60 text-[10px]">(negated)</span>}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>

                {/* Feedback Row */}
                <div className="flex items-center justify-center gap-3">
                    <span className="text-xs text-muted-foreground">Was this accurate?</span>
                    <Button variant="outline" size="sm" onClick={() => setShowFeedbackModal(false)} className="gap-1.5 rounded-full">
                        <ThumbsUp className="h-3.5 w-3.5" /> Yes
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowFeedbackModal(true)} className="gap-1.5 rounded-full">
                        <ThumbsDown className="h-3.5 w-3.5" /> No
                    </Button>
                </div>

                {/* Correction Dialog */}
                <AnimatePresence>
                    {showFeedbackModal && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <Card className="border-destructive/20 bg-destructive/5">
                                <CardContent className="p-4">
                                    <p className="mb-3 text-sm font-semibold">Help me learn. What were you actually feeling?</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Joy', 'Sadness', 'Anger', 'Apprehension', 'Fatigue', 'Contemplation'].map(emo => (
                                            <Button key={emo} variant="outline" size="sm" onClick={() => setShowFeedbackModal(false)} className="text-xs">{emo}</Button>
                                        ))}
                                    </div>
                                    <button onClick={() => setShowFeedbackModal(false)} className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Vocab Builder */}
                {analysisResult.vocabularyNote && (
                    <Card className="cursor-pointer" onClick={() => setVocabExpanded(!vocabExpanded)}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/15">
                                        <BookOpen className="h-4.5 w-4.5 text-green-500" />
                                    </div>
                                    <span className="font-semibold text-sm">Vocabulary Builder</span>
                                </div>
                                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", vocabExpanded && "rotate-180")} />
                            </div>
                            <AnimatePresence>
                                {vocabExpanded && (
                                    <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                        className="mt-3 overflow-hidden text-sm leading-relaxed text-muted-foreground">
                                        {analysisResult.vocabularyNote}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                )}

                {/* Awareness Insight */}
                <Card className="border-l-4 border-l-[#22D3EE] bg-[#22D3EE]/5">
                    <CardContent className="flex gap-3 p-4">
                        <Lightbulb className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#22D3EE]" />
                        <div>
                            <h4 className="mb-1 font-bold text-sm">Awareness Insight</h4>
                            <p className="text-sm leading-relaxed text-muted-foreground">{analysisResult.awarenessInsight}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Reflection Prompt */}
                <Card className="border-l-4 border-l-primary bg-primary/5">
                    <CardContent className="flex gap-3 p-4">
                        <MessageCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                        <div>
                            <h4 className="mb-1 font-bold text-sm">To consider...</h4>
                            <p className="text-sm leading-relaxed italic text-muted-foreground">"{analysisResult.reflectionPrompt}"</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Supportive Lens — auto-populated from companionEngine on save */}
                <AnimatePresence>
                    {remixText && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <Card className="border-blue-500/30 bg-card">
                                <CardContent className="flex gap-3 p-4">
                                    <HeartHandshake className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
                                    <div>
                                        <div className="mb-1.5 flex items-center gap-2">
                                            <h4 className="font-bold text-sm">Supportive Lens</h4>
                                            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-500">AI</span>
                                        </div>
                                        <p className="text-sm leading-relaxed text-muted-foreground">{remixText}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Behavioral Nudges — from patternEngine.generateBehavioralNudges */}
                <AnimatePresence>
                    {pipelineNudges.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                            <Card className="border-amber-500/30 bg-amber-500/5">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Lightbulb className="h-4 w-4 text-amber-500" />
                                        <h4 className="font-bold text-sm text-amber-600 dark:text-amber-400">Gentle Nudges</h4>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {pipelineNudges.map((nudge, i) => (
                                            <p key={i} className="text-sm leading-relaxed text-muted-foreground">• {nudge}</p>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Pattern Alerts — from patternEngine.analyzePatterns */}
                <AnimatePresence>
                    {pipelinePatterns.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                            <Card className="border-purple-500/30 bg-purple-500/5">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Brain className="h-4 w-4 text-purple-500" />
                                        <h4 className="font-bold text-sm text-purple-600 dark:text-purple-400">Patterns Noticed</h4>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        {pipelinePatterns.map((p) => (
                                            <div key={p.id}>
                                                <p className="text-sm font-semibold">{p.name}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Spiral Risk Alert — gentle message only, score never shown */}
                <AnimatePresence>
                    {spiralAlert && (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                            <Card className="border-rose-500/30 bg-rose-500/5">
                                <CardContent className="flex gap-3 p-4">
                                    <HeartHandshake className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-400" />
                                    <div>
                                        <p className="text-xs font-semibold text-rose-400 mb-1">A note from MannMitra</p>
                                        <p className="text-sm leading-relaxed text-muted-foreground">{spiralAlert}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Encrypted backup badge */}
                {encryptedBadge && (
                    <div className="flex items-center justify-center gap-1.5 py-1">
                        <Shield className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-[11px] text-muted-foreground">AES-256 local backup saved</span>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleRemix} disabled={isLoadingRemix} className="flex-1 gap-2 rounded-full">
                        <Sparkles className="h-4 w-4" />
                        {isLoadingRemix ? 'Thinking…' : 'Fresh Perspective'}
                    </Button>
                    <Button onClick={handleDone} className="flex-[2] gap-2 rounded-full bg-primary text-base font-semibold">
                        <Check className="h-4 w-4" /> Done
                    </Button>
                </div>
            </div>
        );
    }

    /* ──── WRITE STEP ──── */
    return (
        <div className="flex min-h-[calc(100vh-8rem)] flex-col px-4 py-4">
            {/* Dashboard mood banner */}
            {dashboardMood && (
                <div className="mb-4 flex items-center gap-3 rounded-2xl bg-primary/10 px-4 py-3 border border-primary/20">
                    <span className="text-3xl">{dashboardMood.emoji}</span>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground leading-tight">Mood from check-in</p>
                        <p className="text-base font-semibold text-primary">{dashboardMood.label}</p>
                    </div>
                    <span className="text-[10px] rounded-full bg-primary/20 text-primary px-2 py-1 font-medium">AI hint ✦</span>
                </div>
            )}

            {/* Top bar */}
            <div className="mb-4 flex items-center justify-end">
                <button onClick={() => setShowBreathing(true)} className="flex items-center gap-2 rounded-full bg-secondary/15 px-3 py-2 text-secondary transition-colors hover:bg-secondary/25">
                    <Wind className="h-4 w-4" />
                    <span className="text-xs font-medium">Feeling Panicked?</span>
                </button>
            </div>

            {/* Emotion chips */}
            <div className="mb-4">
                <p className="mb-3 text-sm text-muted-foreground">What emotions resonate with you?</p>
                <div className="flex flex-wrap gap-2">
                    {emotionChips.map((chip) => (
                        <Badge key={chip.label} variant="outline"
                            className={cn("cursor-pointer border px-3 py-1.5 text-sm transition-all",
                                selectedEmotions.includes(chip.label) ? categoryColors[chip.category] : "bg-muted/50 text-muted-foreground hover:bg-muted")}
                            onClick={() => toggleEmotion(chip.label)}>
                            {chip.label}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Hashtags */}
            <div className="mb-4">
                <div className="mb-3 flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Hash className="h-3.5 w-3.5" /> Add hashtags
                    </p>
                    <button onClick={() => setShowHashtagInput(!showHashtagInput)} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                        <Plus className="h-3.5 w-3.5" /> Custom
                    </button>
                </div>

                {showHashtagInput && (
                    <div className="mb-3 flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <Input value={newHashtag} onChange={(e) => setNewHashtag(e.target.value)} placeholder="Enter custom hashtag..."
                            className="h-9 text-sm"
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomHashtag(); } }} />
                        <Button size="sm" onClick={addCustomHashtag} disabled={!newHashtag.trim()} className="h-9 px-3">Add</Button>
                    </div>
                )}

                <div className="flex flex-wrap gap-2">
                    {allHashtags.map((tag) => {
                        const isCustom = customHashtags.includes(tag);
                        const isSelected = selectedHashtags.includes(tag);
                        return (
                            <Badge key={tag} variant="outline"
                                className={cn("cursor-pointer border px-2.5 py-1 text-xs transition-all",
                                    isSelected ? "bg-primary/15 text-primary border-primary/30" : "bg-muted/50 text-muted-foreground hover:bg-muted")}
                                onClick={() => toggleHashtag(tag)}>
                                #{tag}
                                {isCustom && (
                                    <button onClick={(e) => { e.stopPropagation(); removeCustomHashtag(tag); }} className="ml-1.5 hover:text-destructive">
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </Badge>
                        );
                    })}
                </div>
            </div>

            {/* Journal Textarea */}
            <Card className="flex-1 border-border/50">
                <CardContent className="flex h-full flex-col p-4">
                    <Textarea value={journalText} onChange={(e) => setJournalText(e.target.value)}
                        placeholder="Start writing your thoughts here... Let your words flow naturally."
                        className="min-h-[200px] flex-1 resize-none border-0 bg-transparent p-0 text-base leading-relaxed focus-visible:ring-0" />
                    <p className="mt-2 text-right text-xs text-muted-foreground">{journalText.length} characters</p>
                </CardContent>
            </Card>

            {/* Voice Visualizer */}
            {isRecording && (
                <div className="mb-2 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex h-14 items-center justify-center gap-[3px] rounded-lg border border-destructive/30 bg-destructive/5 px-4">
                        {[...Array(24)].map((_, i) => (
                            <span key={i} className="w-1 rounded-full bg-destructive/80"
                                style={{
                                    height: `${8 + ((i * 7 + 3) % 28)}px`,
                                    animation: `voice-wave 0.${4 + (i % 3)}s ease-in-out ${(i * 0.04).toFixed(2)}s infinite alternate`
                                }} />
                        ))}
                    </div>
                    <p className="mt-1 text-center text-xs text-muted-foreground">
                        🎙 Listening in <span className="font-semibold text-destructive">{micLang === 'hi-IN' ? 'Hindi' : micLang === 'en-IN' ? 'English (India)' : 'English (US)'}</span>…
                    </p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="mt-4 flex flex-col gap-2">
                {voiceError && (
                    <p className="text-xs text-red-400 text-center">{voiceError}</p>
                )}
                <div className="flex items-center gap-2">
                    {/* Mic button + lang badge */}
                    <div className="relative flex flex-col items-center gap-1">
                        <Button variant="outline" size="icon"
                            className={cn("h-12 w-12 rounded-full transition-all duration-200", isRecording && "border-destructive bg-destructive/10 text-destructive animate-pulse")}
                            onClick={handleMicToggle}
                            title={isRecording ? 'Tap to stop' : `Speak in ${micLang}`}>
                            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </Button>
                    </div>
                    {/* Language toggle — tap to cycle EN/HI/US */}
                    <button
                        onClick={cycleLang}
                        disabled={isRecording}
                        title="Tap to change mic language"
                        className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full border text-[11px] font-bold transition-all",
                            micLang === 'hi-IN'
                                ? 'border-orange-400/50 bg-orange-400/10 text-orange-400'
                                : 'border-primary/30 bg-primary/10 text-primary',
                            isRecording && 'opacity-40 cursor-not-allowed'
                        )}>
                        {langLabels[micLang]}
                    </button>
                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={() => setShowAIAssistant(true)}>
                        <Wand2 className="h-5 w-5" />
                    </Button>
                    <Button className="h-12 flex-1 rounded-full bg-primary text-base font-semibold gap-2"
                        disabled={journalText.length < 1 || isLoading}
                        onClick={handleSave}>
                        <Save className="h-5 w-5" />
                        {isLoading ? 'Analyzing…' : 'Save Thoughts'}
                    </Button>
                </div>
            </div>

            {showBreathing && <BreathingExercise onDone={() => setShowBreathing(false)} />}
            <AIChatAssistant isOpen={showAIAssistant} onClose={() => setShowAIAssistant(false)} journalText={journalText} context="journal" />
        </div>
    );
}
