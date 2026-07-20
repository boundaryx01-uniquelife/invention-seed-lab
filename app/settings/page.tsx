"use client";

import { useEffect, useState } from "react";
import { Settings, Save, AlertCircle, CheckCircle2, Sliders, MessageSquare, Terminal, Lock, KeyRound, LogOut } from "lucide-react";

const CATEGORIES = [
  "생활안전",
  "학교생활",
  "환경·에너지",
  "고령자·장애 보조",
  "반려동물",
  "재난·기후",
  "디지털·AI",
  "의료·건강",
  "교통·이동",
  "가정생활",
  "운동·놀이",
  "학습도구",
];

const SCHOOL_LEVELS = ["초등 저학년", "초등 고학년", "중학생", "고등학생", "전체"];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // 🔐 관리자 전용 비밀번호 잠금 상태
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  const [settings, setSettings] = useState({
    aiProvider: "gemini",
    geminiModel: "gemini-2.5-flash",
    openaiModel: "gpt-4o-mini",
    dailyIdeaCount: 5,
    defaultSchoolLevel: "초등 고학년",
    defaultCategory: "생활안전",
    saveThreshold: 3.5,
    excellentThreshold: 4.3,
    telegramBotToken: "",
    telegramChatId: "",
    autoGenTime: "07:00",
  });

  useEffect(() => {
    const sessionAuth = sessionStorage.getItem("settings_unlocked");
    if (sessionAuth === "true") {
      setIsUnlocked(true);
    }
  }, []);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.success) {
          setSettings(data.settings);
        } else {
          setError(data.error || "설정을 불러오는 도중 오류가 발생했습니다.");
        }
      } catch (err) {
        setError("서버로부터 설정 데이터를 가져오는 도중 연결 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  // 관리자 암호 인증 처리 (비밀번호: admin1234)
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (passwordInput === "admin1234") {
      setIsUnlocked(true);
      sessionStorage.setItem("settings_unlocked", "true");
      setPasswordInput("");
    } else {
      setAuthError("연구실 관리자 비밀번호가 일치하지 않습니다. (기본 암호: admin1234)");
    }
  };

  // 🔒 다시 잠금 처리
  const handleLockSettings = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem("settings_unlocked");
  };

  const handleChange = (key: string, val: string | number) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message || "모든 설정이 성공적으로 반영되었습니다.");
      } else {
        setError(data.error || "설정 저장에 실패했습니다.");
      }
    } catch (err) {
      setError("서버로 설정 데이터를 제출하는 중 통신 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-400 font-medium">연구소 내부 통제 장치를 로드 중...</span>
        </div>
      </div>
    );
  }

  // 🔐 미인증 시 관리자 비밀번호 입력 폼 노출
  if (!isUnlocked) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center max-w-md mx-auto px-4">
        <div className="glass-panel p-8 rounded-2xl border border-card-border shadow-2xl w-full space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl mb-4 text-amber-400 shadow-lg shadow-amber-500/10">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">🔒 관리자 전용 보안 인증</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed font-sans">
              API 키, AI 모델명 및 텔레그램 연동 토큰이 포함된 통제 페이지입니다.<br />
              연구실 관리자 비밀번호를 입력해 주십시오.
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                관리자 암호
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>

            {authError && (
              <p className="text-xs text-rose-400 font-medium leading-relaxed">{authError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
            >
              보안 설정 잠금 해제
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="pb-6 border-b border-card-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Settings className="w-8 h-8 text-sky-400" />
            연구실 환경 설정
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-sans">
            AI 모델, 점수 임계점 및 알림 봇 연동을 일괄 제어하는 통제 대시보드입니다.
          </p>
        </div>

        {/* 잠금 버튼 */}
        <button
          onClick={handleLockSettings}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-amber-400" />
          <span>보안 잠금</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-950/30 border border-rose-900/50 text-sm text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-sm text-emerald-400">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: AI Provider */}
        <div className="glass-panel p-6 rounded-2xl border border-card-border space-y-6">
          <h3 className="text-md font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Terminal className="w-5 h-5 text-indigo-400" />
            AI 모델 및 공급자 설정
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">기본 AI 공급자</label>
              <select
                value={settings.aiProvider}
                onChange={(e) => handleChange("aiProvider", e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                <option value="gemini">Google Gemini (기본, 권장)</option>
                <option value="openai">OpenAI (서브/대체용)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Google Gemini 모델명</label>
              <input
                type="text"
                value={settings.geminiModel}
                onChange={(e) => handleChange("geminiModel", e.target.value)}
                placeholder="gemini-2.5-flash"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">OpenAI 모델명</label>
              <input
                type="text"
                value={settings.openaiModel}
                onChange={(e) => handleChange("openaiModel", e.target.value)}
                placeholder="gpt-4o-mini"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">하루 자동 생성 아이디어 개수</label>
              <input
                type="number"
                value={settings.dailyIdeaCount}
                onChange={(e) => handleChange("dailyIdeaCount", Number(e.target.value))}
                min="1"
                max="20"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Generation Defaults */}
        <div className="glass-panel p-6 rounded-2xl border border-card-border space-y-6">
          <h3 className="text-md font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-5 h-5 text-sky-400" />
            기준점 및 분류 임계치 설정
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">기본 생성 카테고리</label>
              <select
                value={settings.defaultCategory}
                onChange={(e) => handleChange("defaultCategory", e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">기본 타겟 학교급</label>
              <select
                value={settings.defaultSchoolLevel}
                onChange={(e) => handleChange("defaultSchoolLevel", e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                {SCHOOL_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">보통 이상 저장 기준 점수 (이상)</label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={settings.saveThreshold}
                onChange={(e) => handleChange("saveThreshold", Number(e.target.value))}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <span className="text-[10px] text-slate-500 block mt-1">이 점수 미만의 평점을 받은 아이디어는 '실패' 목록으로 이동합니다.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">우수 후보 등급 기준 점수 (이상)</label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={settings.excellentThreshold}
                onChange={(e) => handleChange("excellentThreshold", Number(e.target.value))}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <span className="text-[10px] text-slate-500 block mt-1">이 점수 이상의 평점을 획득하면 '우수 후보'로 자동 편입됩니다.</span>
            </div>
          </div>
        </div>

        {/* Section 3: Telegram Bot */}
        <div className="glass-panel p-6 rounded-2xl border border-card-border space-y-6">
          <h3 className="text-md font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <MessageSquare className="w-5 h-5 text-violet-400" />
            텔레그램 연동 설정 (추후 단계)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">텔레그램 봇 토큰 (Bot Token)</label>
              <input
                type="password"
                value={settings.telegramBotToken}
                onChange={(e) => handleChange("telegramBotToken", e.target.value)}
                placeholder="0000000000:AAxxxxxxxxx..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">대상 채팅방 ID (Chat ID)</label>
              <input
                type="text"
                value={settings.telegramChatId}
                onChange={(e) => handleChange("telegramChatId", e.target.value)}
                placeholder="-100xxxxxxxxx"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">매일 자동 생성 시간</label>
              <input
                type="time"
                value={settings.autoGenTime}
                onChange={(e) => handleChange("autoGenTime", e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Form Submission */}
        <div className="flex justify-end">
          <button
            id="btn-save-settings"
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? "설정 기록 중..." : "시스템 설정 적용"}
          </button>
        </div>
      </form>
    </div>
  );
}
