import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Bell, Volume2, Sparkles } from 'lucide-react';
import { ambientSound } from '../utils/ambientSound';

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

interface FocusTimerProps {
  isDark?: boolean;
  onTimerComplete?: (message: string) => void;
  /** コンパクト表示モード (Zenモード用) */
  compact?: boolean;
}

const MODE_DURATIONS: Record<PomodoroMode, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const MODE_LABELS: Record<PomodoroMode, string> = {
  focus: '集中 (25m)',
  shortBreak: '小休憩 (5m)',
  longBreak: '長休憩 (15m)',
};

export const FocusTimer: React.FC<FocusTimerProps> = ({
  isDark = true,
  onTimerComplete,
  compact = false,
}) => {
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(MODE_DURATIONS.focus);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // タイマー完了時のアクション
  const handleComplete = useCallback(() => {
    ambientSound.playChime();
    setIsRunning(false);

    if (mode === 'focus') {
      const nextCount = completedCount + 1;
      setCompletedCount(nextCount);
      const nextMode: PomodoroMode = nextCount % 4 === 0 ? 'longBreak' : 'shortBreak';
      setMode(nextMode);
      setTimeLeft(MODE_DURATIONS[nextMode]);
      onTimerComplete?.(`🍅 集中セッション（25分）お疲れ様でした！${nextMode === 'longBreak' ? '15分の長休憩' : '5分の休憩'}を取りましょう。`);
    } else {
      setMode('focus');
      setTimeLeft(MODE_DURATIONS.focus);
      onTimerComplete?.('☕ 休憩終了です！次の集中セッション（25分）を始めましょう。');
    }
  }, [mode, completedCount, onTimerComplete]);

  // カウントダウン useEffect
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isRunning) {
      intervalId = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, handleComplete]);

  // 外部クリックでメニューを閉じる
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isMenuOpen]);

  const toggleRun = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(MODE_DURATIONS[mode]);
  };

  const handleSwitchMode = (newMode: PomodoroMode) => {
    setMode(newMode);
    setTimeLeft(MODE_DURATIONS[newMode]);
    setIsRunning(false);
    setIsMenuOpen(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((MODE_DURATIONS[mode] - timeLeft) / MODE_DURATIONS[mode]) * 100;

  // Zen モード等のコンパクト表示
  return (
    <div className="relative inline-flex items-center" ref={menuRef}>
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border shadow-lg backdrop-blur-md transition-all ${
          isRunning
            ? isDark
              ? 'bg-amber-950/80 border-amber-500/50 text-amber-200'
              : 'bg-amber-50/90 border-amber-300 text-amber-900'
            : isDark
            ? 'bg-slate-900/80 border-slate-700/80 text-slate-300'
            : 'bg-white/90 border-slate-300 text-slate-700'
        }`}
      >
        {/* モード切替トリガー */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-1 hover:underline cursor-pointer"
          title="タイマーモード切替 (25m / 5m / 15m)"
        >
          <span>{mode === 'focus' ? '🍅' : '☕'}</span>
          <span className="font-bold tracking-tight">{formatTime(timeLeft)}</span>
        </button>

        {/* スタート / 一時停止 */}
        <button
          type="button"
          onClick={toggleRun}
          className={`p-1 rounded-full transition-colors cursor-pointer ${
            isRunning
              ? 'hover:bg-amber-800/50 text-amber-300'
              : isDark
              ? 'hover:bg-slate-700 text-cyan-400'
              : 'hover:bg-slate-200 text-cyan-700'
          }`}
          title={isRunning ? '一時停止' : 'タイマー開始'}
        >
          {isRunning ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
        </button>

        {/* リセット */}
        <button
          type="button"
          onClick={handleReset}
          className="p-1 rounded-full hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          title="リセット"
        >
          <RotateCcw className="w-3 h-3" />
        </button>

        {/* 達成数バッジ */}
        {completedCount > 0 && (
          <span
            className="text-[10px] px-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 font-sans"
            title={`完了した集中セッション: ${completedCount}回`}
          >
            ×{completedCount}
          </span>
        )}
      </div>

      {/* モード選択ドロップダウン */}
      {isMenuOpen && (
        <div
          className={`absolute top-full mt-2 left-0 z-50 w-44 p-1.5 rounded-xl border shadow-2xl backdrop-blur-md transition-all font-sans text-xs ${
            isDark
              ? 'bg-slate-900/95 border-slate-700 text-slate-200'
              : 'bg-white/95 border-slate-200 text-slate-800'
          }`}
        >
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            タイマーモード
          </div>
          {(['focus', 'shortBreak', 'longBreak'] as PomodoroMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleSwitchMode(m)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                mode === m
                  ? isDark
                    ? 'bg-amber-950/70 text-amber-300 font-semibold'
                    : 'bg-amber-100 text-amber-900 font-semibold'
                  : isDark
                  ? 'hover:bg-slate-800 text-slate-300'
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span>{MODE_LABELS[m]}</span>
              {mode === m && <span className="text-amber-400">✓</span>}
            </button>
          ))}
          <div className="border-t border-slate-700/40 my-1 pt-1">
            <button
              type="button"
              onClick={() => {
                setCompletedCount(0);
                setIsMenuOpen(false);
              }}
              className="w-full text-left px-2.5 py-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              達成カウントをリセット
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
