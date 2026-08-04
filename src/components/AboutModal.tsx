import React from 'react';
import { X, Info, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

import packageJson from '../../package.json';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, isDark = true }) => {
  if (!isOpen) return null;

  const version = packageJson.version;
  const releaseDate = '2026年8月';

  const features = [
    {
      title: 'Tauri v2 ネイティブ Desktop アプリ',
      description: 'Rust バックエンドによる超爆速・超軽量 (RAM ~35MB) アーキテクチャ構築。',
    },
    {
      title: 'Rust ネイティブ爆速全文検索 & 並列エンコード',
      description: '転置インデックスによるリアルタイム全文検索、rayon スレッドエンジンでの複数ファイル一括文字コード変換。',
    },
    {
      title: 'キーボードショートカット確認＆ヘルプ',
      description: 'ヘルプメニューまたは F1 キーで即座にショートカット一覧をカード確認。Ctrl+N/S/P 等の操作に対応。',
    },
    {
      title: 'Yama YAML Front Matter & タグ編集',
      description: 'YAMLフロントマターの保護・自動パース/付与。エディタ内誤消去を防止し、タグのみインタラクティブ設定。',
    },
    {
      title: '文字コード自動判別＆文字コード別改行保存',
      description: 'UTF-8, Shift_JIS, EUC-JP の Rust ネイティブ判定と、CRLF/LF 改行コード自動変換保存。',
    },
    {
      title: 'SQL＆マルチ言語構文ハイライト',
      description: 'SQLクエリをはじめ、TypeScript, Python, JSON等のリアルタイムハイライト。',
    },
  ];

  return (
    <div className={`fixed inset-0 z-50 backdrop-blur-xs flex items-center justify-center p-4 select-none transition-colors ${
      isDark ? 'bg-black/60' : 'bg-slate-900/30'
    }`}>
      <div
        className={`rounded-xl border shadow-2xl w-full max-w-md overflow-hidden transition-colors ${
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
                QuMaEditor (Markdown Editor)
              </h2>
              <span className={`text-[11px] font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-700 font-semibold'}`}>
                Version {version}
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

        {/* モーダルコンテンツ */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {/* バージョン基本情報カード */}
          <div
            className={`p-3.5 rounded-lg border flex items-center justify-between ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-cyan-50/60 border-cyan-200'
            }`}
          >
            <div>
              <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>現在のバージョン</div>
              <div className={`text-base font-bold font-mono ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`}>v{version}</div>
            </div>
            <div className="text-right">
              <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>ビルド日時</div>
              <div className={`font-mono font-medium ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{releaseDate}</div>
            </div>
          </div>

          {/* 主な機能＆仕様一覧 */}
          <div>
            <h3
              className={`font-semibold mb-2.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider ${
                isDark ? 'text-cyan-400' : 'text-cyan-700'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              主な機能仕様
            </h3>
            <div className="space-y-2">
              {features.map((feat, index) => (
                <div
                  key={index}
                  className={`p-2.5 rounded-lg border ${
                    isDark ? 'bg-slate-800/50 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`font-medium flex items-center gap-1.5 mb-0.5 ${isDark ? 'text-slate-200' : 'text-slate-900 font-semibold'}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    {feat.title}
                  </div>
                  <p className={`text-[11px] pl-5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{feat.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ステータスバッジ */}
          <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
            <span className={`flex items-center gap-1 font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              正常動作中 (Tauri v2 + Rust)
            </span>
            <span className="font-mono text-[10px]">Tauri Native</span>
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
