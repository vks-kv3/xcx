import React from 'react';
import { ShieldCheck, Lock, LogOut } from 'lucide-react';

interface HeaderProps {
  isAdminLoggedIn: boolean;
  onAdminToggle: () => void;
  showAdminView: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isAdminLoggedIn,
  onAdminToggle,
  showAdminView,
}) => {
  return (
    <header className="bg-white border-b border-blue-100 shadow-xs sticky top-0 z-40">
      {/* Top Bright Cyan/Blue Ribbon */}
      <div className="bg-gradient-to-r from-blue-700 via-sky-600 to-cyan-600 px-4 py-1.5 text-white text-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
            <span>HỆ THỐNG THI TRẮC NGHIỆM TRỰC TUYẾN &bull; VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 3 - QUẢNG TRỊ</span>
          </div>
          <span className="text-[11px] text-sky-100 hidden sm:inline font-medium">
            Kỳ thi: Chuyển đổi số & An toàn thông tin
          </span>
        </div>
      </div>

      {/* Main Header Content */}
      <div className="max-w-6xl mx-auto px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-sky-600 to-cyan-500 p-0.5 shadow-md shadow-blue-500/20 shrink-0 flex items-center justify-center">
              <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-blue-700" />
              </div>
            </div>

            <div>
              <div className="text-[11px] sm:text-xs font-bold text-red-600 uppercase tracking-wide">
                VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 3 - QUẢNG TRỊ
              </div>
              <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-slate-800 tracking-tight">
                Cuộc Thi: “Nâng Cao Nhận Thức, Kỹ Năng Số & Bảo Đảm An Toàn Thông Tin”
              </h1>
            </div>
          </div>

          {/* Organizer Lock Toggle */}
          <button
            onClick={onAdminToggle}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 border ${
              showAdminView
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border-slate-200'
            }`}
            title="Dành riêng cho Ban Tổ Chức"
          >
            {isAdminLoggedIn ? (
              <>
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bộ Nhớ Quản Trị (Đang Mở)</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Ban Tổ Chức</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
