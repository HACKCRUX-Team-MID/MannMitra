/**
 * Behavioral Data Store
 * Manages daily behavioral records (sleep, steps, screen time) in localStorage.
 * Provides CRUD operations and data retrieval for mood prediction graphs.
 */

/* ── Types ── */
export interface DailyBehavioralRecord {
  date: string;           // YYYY-MM-DD
  sleep_hours: number;    // 0-14
  steps: number;          // 0-50000
  screen_time: number;    // hours, 0-24
  source: 'manual' | 'google_fit' | 'mixed';
  checkin_mood?: number;  // 1-10 from micro check-in
  checkin_emoji?: string; // emoji selection
  timestamp: string;      // ISO datetime of when record was created/updated
}

export interface BehavioralSummary {
  avgSleep: number;
  avgSteps: number;
  avgScreenTime: number;
  totalRecords: number;
  latestRecord: DailyBehavioralRecord | null;
}

/* ── Storage key helpers ── */
const getStorageKey = (userId: string) => `mannmitra_behavioral_${userId}`;
const getCheckinKey = (userId: string) => `mannmitra_last_checkin_${userId}`;
const getConsentKey = (userId: string) => `mannmitra_consent_${userId}`;

/* ── Core API ── */
export const behavioralDataStore = {

  /** Get all records for a user, sorted by date descending */
  getAllRecords: (userId: string): DailyBehavioralRecord[] => {
    try {
      const raw = localStorage.getItem(getStorageKey(userId));
      if (!raw) return [];
      const records: DailyBehavioralRecord[] = JSON.parse(raw);
      return records.sort((a, b) => b.date.localeCompare(a.date));
    } catch {
      return [];
    }
  },

  /** Get records for a specific date range */
  getRecordsForRange: (userId: string, startDate: string, endDate: string): DailyBehavioralRecord[] => {
    const all = behavioralDataStore.getAllRecords(userId);
    return all.filter(r => r.date >= startDate && r.date <= endDate);
  },

  /** Get record for a specific date */
  getRecordForDate: (userId: string, date: string): DailyBehavioralRecord | null => {
    const all = behavioralDataStore.getAllRecords(userId);
    return all.find(r => r.date === date) || null;
  },

  /** Get today's record */
  getTodayRecord: (userId: string): DailyBehavioralRecord | null => {
    const today = new Date().toISOString().split('T')[0];
    return behavioralDataStore.getRecordForDate(userId, today);
  },

  /** Save or update a daily record */
  saveRecord: (userId: string, record: Omit<DailyBehavioralRecord, 'timestamp'>): DailyBehavioralRecord => {
    const all = behavioralDataStore.getAllRecords(userId);
    const existingIndex = all.findIndex(r => r.date === record.date);
    
    const fullRecord: DailyBehavioralRecord = {
      ...record,
      timestamp: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      // Merge: keep existing data, override with new non-zero values
      const existing = all[existingIndex];
      all[existingIndex] = {
        ...existing,
        ...fullRecord,
        // Keep source as 'mixed' if combining manual + google_fit
        source: existing.source !== record.source && existing.source !== 'mixed' 
          ? 'mixed' 
          : record.source,
      };
    } else {
      all.push(fullRecord);
    }

    localStorage.setItem(getStorageKey(userId), JSON.stringify(all));
    return fullRecord;
  },

  /** Delete a record for a specific date */
  deleteRecord: (userId: string, date: string): void => {
    const all = behavioralDataStore.getAllRecords(userId);
    const filtered = all.filter(r => r.date !== date);
    localStorage.setItem(getStorageKey(userId), JSON.stringify(filtered));
  },

  /** Get summary statistics for the last N days */
  getSummary: (userId: string, days: number = 7): BehavioralSummary => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
    const records = behavioralDataStore.getRecordsForRange(userId, startDate, endDate);

    if (records.length === 0) {
      return { avgSleep: 0, avgSteps: 0, avgScreenTime: 0, totalRecords: 0, latestRecord: null };
    }

    return {
      avgSleep: Math.round((records.reduce((s, r) => s + r.sleep_hours, 0) / records.length) * 10) / 10,
      avgSteps: Math.round(records.reduce((s, r) => s + r.steps, 0) / records.length),
      avgScreenTime: Math.round((records.reduce((s, r) => s + r.screen_time, 0) / records.length) * 10) / 10,
      totalRecords: records.length,
      latestRecord: records[0],
    };
  },

  /** Delete all behavioral data for a user */
  clearAllData: (userId: string): void => {
    localStorage.removeItem(getStorageKey(userId));
    localStorage.removeItem(getCheckinKey(userId));
  },

  /* ── Check-in tracking ── */

  /** Check if user has already done today's check-in */
  hasCheckedInToday: (userId: string): boolean => {
    const lastCheckin = localStorage.getItem(getCheckinKey(userId));
    if (!lastCheckin) return false;
    const today = new Date().toISOString().split('T')[0];
    return lastCheckin === today;
  },

  /** Mark today's check-in as done */
  markCheckinDone: (userId: string): void => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(getCheckinKey(userId), today);
  },

  /* ── Consent management ── */

  /** Check if user has given consent for behavioral tracking */
  hasConsent: (userId: string): boolean => {
    return localStorage.getItem(getConsentKey(userId)) === 'true';
  },

  /** Set consent status */
  setConsent: (userId: string, consent: boolean): void => {
    localStorage.setItem(getConsentKey(userId), String(consent));
  },

  /** Get last N days as date strings for chart X-axis */
  getDateRange: (days: number): string[] => {
    const dates: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  },
};
