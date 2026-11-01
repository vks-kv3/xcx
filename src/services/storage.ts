import { Question, ShuffledQuestion, ContestConfig, ExamSession, CandidateInfo } from '../types/quiz';
import { DEFAULT_QUESTIONS, DEFAULT_CONTEST_CONFIG } from '../data/defaultQuestions';

// All current and historical keys to guarantee zero data loss
const PRIMARY_KEYS = {
  QUESTIONS: 'vksnd_kv3_questions_v2',
  CONFIG: 'vksnd_kv3_config_v2',
  SUBMISSIONS: 'vksnd_kv3_submissions_v2',
  ACTIVE_SESSION: 'vksnd_kv3_active_session_v2',
};

const LEGACY_KEYS = [
  'vksnd_kv3_results_v1',
  'vksnd_kv3_results',
  'vksnd_kv3_submissions_v1',
  'vksnd_kv3_submissions',
  'vksnd_kv3_active_session_v1',
];

/**
 * Universal scan and recovery helper to extract ANY historical submissions
 * stored in browser localStorage under previous version keys
 */
export function recoverAllLocalSubmissions(): ExamSession[] {
  const map = new Map<string, ExamSession>();

  // 1. Check primary key
  try {
    const primary = localStorage.getItem(PRIMARY_KEYS.SUBMISSIONS);
    if (primary) {
      const parsed = JSON.parse(primary);
      if (Array.isArray(parsed)) {
        parsed.forEach((s) => {
          if (s && s.candidate && s.candidate.fullName) {
            map.set(s.id || s.certificateCode || `${s.candidate.fullName}_${s.submittedAt}`, s);
          }
        });
      }
    }
  } catch (err) {
    console.warn('Error reading primary submissions:', err);
  }

  // 2. Check all known legacy keys
  for (const key of LEGACY_KEYS) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          parsed.forEach((s) => {
            if (s && s.candidate && s.candidate.fullName) {
              const uniqueKey = s.id || s.certificateCode || `${s.candidate.fullName}_${s.submittedAt}`;
              if (!map.has(uniqueKey)) {
                map.set(uniqueKey, s);
              }
            }
          });
        }
      }
    } catch {
      // ignore parsing error for non-matching keys
    }
  }

  // 3. Dynamic scan across ALL keys in localStorage for any candidate submission objects
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Skip config and questions keys
      if (key.includes('question') || key.includes('config')) continue;

      try {
        const val = localStorage.getItem(key);
        if (!val || !val.includes('candidate')) continue;

        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) {
          parsed.forEach((s) => {
            if (s && s.candidate && typeof s.candidate.fullName === 'string') {
              const uniqueKey = s.id || s.certificateCode || `${s.candidate.fullName}_${s.submittedAt}`;
              if (!map.has(uniqueKey)) {
                map.set(uniqueKey, s);
              }
            }
          });
        }
      } catch {
        // ignore non-json
      }
    }
  } catch (err) {
    console.warn('Dynamic localStorage scan error:', err);
  }

  const merged = Array.from(map.values());

  // Save back to primary key so it's unified and consolidated
  if (merged.length > 0) {
    try {
      localStorage.setItem(PRIMARY_KEYS.SUBMISSIONS, JSON.stringify(merged));
    } catch {
      // ignore
    }
  }

  return merged;
}

