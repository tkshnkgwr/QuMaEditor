import React, { useState } from 'react';
import { TextStats, EditorSettings, SupportedEncoding, SaveStatus } from '../types';
import { ZoomIn, ZoomOut, HardDrive, FileText, Clock, Check, Save, Globe, FolderOpen, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { openFolderNative, ProofreadingIssue } from '../utils/tauriNative';

interface StatusBarProps {
  stats: TextStats;
  cursorLine: number;
  cursorCol: number;
  settings: EditorSettings;
  onUpdateSettings: (newSettings: Partial<EditorSettings>) => void;
  saveStatus: SaveStatus;
  lastSavedTime?: string | null;
  filePath?: string;
  isRemote?: boolean;
  updatedAt?: string;
  encoding?: SupportedEncoding;
  onChangeEncoding?: (encoding: SupportedEncoding) => void;
  onOpenStatsModal?: () => void;
  onSaveFile?: (options?: { forceSaveAs?: boolean }) => void;
  proofreadingIssues?: ProofreadingIssue[];
  isDark?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  stats,
  cursorLine,
  cursorCol,
  settings,
  onUpdateSettings,
  saveStatus,
  lastSavedTime,
  filePath,
  isRemote = false,
  updatedAt,
  encoding = 'UTF-8',
  onChangeEncoding,
  onOpenStatsModal,
  onSaveFile,
  proofreadingIssues,
  isDark = true,
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

  const [showIssues, setShowIssues] = useState<boolean>(false);
  const formattedTime = formatUpdatedAt(updatedAt);
  const issues = proofreadingIssues || [];

  return (
    <footer className={`relative h-7 border-t px-3 text-[11px] select-none flex items-center justify-between shrink-0 z-20 font-sans transition-colors print:hidden ${
      isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
    }`}>
      {/* 校正指摘フライアウトパネル */}
      {showIssues && (
        <div
          className={`absolute bottom-8 left-3 w-80 max-h-64 rounded-lg border shadow-xl flex flex-col overflow-hidden z-50 transition-colors ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
          }`}
        >
          <div className={`p-2 border-b flex items-center justify-between font-semibold text-xs ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              日本語校正 ＆ 記法 Lint 指摘 ({issues.length}件)
            </span>
            <button
              onClick={() => setShowIssues(false)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 text-[11px]">
            {issues.length === 0 ? (
              <div className="py-4 text-center text-emerald-400 flex flex-col items-center gap-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>校正上の問題は検出されませんでした</span>
              </div>
            ) : (
              issues.map((iss, idx) => (
                <div
                  key={idx}
                  className={`p-1.5 rounded border text-[10.5px] leading-tight space-y-0.5 ${
                    iss.severity === 'error'
                      ? isDark ? 'bg-rose-950/30 border-rose-800/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
                      : isDark ? 'bg-amber-950/30 border-amber-800/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[10px] opacity-75">
                    <span>行 {iss.line_number}, 列 {iss.column}</span>
                    <span className="uppercase text-[9px] px-1 rounded bg-black/20 font-bold">{iss.severity}</span>
                  </div>
                  <div>{iss.message}</div>
                  {iss.suggestion && (
                    <div className="text-[10px] text-cyan-400 font-mono">
                      💡 推奨: {iss.suggestion}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 左側情報: 行/列、校正、ドキュメント統計・更新日時 */}
      <div className="flex items-center gap-3">
        <span className="font-mono">
          行 <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{cursorLine}</strong>, 列 <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{cursorCol}</strong>
        </span>

        {/* 日本語校正インジケーター */}
        <button
          type="button"
          onClick={() => setShowIssues((prev) => !prev)}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer border ${
            issues.length === 0
              ? isDark
                ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/40 hover:bg-emerald-900/40'
                : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
              : isDark
                ? 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/60'
                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
          }`}
          title="Rust バックグラウンド校正 & Lint の検出結果を表示"
        >
          {issues.length === 0 ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>校正 OK</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>校正 {issues.length}件</span>
            </>
          )}
        </button>

        <span className={`${isDark ? 'text-slate-700' : 'text-slate-300'} hidden sm:inline`}>|</span>

        {/* 統計クリックで詳細統計ダッシュボードを開く */}
        <button
          type="button"
          onClick={onOpenStatsModal}
          title="クリックしてドキュメント詳細統計ダッシュボードを表示"
          className={`flex items-center gap-2 px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
            isDark ? 'hover:bg-slate-800 hover:text-cyan-300' : 'hover:bg-slate-200 hover:text-cyan-800'
          }`}
        >
          <span className="hidden sm:inline">
            文字数: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{stats.characters.toLocaleString()}</strong>
          </span>
          <span className="hidden md:inline">
            単語数: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{stats.words.toLocaleString()}</strong>
          </span>
          <span className="hidden md:inline">
            行数: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{stats.lines.toLocaleString()}</strong>
          </span>
          <span className="hidden lg:flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-500" />
            <span>読了目安: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{stats.readingTimeMinutes}分</strong></span>
          </span>
        </button>

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

      {/* 右側情報: 文字エンコーディング、改行コード、ストレージ、ズーム */}
      <div className="flex items-center gap-3">
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

        {/* 保存ステータスバッジ */}
        <div className="flex items-center gap-1">
          {isRemote ? (
            <span className="text-indigo-400 flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-medium text-[10px]">
              <Globe className="w-3 h-3 text-indigo-400" />
              <span>リモート</span>
            </span>
          ) : (
            <>
              {saveStatus === 'editing' && (
                <span className="text-cyan-400 flex items-center gap-1 bg-cyan-400/10 px-1.5 py-0.5 rounded border border-cyan-400/20 font-medium text-[10px] animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  <span>編集中...</span>
                </span>
              )}
              {saveStatus === 'saving' && (
                <span className="text-amber-400 flex items-center gap-1 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                  <span>保存中...</span>
                </span>
              )}
              {saveStatus === 'saved_file' && (
                <span className="text-emerald-400 flex items-center gap-1 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30 font-medium text-[10px]" title="PC上の実ファイル(.md)に保存済み">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>実ファイル保存 {lastSavedTime ? `(${lastSavedTime})` : ''}</span>
                </span>
              )}
              {saveStatus === 'saved_local' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-sky-400 flex items-center gap-1 bg-sky-500/15 px-1.5 py-0.5 rounded border border-sky-500/30 font-medium text-[10px]" title="アプリ内部(LocalStorage)に保護保存済み">
                    <Check className="w-3 h-3 text-sky-400" />
                    <span>アプリ内保存 {lastSavedTime ? `(${lastSavedTime})` : ''}</span>
                  </span>
                  {!filePath && onSaveFile && (
                    <button
                      type="button"
                      onClick={() => onSaveFile({ forceSaveAs: true })}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold transition-all cursor-pointer ${
                        isDark
                          ? 'bg-cyan-950/70 border-cyan-600/80 text-cyan-300 hover:bg-cyan-900 hover:text-cyan-100 shadow-xs'
                          : 'bg-cyan-50 border-cyan-300 text-cyan-800 hover:bg-cyan-100 shadow-xs'
                      }`}
                      title="LocalStorageで作成中のドキュメントをPC上の実ファイル(.md)として保存します"
                    >
                      <Save className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span>PCファイルに保存</span>
                    </button>
                  )}
                </div>
              )}
              {saveStatus === 'saved' && (
                <span className="text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 text-[10px]">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>保存完了</span>
                </span>
              )}
              {saveStatus === 'unsaved' && (
                <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${isDark ? 'text-slate-400 bg-slate-800' : 'text-slate-500 bg-slate-200'}`}>
                  <Save className="w-3 h-3" />
                  <span>未保存</span>
                </span>
              )}
            </>
          )}

          {/* 実ファイル時の「フォルダを開く」ボタン */}
          {filePath && (
            <button
              onClick={async () => {
                await openFolderNative(filePath);
              }}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium transition-colors cursor-pointer ${
                isDark
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60 hover:text-emerald-200'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
              }`}
              title={`エクスプローラーで保存先フォルダを開く:\n${filePath}`}
            >
              <FolderOpen className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="hidden xl:inline">フォルダ</span>
            </button>
          )}
        </div>

        <span className={`${isDark ? 'text-slate-700' : 'text-slate-300'} hidden sm:inline`}>|</span>

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
