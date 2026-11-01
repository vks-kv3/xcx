import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ExamSession, ContestConfig } from '../types/quiz';
import {
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  User,
  BookmarkCheck,
  Briefcase,
} from 'lucide-react';

interface ExamRoomProps {
  session: ExamSession;
  config: ContestConfig;
  onUpdateSession: (session: ExamSession) => void;
  onSubmitExam: (session: ExamSession) => void;
}

export const ExamRoom: React.FC<ExamRoomProps> = ({
  session,
  config,
  onUpdateSession,
  onSubmitExam,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Local answers state for INSTANT (0ms) visual response upon click
  const [answers, setAnswers] = useState<Record<number, string>>(() => ({ ...(session.answers || {}) }));
  const [flagged, setFlagged] = useState<number[]>(() => [...(session.flagged || [])]);

  // Timer countdown
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(() => {
    const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
    const totalDuration = config.durationMinutes * 60;
    const remaining = totalDuration - elapsed;
    return remaining > 0 ? remaining : 0;
  });
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);

  const currentQuestion = session.questions[currentIndex];
  const totalQuestions = session.questions.length;
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const unansweredCount = totalQuestions - answeredCount;

  // Final submit handler
  const performSubmit = useCallback(() => {
    const totalDuration = config.durationMinutes * 60;
    const timeSpent = Math.min(totalDuration, Math.max(1, totalDuration - timeLeftSeconds));

    // Secretly compute score for organizer email
    let correct = 0;
    session.questions.forEach((q) => {
      const selected = answers[q.displayIndex];
      if (selected && selected === q.correctOptionId) {
        correct++;
      }
    });

    const score = Math.round((correct / totalQuestions) * 10 * 10) / 10;
    const now = new Date();
    const submittedAt =
      now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
      ', ' +
      now.toLocaleDateString('vi-VN');

    const finalSession: ExamSession = {
      ...session,
      answers,
      flagged,
      endTime: Date.now(),
      timeSpentSeconds: timeSpent,
      score,
      correctCount: correct,
      totalQuestions,
      submittedAt,
    };

    onSubmitExam(finalSession);
  }, [config.durationMinutes, timeLeftSeconds, session, answers, flagged, totalQuestions, onSubmitExam]);

  // Timer loop - DOES NOT trigger heavy parent re-renders or localStorage writes every second
  useEffect(() => {
    if (timeLeftSeconds <= 0) {
      performSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          performSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeftSeconds, performSubmit]);

  // Immediate 0ms option selection
  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion) return;
    const qIndex = currentQuestion.displayIndex;

    // 1. INSTANT local state update (lights up immediately in <1ms)
    const newAnswers = { ...answers, [qIndex]: optionId };
    setAnswers(newAnswers);

    // 2. Non-blocking update to session parent in background
    setTimeout(() => {
      onUpdateSession({
        ...session,
        answers: newAnswers,
      });
    }, 0);
  };

  // Immediate toggle flag
  const handleToggleFlag = () => {
    if (!currentQuestion) return;
    const qIndex = currentQuestion.displayIndex;
    let newFlagged: number[];
    if (flagged.includes(qIndex)) {
      newFlagged = flagged.filter((i) => i !== qIndex);
    } else {
      newFlagged = [...flagged, qIndex];
    }

    setFlagged(newFlagged);

    setTimeout(() => {
      onUpdateSession({
        ...session,
        flagged: newFlagged,
      });
    }, 0);
  };

  // Keyboard shortcut listener (A,B,C,D or 1,2,3,4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSubmitModal) return;

      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        handleSelectOption(key);
      } else if (key === '1') handleSelectOption('A');
      else if (key === '2') handleSelectOption('B');
      else if (key === '3') handleSelectOption('C');
      else if (key === '4') handleSelectOption('D');
      else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < totalQuestions - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, totalQuestions, showSubmitModal, currentQuestion, answers]);

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const isUrgent = timeLeftSeconds <= 300;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Top Status Bar (Bright White-Blue) */}
      <div className="bg-white border border-blue-100 rounded-3xl p-4 sm:p-5 shadow-lg shadow-blue-500/5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Candidate Info Badge */}
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span>{session.candidate.fullName}</span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Briefcase className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-medium text-slate-700">{session.candidate.position}</span>
              <span>&bull;</span>
              <span>VKSND Khu vực 3 - Quảng Trị</span>
            </div>
          </div>
        </div>

        {/* Center: Countdown Timer */}
        <div
          className={`flex items-center gap-3.5 px-6 py-2.5 rounded-2xl border shadow-xs ${
            isUrgent
              ? 'bg-red-50 border-red-200 text-red-700 animate-pulse'
              : 'bg-blue-50/80 border-blue-200 text-blue-900'
          }`}
        >
          <Clock className={`w-5 h-5 ${isUrgent ? 'text-red-600' : 'text-blue-600'}`} />
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Thời gian còn lại
            </div>
            <div className="text-2xl font-black font-mono tracking-wider">
              {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Right: Submit Button */}
        <button
          onClick={() => setShowSubmitModal(true)}
          className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 active:scale-95 text-white font-bold px-6 py-3 rounded-2xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          <Send className="w-4 h-4" />
          <span>Nộp Bài Thi</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main: Question Box (Bright White Card) */}
        <div className="lg:col-span-8 bg-white border border-blue-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 flex flex-col justify-between min-h-[500px]">
          <div>
            {/* Question Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <span className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs sm:text-sm shadow-xs">
                  Câu {currentIndex + 1} / {totalQuestions}
                </span>
                {currentQuestion?.category && (
                  <span className="text-xs px-3 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium">
                    {currentQuestion.category}
                  </span>
                )}
              </div>

              {/* Flag button */}
              <button
                onClick={handleToggleFlag}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border ${
                  flagged.includes(currentQuestion?.displayIndex || 0)
                    ? 'bg-amber-50 text-amber-700 border-amber-300'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    flagged.includes(currentQuestion?.displayIndex || 0)
                      ? 'fill-amber-500 text-amber-500'
                      : 'text-slate-400'
                  }`}
                />
                <span>
                  {flagged.includes(currentQuestion?.displayIndex || 0)
                    ? 'Đã đánh dấu xem lại'
                    : 'Đánh dấu xem lại'}
                </span>
              </button>
            </div>

            {/* Question Text */}
            <div className="mb-7">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 leading-relaxed">
                {currentQuestion?.question}
              </h3>
            </div>

            {/* Options List - Instantaneous 0ms Selection Feedback */}
            <div className="space-y-3">
              {currentQuestion?.options.map((opt) => {
                const isSelected = answers[currentQuestion.displayIndex] === opt.id;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full text-left p-4 rounded-2xl border flex items-start gap-3.5 cursor-pointer select-none active:scale-[0.99] ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 shadow-md text-white font-medium'
                        : 'bg-slate-50 hover:bg-blue-50/50 border-slate-200 text-slate-700 hover:border-blue-300'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isSelected
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      {opt.id}
                    </div>
                    <div className="text-sm sm:text-base pt-0.5 leading-relaxed">
                      {opt.text}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="border-t border-slate-100 pt-6 mt-8 flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 ${
                currentIndex === 0
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer active:scale-95'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Câu trước</span>
            </button>

            <div className="text-xs text-slate-400 hidden sm:block">
              (Bấm phím <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono text-slate-700">A</kbd>, <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono text-slate-700">B</kbd>, <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono text-slate-700">C</kbd>, <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono text-slate-700">D</kbd> để chọn tức thì)
            </div>

            <button
              onClick={() =>
                setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))
              }
              disabled={currentIndex === totalQuestions - 1}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 ${
                currentIndex === totalQuestions - 1
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold cursor-pointer active:scale-95'
              }`}
            >
              <span>Câu tiếp theo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: 50 Questions Navigation Grid */}
        <div className="lg:col-span-4 bg-white border border-blue-100 rounded-3xl p-5 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4 text-blue-600" />
                <span>Danh Sách 50 Câu</span>
              </h4>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                Đã làm: {answeredCount}/{totalQuestions}
              </span>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-blue-600"></div>
                <span>Đã chọn ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-slate-200"></div>
                <span>Chưa làm ({unansweredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-amber-400 flex items-center justify-center text-[9px] text-white font-bold">
                  ★
                </div>
                <span>Xem lại ({flagged.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded border-2 border-blue-600 bg-white"></div>
                <span>Đang xem</span>
              </div>
            </div>

            {/* 50 Questions Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-[380px] overflow-y-auto pr-1">
              {session.questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = answers[q.displayIndex] !== undefined;
                const isFlagged = flagged.includes(q.displayIndex);

                let btnClass = 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60';
                if (isAnswered) {
                  btnClass = 'bg-blue-600 text-white font-bold shadow-xs';
                }
                if (isCurrent) {
                  btnClass += ' ring-2 ring-blue-500 ring-offset-2 scale-105';
                }

                return (
                  <button
                    key={q.displayIndex}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative h-10 rounded-xl text-xs font-semibold flex items-center justify-center cursor-pointer active:scale-95 ${btnClass}`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 text-white rounded-full flex items-center justify-center text-[8px] font-bold shadow-xs">
                        ★
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progress Bar & Submit CTA */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex justify-between text-xs text-slate-600 mb-1.5 font-medium">
              <span>Tiến độ bài làm:</span>
              <span className="text-blue-600 font-bold">
                {Math.round((answeredCount / totalQuestions) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-cyan-500 h-full transition-all duration-150"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full mt-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 active:scale-98"
            >
              <Send className="w-4 h-4" />
              <span>Nộp Bài Thi Ngay</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-blue-600 mb-4">
              <div className="p-3 bg-blue-50 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Xác Nhận Nộp Bài Thi?</h3>
                <p className="text-xs text-slate-500">Kết quả sẽ được chuyển giao về số điện thoại Ban Tổ chức ({config.organizerPhone})</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 mb-6 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Thí sinh:</span>
                <span className="font-bold text-slate-900">{session.candidate.fullName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Số câu đã trả lời:</span>
                <span className="font-bold text-blue-600">{answeredCount} / {totalQuestions}</span>
              </div>
              {unansweredCount > 0 && (
                <div className="flex justify-between text-amber-600 font-semibold">
                  <span>Số câu CHƯA trả lời:</span>
                  <span>{unansweredCount} câu</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-200">
                <span>Thời gian còn lại:</span>
                <span className="font-mono font-bold text-slate-700">{minutes} phút {seconds} giây</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-2xl text-xs sm:text-sm transition cursor-pointer"
              >
                Tiếp tục làm bài
              </button>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  performSubmit();
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl text-xs sm:text-sm transition cursor-pointer shadow-lg shadow-blue-500/20 active:scale-95"
              >
                Đồng ý nộp bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
