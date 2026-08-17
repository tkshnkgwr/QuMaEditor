import React from 'react';
import { TextStats, EditorSettings, SupportedEncoding, SaveStatus } from '../types';
import { ZoomIn, ZoomOut, HardDrive, FileText, Clock } from 'lucide-react';

interface StatusBarProps {
  stats: TextStats;
  cursorLine: number;
  cursorCol: number;
  settings: EditorSettings;
  onUpdateSettings: (newSettings: Partial<EditorSettings>) => void;
  // UPDATE 2026-08-04: saveStatus の型を SaveStatus に統一
  saveStatus: SaveStatus;
  updatedAt?: string;
  encoding?: SupportedEncoding;
  onChangeEncoding?: (encoding: SupportedEncoding) => void;
  isDark?: boolean;
  isCsv?: boolean;
  isReadOnly?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  stats,
  cursorLine,
  cursorCol,
  settings,
  onUpdateSettings,
  saveStatus,
  updatedAt,
  encoding = 'UTF-8',
  onChangeEncoding,
  isDark = true,
  isCsv = false,
  isReadOnly = false,
}) => {
  const handleZoom = (delta: number) => {
    const newSize = Math.max(11, Math.min(28, settings.fontSize + delta));
    onUpdateSettings({ fontSize: newSize });
  };

  // 文字コードごとのデフォルト改行コード
  const newlineType = encoding === 'Shift_JIS' ? 'CRLF' : 'LF';

  const formatUpdatedAt = (isoString?: string) => {
    if (!isoString) return null;
    try {
      const date = new Date(isoString);
      return date.toLocaleString('ja-JP', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return null;
    }
  };

  const formattedTime = formatUpdatedAt(updatedAt);

  return (
    <footer className={`h-7 border-t px-3 text-[11px] select-none flex items-center justify-between shrink-0 z-20 font-sans transition-colors print:hidden ${
      isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
    }`}>
      {/* 左側情報: 行/列およびドキュメント統計・更新日時 */}
      <div className="flex items-center gap-3">
        <span className="font-mono">
          行 <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{cursorLine}</strong>, 列 <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{cursorCol}</strong>
        </span>

        <span className={`${isDark ? 'text-slate-700' : 'text-slate-300'} hidden sm:inline`}>|</span>

        <span className="hidden sm:inline">
          文字数: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{stats.characters.toLocaleString()}</strong>
        </span>
        {!isCsv && (
          <span className="hidden md:inline">
            単語数: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{stats.words.toLocaleString()}</strong>
          </span>
        )}
        <span className="hidden md:inline">
          行数: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{stats.lines.toLocaleString()}</strong>
        </span>
        {!isCsv && (
          <span className="hidden lg:flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-500" />
            <span>読了目安: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{stats.readingTimeMinutes}分</strong></span>
          </span>
        )}

        {formattedTime && (
          <>
            <span className={`${isDark ? 'text-slate-700' : 'text-slate-300'} hidden sm:inline`}>|</span>
            <span className="hidden sm:flex items-center gap-1 text-[10px]">
              <FileText className="w-3 h-3 text-cyan-500" />
              <span>更新: {formattedTime}</span>
            </span>
          </>
        )}
      </div>

      {/* 右側情報: CSVバッジ、文字エンコーディング、改行コード、ストレージ、ズーム */}
      <div className="flex items-center gap-3">
        {/* CSV モードバッジ */}
        {isCsv && (
          <span
            className={`px-1.5 py-0.5 border rounded font-mono text-[10px] font-bold ${
              isReadOnly
                ? isDark
                  ? 'bg-amber-950/60 border-amber-800/80 text-amber-300'
                  : 'bg-amber-100 border-amber-300 text-amber-900 shadow-sm'
                : isDark
                  ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                  : 'bg-emerald-100 border-emerald-300 text-emerald-900 shadow-sm'
            }`}
          >
            {isReadOnly ? 'CSV (ReadOnly)' : 'CSV (Edit)'}
          </span>
        )}

        {/* 文字コード選択・表示 */}
        <div className="flex items-center gap-1">
          <select
            value={encoding}
            onChange={(e) => onChangeEncoding?.(e.target.value as SupportedEncoding)}
            className={`bg-transparent border rounded px-1.5 py-0.5 text-[10px] font-mono cursor-pointer transition-colors focus:outline-none ${
              isDark ? 'border-slate-800 hover:border-slate-700 text-cyan-400' : 'border-slate-300 hover:border-slate-400 text-cyan-700 bg-white shadow-sm'
            }`}
            title="文字コードを変更して保存/再読込"
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
          <HardDrive className={`w-3 h-3 ${isCsv ? 'text-amber-500' : 'text-cyan-500'}`} />
          <span>{isCsv ? 'Memory Only' : 'Local Storage'}</span>
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
