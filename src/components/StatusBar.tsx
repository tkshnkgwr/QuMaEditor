import React from 'react';
import { TextStats, EditorSettings, SupportedEncoding, SaveStatus } from '../types';
import { ZoomIn, ZoomOut, HardDrive, FileText } from 'lucide-react';

interface StatusBarProps {
  stats: TextStats;
  cursorLine: number;
  cursorCol: number;
  settings: EditorSettings;
  onUpdateSettings: (newSettings: Partial<EditorSettings>) => void;
  // UPDATE 2026-08-04: saveStatus の型を SaveStatus に統一
  saveStatus: SaveStatus;
  encoding?: SupportedEncoding;
  onChangeEncoding?: (encoding: SupportedEncoding) => void;
  isDark?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  stats,
  cursorLine,
  cursorCol,
  settings,
  onUpdateSettings,
  saveStatus,
  encoding = 'UTF-8',
  onChangeEncoding,
  isDark = true,
}) => {
  const handleZoom = (delta: number) => {
    const newSize = Math.max(11, Math.min(28, settings.fontSize + delta));
    onUpdateSettings({ fontSize: newSize });
  };

  // 文字コードごとのデフォルト改行コード
  const newlineType = encoding === 'Shift_JIS' ? 'CRLF' : 'LF';

  return (
    <footer className={`h-7 border-t px-3 text-[11px] select-none flex items-center justify-between shrink-0 z-20 font-sans transition-colors print:hidden ${
      isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
    }`}>
      {/* 左側情報: 行/列およびドキュメント統計 */}
      <div className="flex items-center gap-3">
        <span className={`flex items-center gap-1 font-mono ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
          行 {cursorLine}, 列 {cursorCol}
        </span>
        <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>|</span>
        <span>
          {stats.characters.toLocaleString()} 文字
          <span className={`${isDark ? 'text-slate-500' : 'text-slate-500'} hidden sm:inline`}> ({stats.words.toLocaleString()} 単語)</span>
        </span>
        <span className={`${isDark ? 'text-slate-700' : 'text-slate-300'} hidden md:inline`}>|</span>
        <span className="hidden md:inline">読了目安: 約 {stats.readingTimeMinutes} 分</span>
      </div>

      {/* 右側情報: 文字コード・改行コード・保存・ズーム */}
      <div className="flex items-center gap-2.5">
        {/* 文字コード選択 */}
        <div className={`flex items-center gap-1 border rounded px-1.5 py-0.5 ${
          isDark ? 'bg-slate-900 border-slate-800/80 text-slate-300' : 'bg-white border-slate-300 text-slate-700 shadow-sm'
        }`}>
          <FileText className="w-3 h-3 text-amber-500" />
          <select
            value={encoding}
            onChange={(e) => onChangeEncoding?.(e.target.value as SupportedEncoding)}
            className="bg-transparent outline-none text-[11px] font-mono cursor-pointer"
            title="文字コードを変更"
          >
            <option value="UTF-8" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-800'}>UTF-8</option>
            <option value="Shift_JIS" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-800'}>Shift_JIS</option>
            <option value="EUC-JP" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-800'}>EUC-JP</option>
          </select>
        </div>

        {/* 改行コードバッジ */}
        <span className={`px-1.5 py-0.5 border rounded font-mono text-[10px] ${
          isDark ? 'bg-slate-900 border-slate-800 text-cyan-400' : 'bg-white border-slate-300 text-cyan-700 shadow-sm'
        }`} title={`保存時改行コード: ${newlineType}`}>
          {newlineType}
        </span>

        <span className={`${isDark ? 'text-slate-700' : 'text-slate-300'} hidden sm:inline`}>|</span>

        <span className={`hidden sm:flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <HardDrive className="w-3 h-3 text-cyan-500" />
          <span>Local Storage</span>
        </span>

        <span className={`${isDark ? 'text-slate-700' : 'text-slate-300'} hidden sm:inline`}>|</span>

        {/* フォントサイズズーム */}
        <div className={`flex items-center gap-1 border rounded px-1.5 py-0.5 ${
          isDark ? 'bg-slate-900 border-slate-800/80' : 'bg-white border-slate-300 shadow-sm'
        }`}>
          <button
            onClick={() => handleZoom(-1)}
            className="hover:text-cyan-500 p-0.5 transition-colors"
            title="フォントサイズを縮小"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className={`font-mono px-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{settings.fontSize}px</span>
          <button
            onClick={() => handleZoom(1)}
            className="hover:text-cyan-500 p-0.5 transition-colors"
            title="フォントサイズを拡大"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>
    </footer>
  );
};
