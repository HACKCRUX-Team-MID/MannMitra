import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { behavioralDataStore } from '../utils/behavioralDataStore';

interface MicroCheckinProps {
  userId: string;
  onClose: () => void;
  onComplete: () => void;
}

const MOOD_EMOJIS = [
  { emoji: '😄', label: 'Great', value: 9 },
  { emoji: '🙂', label: 'Good', value: 7 },
  { emoji: '😐', label: 'Neutral', value: 5 },
  { emoji: '😔', label: 'Low', value: 3 },
  { emoji: '😡', label: 'Upset', value: 2 },
  { emoji: '😴', label: 'Tired', value: 3 },
];

export const MicroCheckin: React.FC<MicroCheckinProps> = ({ userId, onClose, onComplete }) => {
  const [selectedEmoji, setSelectedEmoji] = useState<number | null>(null);
  const [moodValue, setMoodValue] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Save only mood — sleep/steps/screen are auto-detected by deviceSignalCollector
      const existing = behavioralDataStore.getRecordForDate(userId, today);
      behavioralDataStore.saveRecord(userId, {
        date: today,
        sleep_hours: existing?.sleep_hours || 7,
        steps: existing?.steps || 0,
        screen_time: existing?.screen_time || 0,
        source: existing?.source || 'manual',
        checkin_mood: selectedEmoji !== null ? MOOD_EMOJIS[selectedEmoji].value : moodValue,
        checkin_emoji: selectedEmoji !== null ? MOOD_EMOJIS[selectedEmoji].emoji : undefined,
      });
      behavioralDataStore.markCheckinDone(userId);
      setDone(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      console.error('Check-in save error:', error);
    }
    setIsSubmitting(false);
  };

  return (
    <motion.div
      className="checkin-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="checkin-modal"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="checkin-modal-header">
          <div>
            <h3 style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
              Daily Check-in
            </h3>
            {!done && (
              <p style={{ fontSize: '0.78rem', color: 'rgba(0,0,0,0.4)', marginTop: '0.2rem' }}>
                Quick mood check · Takes 10 seconds
              </p>
            )}
          </div>
          <button onClick={onClose} className="checkin-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="checkin-content">
          <AnimatePresence mode="wait">
            {!done ? (
              <motion.div key="mood" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <div className="checkin-step-header">
                  <Sparkles size={18} style={{ color: '#A855F7' }} />
                  <span>How are you feeling today?</span>
                </div>
                <div className="checkin-emoji-grid">
                  {MOOD_EMOJIS.map((item, i) => (
                    <button
                      key={i}
                      className={`checkin-emoji-btn ${selectedEmoji === i ? 'selected' : ''}`}
                      onClick={() => { setSelectedEmoji(i); setMoodValue(item.value); }}
                    >
                      <span className="checkin-emoji">{item.emoji}</span>
                      <span className="checkin-emoji-label">{item.label}</span>
                    </button>
                  ))}
                </div>
                <div className="checkin-slider-section" style={{ marginTop: '1rem' }}>
                  <label style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.5)', fontWeight: 600 }}>
                    Or rate your mood: <strong style={{ color: '#A855F7' }}>{moodValue}/10</strong>
                  </label>
                  <input
                    type="range" min="1" max="10" step="1"
                    value={moodValue}
                    onChange={e => { setMoodValue(parseInt(e.target.value)); setSelectedEmoji(null); }}
                    className="checkin-range"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
                <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.5rem' }}>Check-in Complete!</h3>
                <p style={{ color: 'rgba(0,0,0,0.5)', fontSize: '0.9rem' }}>Your mood prediction will be updated.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        {!done && (
          <div className="checkin-actions">
            <div style={{ flex: 1 }} />
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Submit ✨'}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default MicroCheckin;
