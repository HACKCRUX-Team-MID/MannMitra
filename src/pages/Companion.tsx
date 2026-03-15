import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Bot, User, Brain } from 'lucide-react';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { storage } from '../utils/storage';
import { detectEmotion, preloadModel } from '../utils/emotionEngine';
import { generateCompanionResponse, getGreeting, generateJournalEntry, type CompanionMessage } from '../utils/companionEngine';
import { useNavigate } from 'react-router-dom';

const Companion: React.FC = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<CompanionMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [modelReady, setModelReady] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const navigate = useNavigate();
    const [lastEmotion, setLastEmotion] = useState('neutral');

    // Preload NLP model
    useEffect(() => {
        preloadModel().then(() => setModelReady(true)).catch(console.error);
    }, []);

    // Load entries and set greeting
    useEffect(() => {
        if (user?.id) {
            storage.getEntries(user.id).then((e) => {
                const greeting = getGreeting(e);
                setMessages([{
                    id: 'greeting',
                    role: 'companion',
                    text: greeting,
                    timestamp: new Date(),
                }]);
            }).catch(console.error);
        }
    }, [user?.id]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (text?: string) => {
        const messageText = text || input.trim();
        if (!messageText) return;

        // Add user message
        const userMsg: CompanionMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            text: messageText,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Detect emotion from user message
        let detectedEmotion = 'neutral';
        try {
            const result = await detectEmotion(messageText);
            detectedEmotion = result.emotion;
            setLastEmotion(detectedEmotion);
        } catch {
            // fallback to neutral
        }

        // Simulate typing delay
        const delay = 800 + Math.random() * 1200;
        setTimeout(async () => {
            const result = await generateCompanionResponse(
                messageText,
                user?.name?.split(' ')[0] || 'there'
            );

            const companionMsg: CompanionMessage = {
                id: `companion-${Date.now()}`,
                role: 'companion',
                text: result.message,
                emotion: detectedEmotion,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, companionMsg]);
            setIsTyping(false);
        }, delay);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Voice input
    const toggleRecording = () => {
        // @ts-ignore
        const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionApi) {
            alert('Speech recognition not supported in this browser.');
            return;
        }

        if (isRecording && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
            return;
        }

        try {
            const recognition = new SpeechRecognitionApi();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            recognitionRef.current = recognition;

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(prev => prev + transcript);
            };
            recognition.onerror = () => setIsRecording(false);
            recognition.onend = () => setIsRecording(false);

            recognition.start();
            setIsRecording(true);
        } catch {
            setIsRecording(false);
        }
    };

    // Quick replies derived from context
    const quickReplies = messages.length <= 1
        ? ['I feel stressed lately', 'I need someone to talk to', 'How can I feel better?', 'I feel great today!']
        : ['Tell me more', 'What should I do?', 'I want to reflect', 'Thank you'];

    const handleGenerateJournal = () => {
        const userMsgs = messages.filter(m => m.role === 'user').map(m => m.text);
        const journalText = generateJournalEntry(lastEmotion, userMsgs);
        // Navigate to journal page with pre-filled text
        navigate('/journal', { state: { prefillText: journalText, prefillEmotion: lastEmotion } });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}
        >
            {/* Header */}
            <header style={{ marginBottom: '1rem', flexShrink: 0 }}>
                <p style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>
                    AI Reflection Companion
                </p>
                <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="text-gradient">MannMitra</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, background: 'rgba(168,85,247,0.1)', color: '#A855F7', padding: '0.2rem 0.6rem', borderRadius: '8px', border: '1px solid rgba(168,85,247,0.2)' }}>
                        Reflection Only • Not Therapy
                    </span>
                </h1>
                <p style={{ color: 'rgba(0,0,0,0.4)', fontSize: '0.85rem' }}>
                    A safe space to explore your thoughts. All processing happens on your device.
                    {modelReady && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Brain size={11} /> NLP Active
                        </span>
                    )}
                </p>
            </header>

            {/* 💬 Chat Messages */}
            <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', minHeight: 0 }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <AnimatePresence>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                style={{
                                    display: 'flex',
                                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    gap: '0.75rem',
                                    alignItems: 'flex-end',
                                }}
                            >
                                {msg.role === 'companion' && (
                                    <div style={{
                                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                        background: 'linear-gradient(135deg, #A855F7, #22D3EE)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Bot size={16} color="white" />
                                    </div>
                                )}
                                <div style={{
                                    maxWidth: '75%', padding: '0.85rem 1.1rem',
                                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                    background: msg.role === 'user'
                                        ? 'linear-gradient(135deg, #A855F7, #8B5CF6)'
                                        : 'rgba(0,0,0,0.04)',
                                    color: msg.role === 'user' ? 'white' : 'rgba(0,0,0,0.75)',
                                    fontSize: '0.9rem', lineHeight: 1.65, fontWeight: 450,
                                    boxShadow: msg.role === 'user' ? '0 2px 12px rgba(168,85,247,0.25)' : 'none',
                                }}>
                                    {msg.text}
                                    {msg.emotion && msg.role === 'companion' && (
                                        <span style={{
                                            display: 'block', fontSize: '0.68rem', color: 'rgba(0,0,0,0.3)',
                                            marginTop: '0.4rem', fontStyle: 'italic',
                                        }}>
                                            Detected: {msg.emotion}
                                        </span>
                                    )}
                                </div>
                                {msg.role === 'user' && (
                                    <div style={{
                                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                        background: 'rgba(0,0,0,0.08)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <User size={16} color="rgba(0,0,0,0.5)" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Typing indicator */}
                    <AnimatePresence>
                        {isTyping && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}
                            >
                                <div style={{
                                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                    background: 'linear-gradient(135deg, #A855F7, #22D3EE)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Bot size={16} color="white" />
                                </div>
                                <div style={{
                                    padding: '0.85rem 1.1rem', borderRadius: '16px 16px 16px 4px',
                                    background: 'rgba(0,0,0,0.04)', display: 'flex', gap: '0.3rem',
                                }}>
                                    {[0, 1, 2].map(i => (
                                        <motion.div
                                            key={i}
                                            animate={{ y: [0, -5, 0] }}
                                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                            style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(168,85,247,0.4)' }}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Replies */}
                <div style={{ padding: '0.5rem 1.25rem', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: '0.5rem', overflowX: 'auto', flexShrink: 0 }}>
                    {quickReplies.map((reply) => (
                        <button
                            key={reply}
                            onClick={() => handleSend(reply)}
                            disabled={isTyping}
                            style={{
                                background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.15)',
                                borderRadius: '99px', padding: '0.4rem 0.85rem', cursor: isTyping ? 'not-allowed' : 'pointer',
                                fontSize: '0.78rem', fontWeight: 600, color: '#A855F7', whiteSpace: 'nowrap',
                                transition: 'all 0.2s', opacity: isTyping ? 0.5 : 1,
                            }}
                        >
                            {reply}
                        </button>
                    ))}
                </div>

                {/* Generate Journal Entry button */}
                {messages.filter(m => m.role === 'user').length >= 2 && (
                    <div style={{ padding: '0.5rem 1.25rem', borderTop: '1px solid rgba(0,0,0,0.05)', flexShrink: 0 }}>
                        <button
                            onClick={handleGenerateJournal}
                            style={{
                                width: '100%', padding: '0.6rem', borderRadius: '10px',
                                background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(34,211,238,0.08))',
                                border: '1px solid rgba(168,85,247,0.2)', cursor: 'pointer',
                                color: '#A855F7', fontWeight: 700, fontSize: '0.82rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                transition: 'all 0.2s',
                            }}
                        >
                            ✍️ Generate Journal Entry from this conversation
                        </button>
                    </div>
                )}

                {/* Input Area */}
                <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexShrink: 0 }}>
                    <button
                        onClick={toggleRecording}
                        style={{
                            background: isRecording ? 'rgba(239,68,68,0.15)' : 'rgba(0,0,0,0.05)',
                            border: `1px solid ${isRecording ? 'rgba(239,68,68,0.3)' : 'rgba(0,0,0,0.08)'}`,
                            borderRadius: '10px', padding: '0.6rem', cursor: 'pointer',
                            color: isRecording ? '#EF4444' : 'rgba(0,0,0,0.4)', transition: 'all 0.2s',
                            flexShrink: 0,
                        }}
                    >
                        {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Share what's on your mind..."
                        rows={1}
                        style={{
                            flex: 1, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)',
                            borderRadius: '12px', padding: '0.65rem 1rem', fontSize: '0.9rem',
                            color: '#1E293B', fontFamily: 'inherit', outline: 'none',
                            resize: 'none', minHeight: '40px', maxHeight: '100px',
                            lineHeight: 1.5,
                        }}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isTyping}
                        style={{
                            background: input.trim() && !isTyping ? 'linear-gradient(135deg, #A855F7, #8B5CF6)' : 'rgba(0,0,0,0.08)',
                            border: 'none', borderRadius: '10px', padding: '0.6rem',
                            cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
                            color: input.trim() && !isTyping ? 'white' : 'rgba(0,0,0,0.3)',
                            transition: 'all 0.2s', flexShrink: 0,
                            boxShadow: input.trim() && !isTyping ? '0 2px 12px rgba(168,85,247,0.3)' : 'none',
                        }}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </Card>

            {/* Disclaimer */}
            <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(0,0,0,0.25)', marginTop: '0.75rem', fontStyle: 'italic' }}>
                🔒 All conversations are processed on your device. This is a reflection tool, not a substitute for professional help.
            </p>
        </motion.div>
    );
};

export default Companion;