export const StorageService = {
  getQuestions(): Question[] {
    try {
      const data = localStorage.getItem(PRIMARY_KEYS.QUESTIONS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    this.saveQuestions(DEFAULT_QUESTIONS);
    return DEFAULT_QUESTIONS;
  },

  saveQuestions(questions: Question[]): void {
    localStorage.setItem(PRIMARY_KEYS.QUESTIONS, JSON.stringify(questions));
  },

  resetQuestions(): Question[] {
    localStorage.setItem(PRIMARY_KEYS.QUESTIONS, JSON.stringify(DEFAULT_QUESTIONS));
    return DEFAULT_QUESTIONS;
  },

  getConfig(): ContestConfig {
    try {
      const data = localStorage.getItem(PRIMARY_KEYS.CONFIG);
      if (data) {
        return { ...DEFAULT_CONTEST_CONFIG, ...JSON.parse(data) };
      }
    } catch {
      // ignore
    }
    this.saveConfig(DEFAULT_CONTEST_CONFIG);
    return DEFAULT_CONTEST_CONFIG;
  },

  saveConfig(config: ContestConfig): void {
    localStorage.setItem(PRIMARY_KEYS.CONFIG, JSON.stringify(config));
  },

  getSubmissions(): ExamSession[] {
    // Automatically perform multi-key recovery on every load!
    return recoverAllLocalSubmissions();
  },

  saveSubmission(session: ExamSession): ExamSession[] {
    const list = this.getSubmissions();
    const updated = [session, ...list.filter((s) => s.id !== session.id && s.certificateCode !== session.certificateCode)];
    localStorage.setItem(PRIMARY_KEYS.SUBMISSIONS, JSON.stringify(updated));

    // Also sync to server memory in background
    fetch('/api/submit-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session }),
    }).catch(() => {});

    return updated;
  },

  saveAllSubmissions(list: ExamSession[]): void {
    localStorage.setItem(PRIMARY_KEYS.SUBMISSIONS, JSON.stringify(list));
    // Sync full list to server
    fetch('/api/submissions/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissions: list }),
    }).catch(() => {});
  },

  deleteSubmission(id: string): ExamSession[] {
    const list = this.getSubmissions();
    const updated = list.filter((s) => s.id !== id && s.certificateCode !== id);
    this.saveAllSubmissions(updated);
    return updated;
  },

  clearSubmissions(): void {
    localStorage.setItem(PRIMARY_KEYS.SUBMISSIONS, JSON.stringify([]));
    for (const key of LEGACY_KEYS) {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
    fetch('/api/submissions', { method: 'DELETE' }).catch(() => {});
  },

  getActiveSession(): ExamSession | null {
    try {
      const data = localStorage.getItem(PRIMARY_KEYS.ACTIVE_SESSION);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    return null;
  },

  saveActiveSession(session: ExamSession | null): void {
    if (!session) {
      localStorage.removeItem(PRIMARY_KEYS.ACTIVE_SESSION);
    } else {
      localStorage.setItem(PRIMARY_KEYS.ACTIVE_SESSION, JSON.stringify(session));
    }
  },
};

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate randomized exam session for candidate
 */
export function generateExamSession(
  candidate: CandidateInfo,
  config: ContestConfig,
  questionsPool: Question[]
): ExamSession {
  let pool = [...questionsPool];

  // Shuffle question list
  if (config.shuffleQuestions) {
    pool = shuffleArray(pool);
  }

  // Take requested count (default 50)
  const count = Math.min(config.questionsCount, pool.length);
  const selectedPool = pool.slice(0, count);

  const examQuestions: ShuffledQuestion[] = selectedPool.map((q, idx) => {
    let options = [...q.options];

    // Track which text was correct before shuffling
    const correctOption = q.options.find((o) => o.id === q.correctOptionId);
    const correctText = correctOption ? correctOption.text : '';

    if (config.shuffleOptions) {
      options = shuffleArray(options);
    }

    const alphabet = ['A', 'B', 'C', 'D', 'E', 'F'];
    let newCorrectId = 'A';

    const normalizedOptions = options.map((opt, optIdx) => {
      const newId = alphabet[optIdx] || opt.id;
      if (opt.text === correctText) {
        newCorrectId = newId;
      }
      return {
        id: newId,
        text: opt.text,
      };
    });

    return {
      originalId: q.id,
      displayIndex: idx + 1,
      question: q.question,
      options: normalizedOptions,
      correctOptionId: newCorrectId,
      category: q.category,
    };
  });

  const now = Date.now();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const certCode = `VKS3-QT-${new Date().getFullYear()}-${randomSuffix}`;

  return {
    id: `exam-${now}-${Math.random().toString(36).substring(2, 7)}`,
    certificateCode: certCode,
    candidate,
    startTime: now,
    timeSpentSeconds: 0,
    questions: examQuestions,
    answers: {},
    flagged: [],
    score: 0,
    correctCount: 0,
    totalQuestions: examQuestions.length,
    submittedAt: '',
    phoneRecipient: config.organizerPhone || '09837645',
  };
}
