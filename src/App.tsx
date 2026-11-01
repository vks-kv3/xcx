import { useState, useEffect } from 'react';
import { Question, ContestConfig, ExamSession, CandidateInfo } from './types/quiz';
import { StorageService, generateExamSession } from './services/storage';
import { Header } from './components/Header';
import { ExamRegistration } from './components/ExamRegistration';
import { ExamRoom } from './components/ExamRoom';
import { ExamResult } from './components/ExamResult';
import { AdminPanel } from './components/AdminPanel';

import { fetchServerSubmissions } from './services/smsService';

export default function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [config, setConfig] = useState<ContestConfig>(() => StorageService.getConfig());
  const [submissions, setSubmissions] = useState<ExamSession[]>([]);
  const [activeSession, setActiveSession] = useState<ExamSession | null>(null);
  const [completedSession, setCompletedSession] = useState<ExamSession | null>(null);

  // Admin / Organizer panel states
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [showAdminView, setShowAdminView] = useState<boolean>(false);

  // Initialize data on mount
  useEffect(() => {
    const loadedQuestions = StorageService.getQuestions();
    const loadedConfig = StorageService.getConfig();
    const loadedSubmissions = StorageService.getSubmissions();
    const loadedActive = StorageService.getActiveSession();

    setQuestions(loadedQuestions);
    setConfig(loadedConfig);
    setSubmissions(loadedSubmissions);
    if (loadedActive) {
      setActiveSession(loadedActive);
    }

    // Sync with server memory database
    fetchServerSubmissions().then((serverList) => {
      if (serverList && serverList.length > 0) {
        setSubmissions((prev) => {
          const map = new Map<string, ExamSession>();
          prev.forEach((s) => map.set(s.id, s));
          serverList.forEach((s) => map.set(s.id, s));
          const merged = Array.from(map.values());
          localStorage.setItem('vksnd_kv3_submissions_v2', JSON.stringify(merged));
          return merged;
        });
      }
    });
  }, []);

  // Candidate begins exam
  const handleStartExam = (candidate: CandidateInfo) => {
    const newSession = generateExamSession(candidate, config, questions);
    setActiveSession(newSession);
    StorageService.saveActiveSession(newSession);
    setCompletedSession(null);
  };

  // Realtime updates during exam
  const handleUpdateSession = (updatedSession: ExamSession) => {
    setActiveSession(updatedSession);
    StorageService.saveActiveSession(updatedSession);
  };

  // Candidate finishes exam
  const handleSubmitExam = (finalSession: ExamSession) => {
    const updated = StorageService.saveSubmission(finalSession);
    setSubmissions(updated);
    StorageService.saveActiveSession(null);
    setActiveSession(null);
    setCompletedSession(finalSession);
  };

  const handleRetakeExam = () => {
    setCompletedSession(null);
    setActiveSession(null);
    StorageService.saveActiveSession(null);
  };

  // Admin handlers
  const handleAdminLogin = (password: string): boolean => {
    if (password === config.adminPassword) {
      setIsAdminLoggedIn(true);
      return true;
    }
    return false;
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setShowAdminView(false);
  };

  const handleSaveConfig = (updated: ContestConfig) => {
    setConfig(updated);
    StorageService.saveConfig(updated);
  };

  const handleDeleteSubmission = (id: string) => {
    const updated = StorageService.deleteSubmission(id);
    setSubmissions(updated);
  };

  const handleClearAllSubmissions = () => {
    StorageService.clearSubmissions();
    setSubmissions([]);
  };

  // Recover historical data from browser storage & server
  const handleRecoverSubmissions = async (): Promise<number> => {
    // 1. Recover from all browser local storage keys
    const recovered = StorageService.getSubmissions();
    
    // 2. Fetch server memory submissions as well
    const serverList = await fetchServerSubmissions();
    
    // 3. Merge uniquely by ID, cert code, or candidate name+time
    const map = new Map<string, ExamSession>();
    recovered.forEach((s) => {
      const key = s.id || s.certificateCode || `${s.candidate?.fullName}_${s.submittedAt}`;
      map.set(key, s);
    });
    serverList.forEach((s) => {
      const key = s.id || s.certificateCode || `${s.candidate?.fullName}_${s.submittedAt}`;
      if (!map.has(key)) {
        map.set(key, s);
      }
    });

    const merged = Array.from(map.values());
    StorageService.saveAllSubmissions(merged);
    setSubmissions(merged);
    return merged.length;
  };

  // Import JSON backup
  const handleImportSubmissions = (imported: ExamSession[]): number => {
    const current = StorageService.getSubmissions();
    const map = new Map<string, ExamSession>();
    
    // Put current
    current.forEach((s) => {
      const key = s.id || s.certificateCode || `${s.candidate?.fullName}_${s.submittedAt}`;
      map.set(key, s);
    });

    // Merge imported
    let newCount = 0;
    imported.forEach((s) => {
      if (s && s.candidate && s.candidate.fullName) {
        const key = s.id || s.certificateCode || `${s.candidate?.fullName}_${s.submittedAt}`;
        if (!map.has(key)) {
          newCount++;
        }
        map.set(key, s);
      }
    });

    const merged = Array.from(map.values());
    StorageService.saveAllSubmissions(merged);
    setSubmissions(merged);
    return merged.length;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-['Be_Vietnam_Pro',sans-serif] selection:bg-blue-600 selection:text-white">
      {/* Bright Header */}
      <Header
        isAdminLoggedIn={isAdminLoggedIn}
        showAdminView={showAdminView}
        onAdminToggle={() => setShowAdminView(!showAdminView)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {showAdminView ? (
          <AdminPanel
            submissions={submissions}
            config={config}
            isAdminLoggedIn={isAdminLoggedIn}
            onLogin={handleAdminLogin}
            onLogout={handleAdminLogout}
            onSaveConfig={handleSaveConfig}
            onDeleteSubmission={handleDeleteSubmission}
            onClearAllSubmissions={handleClearAllSubmissions}
            onRecoverSubmissions={handleRecoverSubmissions}
            onImportSubmissions={handleImportSubmissions}
            onClose={() => setShowAdminView(false)}
          />
        ) : completedSession ? (
          <ExamResult
            session={completedSession}
            config={config}
            onRetakeExam={handleRetakeExam}
          />
        ) : activeSession ? (
          <ExamRoom
            session={activeSession}
            config={config}
            onUpdateSession={handleUpdateSession}
            onSubmitExam={handleSubmitExam}
          />
        ) : (
          <ExamRegistration
            config={config}
            totalQuestions={questions.length}
            onStartExam={handleStartExam}
          />
        )}
      </main>

      {/* Clean Light Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-5 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="text-slate-600">
            &copy; 2026 <strong className="text-slate-800">Viện kiểm sát nhân dân khu vực 3 - Quảng Trị</strong>
          </div>
          <div className="flex items-center gap-3 text-slate-500 text-[11px]">
            <span>Cuộc thi: “{config.subTitle}”</span>
            <span>&bull;</span>
            <span>Hệ thống thi trắc nghiệm điện tử</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
