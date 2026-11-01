import { ExamSession, ContestConfig } from '../types/quiz';
import { formatDuration } from '../utils/pdfGenerator';

/**
 * Format SMS message content to be sent to organizer's phone number
 */
export function getSmsContentText(session: ExamSession, config: ContestConfig): string {
  const phone = config.organizerPhone || '09837645';
  return `[BÀI THI VKSND KV3 QUẢNG TRỊ]
Thí sinh: ${session.candidate.fullName.toUpperCase()}
Chức vụ: ${session.candidate.position}
Điểm số: ${session.score.toFixed(1)}/10 (${session.correctCount}/${session.totalQuestions} câu đúng)
Thời gian làm: ${formatDuration(session.timeSpentSeconds)}
Mã số bài thi: ${session.certificateCode}
Thời điểm nộp: ${session.submittedAt}
Gửi tới SĐT BTC: ${phone}`;
}

/**
 * Generates an SMS URI scheme link: sms:09837645?body=...
 */
export function getSmsLink(session: ExamSession, config: ContestConfig): string {
  const phone = config.organizerPhone || '09837645';
  const text = getSmsContentText(session, config);
  return `sms:${phone}?body=${encodeURIComponent(text)}`;
}

/**
 * Record submission on server memory
 */
export async function recordExamSubmission(session: ExamSession, config: ContestConfig): Promise<boolean> {
  try {
    const res = await fetch('/api/submit-exam', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session,
        config,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch all submissions from server memory
 */
export async function fetchServerSubmissions(): Promise<ExamSession[]> {
  try {
    const res = await fetch('/api/submissions');
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // ignore
  }
  return [];
}
