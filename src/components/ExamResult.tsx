import React, { useEffect } from 'react';
import { ExamSession, ContestConfig } from '../types/quiz';
import { generateCandidateResultPDF, generateCandidateAnswerSheetPDF } from '../utils/pdfGenerator';
import { recordExamSubmission } from '../services/smsService';
import {
  CheckCircle2,
  FileCheck2,
  Download,
  RotateCcw,
  ShieldCheck,
  Clock,
  Printer,
  Calendar,
  User,
  Briefcase,
  Database,
  FileText,
} from 'lucide-react';

interface ExamResultProps {
  session: ExamSession;
  config: ContestConfig;
  onRetakeExam: () => void;
}

export const ExamResult: React.FC<ExamResultProps> = ({
  session,
  config,
  onRetakeExam,
}) => {
  // Automatically record submission in internal memory database
  useEffect(() => {
    recordExamSubmission(session, config);
  }, [session, config]);

  const handleExportResultPDF = () => {
    generateCandidateResultPDF(session, config);
  };

  const handleExportAnswerSheetPDF = () => {
    generateCandidateAnswerSheetPDF(session, config);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Success Notification Banner */}
      <div className="bg-white border border-emerald-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-500/5 text-center mb-6">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-xs">
          <CheckCircle2 className="w-9 h-9 text-emerald-600" />
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mb-1">
          Nộp Bài Thi Thành Công!
        </h2>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          Cảm ơn đồng chí <strong className="text-slate-900">{session.candidate.fullName}</strong> ({session.candidate.position}) đã hoàn thành bài thi trắc nghiệm trực tuyến.
        </p>

        {/* System Memory Notification */}
        <div className="mt-5 max-w-md mx-auto p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center gap-3 text-left">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-950">
              Đã lưu trữ vào Bộ nhớ Quản trị hệ thống
            </div>
            <div className="text-[11px] text-emerald-800 mt-0.5">
              Toàn bộ thông tin thí sinh, thời gian thi và câu trả lời đã được bảo lưu phục vụ Ban Tổ chức tổng hợp.
            </div>
          </div>
        </div>

        {/* Prominent Action Buttons: Download Answers PDF & Download Confirmation PDF */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleExportAnswerSheetPDF}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/25 transition cursor-pointer active:scale-95"
          >
            <FileText className="w-4 h-4 text-white" />
            <span>Tải File PDF Câu Trả Lời Của Bạn</span>
          </button>

          <button
            onClick={handleExportResultPDF}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-blue-700 text-xs sm:text-sm font-bold border border-blue-200 shadow-xs transition cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Tải Giấy Xác Nhận Nộp Bài (PDF)</span>
          </button>
        </div>
      </div>

      {/* Official Confirmation Card (Clean White-Blue) */}
      <div className="bg-white border border-blue-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 mb-6">
        {/* Card Header */}
        <div className="border-b border-slate-100 pb-5 mb-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <div className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
              VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 3 - QUẢNG TRỊ
            </div>
            <h3 className="text-base font-extrabold text-slate-800 mt-0.5">
              GIẤY XÁC NHẬN NỘP BÀI THI TRỰC TUYẾN
            </h3>
            <p className="text-xs text-slate-500">
              Cuộc thi: “{config.subTitle}”
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-right font-mono text-xs text-slate-600">
            Mã bài thi: <strong className="text-blue-700">{session.certificateCode}</strong>
          </div>
        </div>

        {/* Information Table */}
        <div className="space-y-3 text-xs sm:text-sm">
          <div className="flex items-center justify-between py-2 border-b border-slate-50">
            <span className="text-slate-500 flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" />
              <span>Họ và tên thí sinh:</span>
            </span>
            <span className="font-bold text-slate-900 uppercase">{session.candidate.fullName}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-50">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span>Chức danh, chức vụ:</span>
            </span>
            <span className="font-semibold text-slate-800">{session.candidate.position}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-50">
            <span className="text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Số câu hỏi đã hoàn thành:</span>
            </span>
            <span className="font-bold text-blue-700">
              {Object.keys(session.answers).length} / {session.totalQuestions} câu
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-50">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Thời gian làm bài:</span>
            </span>
            <span className="font-medium text-slate-800">
              {Math.floor(session.timeSpentSeconds / 60)} phút {session.timeSpentSeconds % 60} giây
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-50">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-sky-500" />
              <span>Thời điểm ghi nhận nộp bài:</span>
            </span>
            <span className="font-medium text-slate-800">{session.submittedAt}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-50">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-teal-600" />
              <span>Trạng thái bộ nhớ:</span>
            </span>
            <span className="font-bold text-emerald-600">Đã lưu trữ an toàn trong Bộ nhớ hệ thống</span>
          </div>
        </div>

        {/* Security Note regarding answers */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
          <strong>Lưu ý:</strong> Để bảo đảm tính khách quan cho các lượt thi tiếp theo, hệ thống không công bố đáp án đúng/sai trên màn hình. Đồng chí có thể bấm nút <strong>"Tải File PDF Câu Trả Lời Của Bạn"</strong> ở trên để lưu lại bảng câu hỏi kèm các lựa chọn của mình.
        </div>
      </div>

      {/* Auxiliary Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={handleExportAnswerSheetPDF}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-2xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Tải file PDF câu trả lời</span>
        </button>

        <button
          onClick={handlePrint}
          className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-2xl border border-slate-200 text-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>In giấy xác nhận</span>
        </button>

        <button
          onClick={onRetakeExam}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-2xl text-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
          <span>Làm bài lượt mới</span>
        </button>
      </div>
    </div>
  );
};
