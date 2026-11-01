export interface Option {
  id: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
}

export interface Question {
  id: number;
  question: string;
  options: Option[];
  correctOptionId: string;
  category?: string;
}

export interface ShuffledQuestion {
  originalId: number;
  displayIndex: number;
  question: string;
  options: Option[];
  correctOptionId: string;
  category?: string;
}

export interface CandidateInfo {
  fullName: string;
  position: string; // Chức danh, chức vụ
}

export interface ExamSession {
  id: string;
  certificateCode: string;
  candidate: CandidateInfo;
  startTime: number;
  endTime?: number;
  timeSpentSeconds: number;
  questions: ShuffledQuestion[];
  answers: Record<number, string>; // displayIndex -> selectedOptionId
  flagged: number[];
  score: number; // Thang 10 (chỉ gửi ban tổ chức)
  correctCount: number;
  totalQuestions: number;
  submittedAt: string;
  phoneRecipient?: string;
}

export interface ContestConfig {
  title: string;
  subTitle: string;
  organizer: string;
  unitAddress: string;
  organizerPhone: string; // '09837645'
  durationMinutes: number; // 60 phút
  questionsCount: number; // 50 câu
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  adminPassword: string;
}
