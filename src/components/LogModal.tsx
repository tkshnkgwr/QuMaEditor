// UPDATE 2026-08-04: 低リソース・透過重視デザインのシステム動作ログモーダルコンポーネント
import React, { useEffect, useState } from 'react';
import { X, Trash2, Info, AlertTriangle, XCircle, ScrollText } from 'lucide-react';
import { LogEntry } from '../types';
import { logger } from '../utils/logger';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const LogModal: React.FC<LogModalProps> = ({ isOpen, onClose, isDark }) => {
  const [logs, setLogs] = useState<LogEntry[]>(logger.getLogs());

  useEffect(() => {
    if (isOpen) {
      setLogs(logger.getLogs());
      const unsubscribe = logger.subscribe((updatedLogs) => {
        setLogs(updatedLogs);
      });
      return unsubscribe;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-fadeIn">
      <div
        className={`w-full max-w-3xl rounded-xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-slate-300 text-slate-800'
        }`}
      >
        {/* ヘッダー */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b ${
            isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-base">システム動作ログ (最大100件自動ローテート)</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
              {logs.length} / 100 件
            </span>
          </div>
          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <button
                onClick={() => logger.clearLogs()}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="全ログ消去"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ログ消去
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ログ一覧コンテンツ */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              記録されたログはありません。
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`p-2.5 rounded border flex items-start gap-2.5 transition-colors ${
                  log.level === 'error'
                    ? isDark ? 'bg-rose-950/20 border-rose-800/50 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
                    : log.level === 'warn'
                    ? isDark ? 'bg-amber-950/20 border-amber-800/50 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                    : isDark ? 'bg-slate-950/40 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <span className="shrink-0 mt-0.5">
                  {log.level === 'error' && <XCircle className="w-4 h-4 text-rose-400" />}
                  {log.level === 'warn' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                  {log.level === 'info' && <Info className="w-4 h-4 text-cyan-400" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[11px] opacity-75">{log.timestamp}</span>
                    <span
                      className={`uppercase text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        log.level === 'error'
                          ? 'bg-rose-500/20 text-rose-300'
                          : log.level === 'warn'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-cyan-500/20 text-cyan-300'
                      }`}
                    >
                      {log.level}
                    </span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap break-words">{log.message}</p>
                  {log.details && (
                    <p className="mt-1 text-[11px] opacity-70 border-t border-current/10 pt-1">
                      {log.details}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* フッター注釈 */}
        <div
          className={`px-5 py-2.5 text-[11px] border-t flex justify-between items-center ${
            isDark ? 'border-slate-800 bg-slate-950/50 text-slate-400' : 'border-slate-200 bg-slate-100 text-slate-500'
          }`}
        >
          <span>※ ローカルファイルは自動保存され、リモートファイルは自動保存をスキップします。</span>
          <span>最大100件で自動ローテーション</span>
        </div>
      </div>
    </div>
  );
};
