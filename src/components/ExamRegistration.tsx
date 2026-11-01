import React, { useState } from 'react';
import { CandidateInfo, ContestConfig } from '../types/quiz';
import { Shield, Clock, Shuffle, CheckCircle, ArrowRight, UserCheck, AlertCircle, Database } from 'lucide-react';

interface ExamRegistrationProps {
  config: ContestConfig;
  totalQuestions: number;
  onStartExam: (candidate: CandidateInfo) => void;
}

export const ExamRegistration: React.FC<ExamRegistrationProps> = ({
  config,
  onStartExam,
}) => {
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [error, setError] = useState('');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Đồng chí vui lòng điền đầy đủ Họ và tên.');
      return;
    }

    if (!position.trim()) {
      setError('Đồng chí vui lòng điền Chức danh, chức vụ công tác.');
      return;
    }

    onStartExam({
      fullName: fullName.trim(),
      position: position.trim(),
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Bright Hero Card */}
      <div className="bg-gradient-to-br from-blue-600 via-sky-600 to-cyan-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/15 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold uppercase tracking-wider mb-3">
            <Shield className="w-3.5 h-3.5" />
            <span>{config.organizer}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            {config.title}
          </h2>
          <p className="text-base sm:text-lg text-sky-100 font-medium max-w-2xl mb-6">
            “{config.subTitle}”
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-white mb-0.5">
                <Clock className="w-4 h-4 text-amber-300" />
                <span className="text-lg font-bold">{config.durationMinutes}</span>
              </div>
              <div className="text-[11px] text-sky-100">Phút làm bài</div>
            </div>

            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-white mb-0.5">
                <CheckCircle className="w-4 h-4 text-emerald-300" />
                <span className="text-lg font-bold">{config.questionsCount}</span>
              </div>
              <div className="text-[11px] text-sky-100">Câu hỏi trắc nghiệm</div>
            </div>

            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-white mb-0.5">
                <Shuffle className="w-4 h-4 text-cyan-200" />
                <span className="text-xs font-bold uppercase">Xáo trộn</span>
              </div>
              <div className="text-[11px] text-sky-100">Ngẫu nhiên mỗi đề</div>
            </div>

            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-white mb-0.5">
                <Database className="w-4 h-4 text-emerald-300" />
                <span className="text-xs font-bold uppercase">Bộ nhớ</span>
              </div>
              <div className="text-[10px] text-sky-100">Lưu tự động 100%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left: Input Form (Free-form text input for both Name and Position) */}
        <div className="md:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-xl shadow-slate-200/50">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Thông Tin Thí Sinh Dự Thi</h3>
              <p className="text-xs text-slate-500">Vui lòng điền họ tên và chức vụ trước khi bắt đầu</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-red-700 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleStart} className="space-y-5">
            {/* 1. Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Họ và tên thí sinh <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Ví dụ: Nguyễn Văn Hùng"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-2xl px-4 py-3 text-slate-800 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition"
              />
            </div>

            {/* 2. Position / Title (Free-form text input) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Chức danh, chức vụ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Kiểm sát viên, Kiểm tra viên, Chuyên viên, Lãnh đạo Viện..."
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-2xl px-4 py-3 text-slate-800 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                * Tự do điền chức danh, chức vụ công tác của đồng chí mà không bị gò bó.
              </p>
            </div>

            {/* Submit / Start Button */}
            <button
              type="submit"
              className="w-full mt-3 bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition duration-200 cursor-pointer text-sm sm:text-base active:scale-[0.99]"
            >
              <span>Bắt Đầu Làm Bài Thi ({config.durationMinutes} Phút)</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Right: Rules & Notice */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-xl shadow-slate-200/50">
            <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Quy Chế & Bảo Mật Kỳ Thi</span>
            </h4>
            <ul className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  <strong>Thời gian làm bài:</strong> <strong>{config.durationMinutes} phút</strong> đếm ngược liên tục. Khi hết giờ, hệ thống tự động lưu và nộp bài.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  <strong>Lưu trữ bộ nhớ tự động:</strong> Mọi thí sinh khi hoàn thành bài thi đều được hệ thống tự động lưu trữ thông tin đầy đủ vào Bộ nhớ Quản trị.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  <strong>Tải file PDF câu trả lời:</strong> Sau khi nộp bài, đồng chí có thể tải trực tiếp file PDF lưu lại toàn bộ câu hỏi và các phương án mình đã chọn.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  4
                </span>
                <span>
                  Đồng thời được cấp <strong>Giấy xác nhận hoàn thành bài thi (PDF)</strong> chính thức.
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 text-xs text-emerald-900 flex items-start gap-2.5">
            <Database className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-emerald-950 mb-0.5">Bộ nhớ cơ sở dữ liệu nội bộ:</div>
              <div>Đã kích hoạt lưu trữ vĩnh viễn mọi lượt thi để Ban Tổ chức kiểm tra.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
