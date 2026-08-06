import React from 'react';
import { X, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import packageJson from '../../package.json';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, isDark = true }) => {
  if (!isOpen) return null;

  const version = packageJson.version;

  return (
    <div className={`fixed inset-0 z-50 backdrop-blur-xs flex items-center justify-center p-4 select-none transition-colors ${
      isDark ? 'bg-black/60' : 'bg-slate-900/30'
    }`}>
      <div
        className={`rounded-xl border shadow-2xl w-full max-w-sm overflow-hidden transition-colors ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* モーダルヘッダー */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between ${
            isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`font-semibold text-sm leading-none ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                QuMaEditor
              </h2>
              <span className={`text-[11px] font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-700 font-semibold'}`}>
                Markdown Editor
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* モーダルコンテンツ: バージョンと正常稼働表示のみ */}
        <div className="p-6 space-y-4 text-xs">
          {/* バージョンカード */}
          <div
            className={`p-4 rounded-xl border text-center space-y-1 ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-cyan-50/60 border-cyan-200'
            }`}
          >
            <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
              現在のバージョン
            </div>
            <div className={`text-2xl font-bold font-mono ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`}>
              v{version}
            </div>
          </div>

          {/* 稼働ステータス */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <span className="flex items-center gap-2 font-medium text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              正常動作中 (Tauri v2 + Rust)
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              Active
            </span>
          </div>

          {/* 万が一正常に動作しない場合の対処法 */}
          <div
            className={`p-3 rounded-xl border space-y-1.5 ${
              isDark ? 'bg-slate-950/60 border-slate-800/80 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className={`font-semibold flex items-center gap-1.5 text-[11px] ${
              isDark ? 'text-amber-400' : 'text-amber-700'
            }`}>
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              万が一正常に動作しない場合
            </div>
            <ul className="text-[10px] space-y-1 pl-4 list-disc leading-relaxed">
              <li><strong>アプリの再起動</strong>: 一度アプリを閉じて再起動をお試しください。</li>
              <li><strong>キャッシュ整理</strong>: 「設定」画面 ➔ 「一時キャッシュを整理」を実行。</li>
              <li><strong>動作ログ確認</strong>: 「ヘルプ」 ➔ 「動作ログ表示」からログを確認できます。</li>
            </ul>
          </div>
        </div>

        {/* モーダルフッター */}
        <div
          className={`px-5 py-3 border-t flex justify-end ${
            isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
