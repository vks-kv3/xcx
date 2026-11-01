import React, { useState, useRef } from 'react';
import { ExamSession, ContestConfig } from '../types/quiz';
import { generateCandidateAnswerSheetPDF } from '../utils/pdfGenerator';
import {
  Lock,
  Eye,
  Trash2,
  FileSpreadsheet,
  AlertCircle,
  Save,
  Check,
  X,
  Briefcase,
  Database,
  Download,
  Search,
  RefreshCw,
  Upload,
  HardDrive,
  CheckCircle2,
} from 'lucide-react';

interface AdminPanelProps {
  submissions: ExamSession[];
  config: ContestConfig;
  isAdminLoggedIn: boolean;
  onLogin: (password: string) => boolean;
  onLogout: () => void;
  onSaveConfig: (config: ContestConfig) => void;
  onDeleteSubmission: (id: string) => void;
  onClearAllSubmissions: () => void;
  onRecoverSubmissions: () => Promise<number>;
  onImportSubmissions: (imported: ExamSession[]) => number;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  submissions,
  config,
  isAdminLoggedIn,
  onLogin,
  onLogout,
  onSaveConfig,
  onDeleteSubmission,
  onClearAllSubmissions,
  onRecoverSubmissions,
  onImportSubmissions,
  onClose,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<ExamSession | null>(null);
  const [recovering, setRecovering] = useState(false);
  const [recoverNotice, setRecoverNotice] = useState<{ text: string; success: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings
  const [phoneInput, setPhoneInput] = useState(config.organizerPhone || '09837645');
  const [durationInput, setDurationInput] = useState(config.durationMinutes || 60);
  const [passwordNewInput, setPasswordNewInput] = useState(config.adminPassword || 'admin123');
  const [savedNotice, setSavedNotice] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin(passwordInput)) {
      setLoginError('');
      setPasswordInput('');
    } else {
      setLoginError('Mật khẩu không đúng. Mật khẩu khởi tạo: admin123');
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...config,
      organizerPhone: phoneInput.trim(),
      durationMinutes: durationInput,
      adminPassword: passwordNewInput.trim(),
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  // Trigger Deep Scan and Recovery
  const handleTriggerRecovery = async () => {
    setRecovering(true);
    try {
      const count = await onRecoverSubmissions();
      setRecoverNotice({
        text: `Đã hoàn tất quét sâu bộ nhớ: Tìm thấy và phục hồi tổng cộng ${count} thí sinh! Dữ liệu đã được đồng bộ an toàn.`,
        success: true,
      });
    } catch {
      setRecoverNotice({
        text: 'Có lỗi trong quá trình quét bộ nhớ.',
        success: false,
      });
    } finally {
      setRecovering(false);
      setTimeout(() => setRecoverNotice(null), 8000);
    }
  };

  // Export full raw JSON backup
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(submissions, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = `VKSND_KV3_SaoLuu_ToanBo_ThiSinh_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  // Import JSON backup
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          const total = onImportSubmissions(parsed);
          setRecoverNotice({
            text: `Nhập tệp sao lưu thành công! Danh sách hiện có tổng cộng ${total} thí sinh.`,
            success: true,
          });
        } else {
          alert('Tệp sao lưu không đúng định dạng danh sách bài thi.');
        }
      } catch (err) {
        alert('Không thể đọc tệp sao lưu JSON này.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    const headers = [
      'STT',
      'Mã bài thi',
      'Họ và tên thí sinh',
      'Chức danh, chức vụ',
      'Điểm số (/10)',
      'Số câu đúng',
      'Tổng số câu',
      'Thời gian làm bài',
      'Thời điểm nộp bài'
    ];
    const rows = submissions.map((s, idx) => [
      idx + 1,
      s.certificateCode,
      `"${(s.candidate.fullName || '').replace(/"/g, '""')}"`,
      `"${(s.candidate.position || '').replace(/"/g, '""')}"`,
      s.score.toFixed(1),
      s.correctCount,
      s.totalQuestions,
      `"${Math.floor(s.timeSpentSeconds / 60)}p ${s.timeSpentSeconds % 60}s"`,
      `"${s.submittedAt}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Danh_sach_thi_sinh_VKSND_KV3_Quang_Tri_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const filteredSubmissions = submissions.filter((s) =>
    s.candidate.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.candidate.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.certificateCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // If not logged in
  if (!isAdminLoggedIn) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
        <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-bold text-slate-800 text-center mb-1">
            Bộ Nhớ Quản Trị Hệ Thống
          </h3>
          <p className="text-xs text-slate-500 text-center mb-5">
            Dành riêng cho Ban Tổ chức quản lý và xem thông tin các thí sinh đã thi
          </p>

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                required
                autoFocus
                placeholder="Mật khẩu (Mặc định: admin123)"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-2xl text-sm transition shadow-md shadow-blue-500/20 cursor-pointer"
            >
              Mở Bộ Nhớ Quản Trị
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Hidden File Input for JSON Backup Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Top Banner */}
      <div className="bg-white border border-blue-100 rounded-3xl p-5 mb-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>Bộ Nhớ Quản Trị: Danh Sách Thí Sinh Đã Dự Thi</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                {submissions.length} thí sinh đã lưu
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hệ thống tự động lưu trữ vĩnh viễn mọi lượt thi để Ban Tổ chức trích xuất và tải báo cáo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Về Phòng Thi
          </button>

          <button
            onClick={onLogout}
            className="px-3 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium transition cursor-pointer"
          >
            Khóa lại
          </button>
        </div>
      </div>

      {/* RECOVERY & EXTRACTION TOOLBAR */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white border border-blue-200/80 rounded-3xl p-4 mb-4 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-wide">
              <HardDrive className="w-4 h-4 text-blue-600" />
              <span>Công Cụ Trích Xuất &amp; Khôi Phục Dữ Liệu</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Nếu gặp trường hợp mở lại trình duyệt không thấy đủ số thí sinh, bấm <strong>Quét &amp; Khôi Phục</strong> để hệ thống tự động trích xuất lại toàn bộ các bài thi đã làm từ bộ nhớ đệm.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Quick Deep Scan Recovery */}
            <button
              onClick={handleTriggerRecovery}
              disabled={recovering}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              title="Quét tìm lại toàn bộ thí sinh đã làm bài trước đó trên trình duyệt"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recovering ? 'animate-spin' : ''}`} />
              <span>{recovering ? 'Đang Quét...' : 'Quét & Khôi Phục Bộ Nhớ'}</span>
            </button>

            {/* Export CSV / Excel */}
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              title="Tải tệp Excel / CSV toàn bộ thí sinh có đầy đủ điểm số, thời gian, câu đúng"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Xuất File Excel/CSV</span>
            </button>

            {/* Download JSON Backup */}
            <button
              onClick={handleExportJSON}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Tải về tệp JSON chứa toàn bộ dữ liệu bài thi để lưu trữ phòng ngừa mất mát"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Tải File Sao Lưu (JSON)</span>
            </button>

            {/* Import JSON Backup */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Tải lên tệp sao lưu JSON từ máy tính hoặc thiết bị khác để gộp vào hệ thống"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>Nhập File Sao Lưu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recovery Notice Notification Banner */}
      {recoverNotice && (
        <div
          className={`mb-4 p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 transition animate-in fade-in ${
            recoverNotice.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {recoverNotice.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span className="font-medium">{recoverNotice.text}</span>
          <button
            onClick={() => setRecoverNotice(null)}
            className="ml-auto text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-4 relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên thí sinh, chức vụ, mã bài thi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
        />
      </div>

      {/* Main Submissions Table (Memory Viewer) */}
      <div className="bg-white border border-blue-100 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-bold">Mã Bài</th>
                <th className="py-3 px-4 font-bold">Họ Và Tên</th>
                <th className="py-3 px-4 font-bold">Chức Danh, Chức Vụ</th>
                <th className="py-3 px-4 font-bold text-center">Điểm Số</th>
                <th className="py-3 px-4 font-bold text-center">Câu Đúng</th>
                <th className="py-3 px-4 font-bold text-center">Thời Gian</th>
                <th className="py-3 px-4 font-bold text-center">Thời Điểm Nộp</th>
                <th className="py-3 px-4 font-bold text-right">Tải PDF & Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Chưa có bài thi nào trong bộ nhớ phù hợp với tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono text-blue-700 font-semibold text-xs">
                      {s.certificateCode}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {s.candidate.fullName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {s.candidate.position}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-red-600 text-base">
                      {s.score.toFixed(1)} / 10
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-semibold">
                      {s.correctCount} / {s.totalQuestions}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs text-slate-600">
                      {Math.floor(s.timeSpentSeconds / 60)}p {s.timeSpentSeconds % 60}s
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500 text-xs">
                      {s.submittedAt}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => generateCandidateAnswerSheetPDF(s, config)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1 transition"
                          title="Tải File PDF câu trả lời của thí sinh này"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Tải PDF câu trả lời</span>
                        </button>
                        <button
                          onClick={() => setSelectedSubmission(s)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="Xem chi tiết câu trả lời"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Xóa kết quả của thí sinh ${s.candidate.fullName}?`)) {
                              onDeleteSubmission(s.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition"
                          title="Xóa bài thi này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Config Section */}
      <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm max-w-2xl">
        <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-blue-600" />
          <span>Cấu Hình Quy Chế Kỳ Thi</span>
        </h4>
        <p className="text-xs text-slate-500 mb-4">
          Tùy chỉnh thời gian làm bài, số điện thoại tiếp nhận và mật khẩu bảo vệ bộ nhớ quản trị.
        </p>

        {savedNotice && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Đã lưu thành công cấu hình!</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Số điện thoại tiếp nhận (BTC)
            </label>
            <input
              type="text"
              required
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 font-mono font-bold focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Thời gian làm bài (Phút)
              </label>
              <input
                type="number"
                min="5"
                max="180"
                value={durationInput}
                onChange={(e) => setDurationInput(parseInt(e.target.value) || 60)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Mật khẩu quản trị
              </label>
              <input
                type="text"
                value={passwordNewInput}
                onChange={(e) => setPasswordNewInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu Cấu Hình</span>
            </button>

            {submissions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('CẢNH BÁO: Thao tác này sẽ xóa toàn bộ danh sách bài thi trong bộ nhớ?')) {
                    onClearAllSubmissions();
                  }
                }}
                className="text-xs text-red-600 hover:underline cursor-pointer"
              >
                Xóa sạch bộ nhớ cũ
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Information & Data Protection Guide Card */}
      <div className="mt-6 bg-slate-50 border border-slate-200/80 rounded-3xl p-5 max-w-2xl text-xs text-slate-600">
        <h5 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
          <Database className="w-4 h-4 text-blue-600" />
          <span>Cơ chế bảo toàn &amp; trích xuất dữ liệu thi</span>
        </h5>
        <ul className="list-disc list-inside space-y-1.5 text-slate-600 leading-relaxed">
          <li>
            <strong>Trình duyệt lưu trữ:</strong> Khi thí sinh nộp bài trên máy, thông tin được lưu trong bộ nhớ máy (Local Storage) và tự động đồng bộ sang bộ nhớ hệ thống.
          </li>
          <li>
            <strong>Khôi phục danh sách:</strong> Bấm nút <strong>&quot;Quét &amp; Khôi Phục Bộ Nhớ&quot;</strong> để quét toàn diện tất cả các phân vùng lưu trữ trước đó và gom đủ 28+ thí sinh.
          </li>
          <li>
            <strong>Trích xuất báo cáo:</strong> Bấm <strong>&quot;Xuất File Excel/CSV&quot;</strong> để tải danh sách có đầy đủ họ tên, chức vụ, điểm số, thời gian làm bài phục vụ tổng hợp.
          </li>
          <li>
            <strong>Lưu trữ an toàn ngoại tuyến:</strong> Bấm <strong>&quot;Tải File Sao Lưu (JSON)&quot;</strong> để lưu một bản sao lưu dữ liệu vào máy tính bất cứ lúc nào.
          </li>
        </ul>
      </div>

      {/* Detail Submission Modal for Organizer */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Chi Tiết Bài Thi: {selectedSubmission.candidate.fullName}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedSubmission.candidate.position} &bull; Điểm: <strong className="text-red-600 font-bold">{selectedSubmission.score}/10</strong> ({selectedSubmission.correctCount}/{selectedSubmission.totalQuestions} câu)
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 pr-1 text-xs">
              {selectedSubmission.questions.map((q, idx) => {
                const selected = selectedSubmission.answers[q.displayIndex];
                const isCorrect = selected === q.correctOptionId;
                return (
                  <div
                    key={q.displayIndex}
                    className={`p-3.5 rounded-2xl border ${
                      isCorrect ? 'bg-emerald-50/60 border-emerald-200' : 'bg-red-50/60 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span className="text-slate-800">Câu {idx + 1}: {q.question}</span>
                      <span className={isCorrect ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>
                        {isCorrect ? '✓ Đúng (+0.2)' : '✗ Sai (0)'}
                      </span>
                    </div>
                    <div className="space-y-1 mt-2">
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={`px-2.5 py-1 rounded-lg flex items-center gap-2 ${
                            opt.id === q.correctOptionId
                              ? 'bg-emerald-100/90 text-emerald-900 font-bold'
                              : opt.id === selected
                              ? 'bg-red-100 text-red-900 line-through'
                              : 'text-slate-600'
                          }`}
                        >
                          <span className="font-mono font-bold">{opt.id}.</span>
                          <span>{opt.text}</span>
                          {opt.id === q.correctOptionId && (
                            <span className="text-[10px] text-emerald-800 ml-auto font-bold">(Đáp án đúng)</span>
                          )}
                          {opt.id === selected && opt.id !== q.correctOptionId && (
                            <span className="text-[10px] text-red-800 ml-auto font-medium">(Thí sinh chọn)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => generateCandidateAnswerSheetPDF(selectedSubmission, config)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải File PDF câu trả lời này</span>
              </button>

              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
