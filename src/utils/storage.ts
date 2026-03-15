import { supabase } from './supabase';

export interface JournalEntry {
    id: string;
    emotion: string; // e.g. 'joy', 'stress'
    emoji: string;
    intensity: number; // 1-10
    text: string;
    tags: string[];
    timestamp: string; // ISO string 
    wordCount: number;
    user_id?: string; // from supabase
    detectedEmotion?: string; // NLP-detected emotion
    confidence?: number; // NLP confidence 0-1
    sleepHours?: number; // behavioral tracking
    exerciseMinutes?: number; // behavioral tracking
}

export const storage = {
    /** Get all saved journal entries */
    getEntries: async (userId?: string): Promise<JournalEntry[]> => {
        if (!userId) return []; // Require auth for supabase
        try {
            const { data, error } = await supabase
                .from('journal_entries')
                .select('*')
                .eq('user_id', userId)
                .order('timestamp', { ascending: false });

            if (error) throw error;

            // Map DB snake_case to app camelCase
            return (data || []).map(row => ({
                id: row.id,
                emotion: row.emotion,
                emoji: row.emoji,
                intensity: row.intensity,
                text: row.text,
                tags: row.tags || [],
                timestamp: row.timestamp,
                wordCount: row.word_count,
                detectedEmotion: row.detected_emotion || undefined,
                confidence: row.confidence || undefined,
                sleepHours: row.sleep_hours || undefined,
                exerciseMinutes: row.exercise_minutes || undefined,
            }));
        } catch (error) {
            console.error("Failed to fetch journal entries from Supabase", error);
            return [];
        }
    },

    /** Save a new entry */
    saveEntry: async (userId: string | undefined, entry: Omit<JournalEntry, 'timestamp' | 'id'> & { timestamp?: string | Date }) => {
        if (!userId) throw new Error("Must be logged in to save.");
        
        const timestamp = entry.timestamp 
            ? (entry.timestamp instanceof Date ? entry.timestamp.toISOString() : entry.timestamp)
            : new Date().toISOString();

        const { data, error } = await supabase
            .from('journal_entries')
            .insert({
                user_id: userId,
                emotion: entry.emotion,
                emoji: entry.emoji,
                intensity: entry.intensity,
                text: entry.text,
                tags: entry.tags,
                word_count: entry.wordCount,
                timestamp: timestamp,
                detected_emotion: (entry as any).detectedEmotion || null,
                confidence: (entry as any).confidence || null,
                sleep_hours: (entry as any).sleepHours || null,
                exercise_minutes: (entry as any).exerciseMinutes || null
            })
            .select()
            .single();

        if (error) {
            console.error("Error saving entry:", error);
            throw error;
        }
        
        return {
            id: data.id,
            emotion: data.emotion,
            emoji: data.emoji,
            intensity: data.intensity,
            text: data.text,
            tags: data.tags,
            timestamp: data.timestamp,
            wordCount: data.word_count,
            detectedEmotion: data.detected_emotion || undefined,
            confidence: data.confidence || undefined,
            sleepHours: data.sleep_hours || undefined,
            exerciseMinutes: data.exercise_minutes || undefined,
        } as JournalEntry;
    },

    /** Delete an entry completely */
    deleteEntry: async (userId: string | undefined, id: string) => {
        if (!userId) return;
        const { error } = await supabase
            .from('journal_entries')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
            
        if (error) console.error("Error deleting entry:", error);
    },

    /** Process raw entries into dashboard-ready stats. Now async because entries are async. */
    getAnalytics: async (userId?: string) => {
        const entries = await storage.getEntries(userId);

        if (entries.length === 0) {
            return {
                avgScore: "0.0",
                streak: 0,
                distribution: [],
                recentTrend: [],
                count: 0,
                heatmapData: Array.from({ length: 35 }, (_, i) => ({
                    day: i,
                    intensity: null,
                    date: new Date(Date.now() - (34 - i) * 86400000),
                })),
                sleepMoodData: [],
                insights: [],
                goals: [],
            };
        }

        const totalIntensity = entries.reduce((sum, e) => sum + e.intensity, 0);
        const avgScore = (totalIntensity / entries.length).toFixed(1);

        // Emotion distribution for 30 days
        const distributionMap: Record<string, { name: string, value: number, color: string }> = {};
        const colorMap: Record<string, string> = {
            'joy': '#F59E0B', 'calm': '#14B8A6', 'stress': '#EF4444',
            'sadness': '#6366F1', 'neutral': '#6B7280', 'excited': '#F97316',
            'anxious': '#EC4899', 'grateful': '#10B981'
        };

        entries.forEach(e => {
            if (!distributionMap[e.emotion]) {
                distributionMap[e.emotion] = {
                    name: e.emotion.charAt(0).toUpperCase() + e.emotion.slice(1),
                    value: 0,
                    color: colorMap[e.emotion] || '#A855F7'
                };
            }
            distributionMap[e.emotion].value += 1;
        });

        // Convert distribution to percentages
        const distribution = Object.values(distributionMap).map(item => ({
            ...item,
            value: Math.round((item.value / entries.length) * 100)
        })).sort((a, b) => b.value - a.value);

        // Calculate 7-day trend
        const recentTrend = [];
        const today = new Date();
        today.setHours(0,0,0,0);
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dayEntries = entries.filter(e => {
                const ed = new Date(e.timestamp);
                ed.setHours(0,0,0,0);
                return ed.getTime() === d.getTime();
            });
            const dayScore = dayEntries.length > 0 
                ? (dayEntries.reduce((s, e) => s + e.intensity, 0) / dayEntries.length)
                : 0;
            const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            recentTrend.push({
                day: daysOfWeek[d.getDay()],
                score: parseFloat(dayScore.toFixed(1)),
                target: 7.5
            });
        }

        // Calculate 35-day heatmap
        const heatmapData = [];
        for (let i = 34; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dayEntries = entries.filter(e => {
                const ed = new Date(e.timestamp);
                ed.setHours(0,0,0,0);
                return ed.getTime() === d.getTime();
            });
            const intensity = dayEntries.length > 0 
                ? (dayEntries.reduce((s, e) => s + e.intensity, 0) / dayEntries.length) / 10
                : null;
            heatmapData.push({
                day: 34 - i,
                intensity,
                date: new Date(d.getTime() + 86400000/2) // mid-day to avoid TZ issues
            });
        }

        // Sleep vs Mood Data (extracted from tags if available)
        const sleepMoodMap: Record<string, { moodSum: number, count: number }> = {};
        entries.forEach(e => {
            const sleepTag = e.tags.find(t => t.startsWith('#sleep-') || t === '#sleep');
            if (sleepTag) {
                // assume formats like #sleep-6h, default to 7h if just #sleep
                let hours = '7h';
                const match = sleepTag.match(/\d+h?/);
                if (match) hours = match[0].endsWith('h') ? match[0] : match[0] + 'h';
                
                if (!sleepMoodMap[hours]) sleepMoodMap[hours] = { moodSum: 0, count: 0 };
                sleepMoodMap[hours].moodSum += e.intensity;
                sleepMoodMap[hours].count += 1;
            }
        });
        const sleepMoodData = Object.entries(sleepMoodMap).map(([sleep, data]) => ({
            sleep,
            mood: parseFloat((data.moodSum / data.count).toFixed(1))
        })).sort((a, b) => parseInt(a.sleep) - parseInt(b.sleep));

        // Generate dynamic insights
        const insights = [];
        const recentEntries = entries.filter(e => (new Date().getTime() - new Date(e.timestamp).getTime()) < 7 * 86400000);
        
        const stressEntries = recentEntries.filter(e => e.emotion === 'stress' || e.emotion === 'anxious');
        if (stressEntries.length >= 2) {
            insights.push({
                type: 'warning',
                title: 'Elevated Stress Detected',
                body: 'We noticed a few stressful entries recently. Consider listening to some calming music, doing a short breathing exercise, or taking a quick walk.'
            });
        }

        const joyEntries = recentEntries.filter(e => e.emotion === 'joy' || e.emotion === 'excited');
        if (joyEntries.length >= 3) {
            insights.push({
                type: 'positive',
                title: 'High Positive Energy',
                body: 'You have been feeling great lately! Whatever you are doing is working well for your well-being.'
            });
        }

        const lowSleepEntries = recentEntries.filter(e => e.tags.some(t => t === '#sleep-4h' || t === '#sleep-5h'));
        if (lowSleepEntries.length >= 1) {
            insights.push({
                type: 'neutral',
                title: 'Sleep Pattern Alert',
                body: 'You logged low sleep hours recently. Prioritizing 7-8 hours of sleep can significantly improve emotional resilience.'
            });
        }

        if (insights.length === 0) {
            insights.push({
                type: 'neutral',
                title: 'Consistent Tracking',
                body: 'Keep logging your emotions daily to start uncovering personal patterns and personalized suggestions.'
            });
        }

        const daysWithEntries = new Set(recentEntries.map(e => new Date(e.timestamp).toDateString())).size;
        const daysWithGoodMood = new Set(recentEntries.filter(e => e.intensity >= 7).map(e => new Date(e.timestamp).toDateString())).size;
        const calmJoyDays = new Set(recentEntries.filter(e => e.emotion === 'joy' || e.emotion === 'calm').map(e => new Date(e.timestamp).toDateString())).size;
        const highStressDays = new Set(stressEntries.map(e => new Date(e.timestamp).toDateString())).size;

        const goals = [
            { label: 'Weekly Journal Entries', done: daysWithEntries, total: 7, color: '#A855F7' },
            { label: 'High Mood Score Days', done: daysWithGoodMood, total: 4, color: '#22D3EE' },
            { label: 'Positive Emotion Days', done: calmJoyDays, total: 4, color: '#10B981' },
            { label: 'Low Stress Week', done: Math.max(0, 7 - highStressDays), total: 7, color: '#EAB308' },
        ];

        return {
            avgScore,
            streak: calculateStreak(entries),
            distribution,
            recentTrend,
            heatmapData,
            sleepMoodData,
            insights,
            goals,
            count: entries.length,
        };
    }
};

/** Calculate consecutive daily streak */
function calculateStreak(entries: JournalEntry[]) {
    if (entries.length === 0) return 0;

    const sorted = [...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    let streak = 1;
    let currentDate = new Date(sorted[0].timestamp);
    currentDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(today.getTime() - currentDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 1) return 0;

    for (let i = 1; i < sorted.length; i++) {
        const d = new Date(sorted[i].timestamp);
        d.setHours(0, 0, 0, 0);
        const daysBetween = Math.floor((currentDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

        if (daysBetween === 1) {
            streak++;
            currentDate = d;
        } else if (daysBetween > 1) {
            break; 
        }
    }

    return streak;
}
