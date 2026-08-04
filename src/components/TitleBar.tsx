import React, { useState, useRef, useEffect } from 'react';
import packageJson from '../../package.json';
import {
  FileText,
  PanelLeft,
  Save,
  Download,
  Plus,
  Copy,
  Printer,
  Sparkles,
  Settings,
  ChevronDown,
  Check,
  Minimize2,
  Maximize2,
  X,
  FileCode,
  FolderOpen,
  Info,
  Keyboard,
  HelpCircle,
  Sun,
  Moon,
  Monitor,
  GitCompare,
  ScrollText,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { MarkdownDoc, ViewMode, ThemeMode, SaveStatus } from '../types';
import { detectLineEnding } from '../utils/encodingUtils';

// Tauri Window API Helper
const handleWindowMinimize = async () => {
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().minimize();
  } catch (e) {
    console.log('Not in Tauri environment:', e);
  }
};

const handleWindowMaximize = async () => {
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().toggleMaximize();
  } catch (e) {
    console.log('Not in Tauri environment:', e);
  }
};

const handleWindowClose = async () => {
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().close();
  } catch (e) {
    console.log('Not in Tauri environment:', e);
  }
};

interface TitleBarProps {
  currentDoc: MarkdownDoc;
  onUpdateTitle: (newTitle: string) => void;
  saveStatus: SaveStatus;
  lastSavedTime: string | null;
  onNewDoc: () => void;
  onOpenLocalFile: () => void;
  onDuplicateDoc: () => void;
  onExportMarkdown: () => void;
  onExportHtml: () => void;
  onExportPdfDirect?: () => void;
  onPrint: () => void;
  onOpenTemplates: () => void;
  onOpenSettings: () => void;
  onOpenAbout?: () => void;
  onOpenShortcuts?: () => void;
  onOpenDiffModal?: () => void;
  onOpenLogModal?: () => void;
  onOpenBatchConvert?: () => void;
  isZenMode?: boolean;
  onToggleZenMode?: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  theme: ThemeMode;
  onChangeTheme: (theme: ThemeMode) => void;
  isDark: boolean;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  currentDoc,
  onUpdateTitle,
  saveStatus,
  lastSavedTime,
  onNewDoc,
  onOpenLocalFile,
  onDuplicateDoc,
  onExportMarkdown,
  onExportHtml,
  onExportPdfDirect,
  onPrint,
  onOpenTemplates,
  onOpenSettings,
  onOpenAbout,
  onOpenShortcuts,
  onOpenDiffModal,
  onOpenLogModal,
  onOpenBatchConvert,
  isZenMode,
  onToggleZenMode,
  isSidebarOpen,
  onToggleSidebar,
  viewMode,
  onChangeViewMode,
  theme,
  onChangeTheme,
  isDark,
}) => {

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(currentDoc.title);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitleInput(currentDoc.title);
  }, [currentDoc.title]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim()) {
      onUpdateTitle(titleInput.trim());
    } else {
      setTitleInput(currentDoc.title);
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'dark':
        return <Moon className="w-4 h-4 text-cyan-400" />;
      case 'system':
        return <Monitor className="w-4 h-4 text-blue-400" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'ライト';
      case 'dark':
        return 'ダーク';
      case 'system':
        return 'システム';
    }
  };

  return (
    <header className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'} border-b select-none flex flex-col z-30 shrink-0 transition-colors print:hidden`}>
      {/* 上部ウィンドウバー (data-tauri-drag-region によりドラッグ移動可能) */}
      <div
        data-tauri-drag-region
        className={`h-10 px-3 flex items-center justify-between gap-2 border-b ${isDark ? 'border-slate-800/60' : 'border-slate-200/80'} text-xs cursor-default`}
      >
        {/* 左側: アプリロゴ・サイドバー切替・ドキュメントタイトル (インタラクティブ領域は pointer-events-auto) */}
        <div className="flex items-center gap-2 min-w-0 pointer-events-auto" data-tauri-drag-region="false">
          <button
            onClick={onToggleSidebar}
            title={isSidebarOpen ? 'サイドバーを閉じる' : 'サイドバーを開く'}
            className={`p-1.5 rounded transition-colors ${
              isSidebarOpen
                ? isDark ? 'bg-slate-800 text-cyan-400' : 'bg-slate-200 text-cyan-600 font-medium'
                : isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          {/* アプリブランドアイコン */}
          <div className="flex items-center gap-1.5 font-semibold shrink-0">
            <div className="w-5 h-5 rounded bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-sm">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <span className={`hidden sm:inline tracking-tight font-sans ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>QuMaEditor</span>
          </div>

          <span className={`${isDark ? 'text-slate-600' : 'text-slate-400'} hidden sm:inline`}>•</span>

          {/* ドキュメントタイトル (編集可能) */}
          <div className="flex items-center gap-1.5 truncate max-w-xs md:max-w-md">
            {isEditingTitle ? (
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                autoFocus
                className={`border text-xs px-2 py-0.5 rounded focus:outline-none w-full ${
                  isDark
                    ? 'bg-slate-950 border-cyan-500 text-slate-100'
                    : 'bg-white border-cyan-600 text-slate-900'
                }`}
              />
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className={`font-medium px-2 py-0.5 rounded transition-colors text-xs truncate max-w-full text-left ${
                  isDark
                    ? 'text-slate-200 hover:text-cyan-400 hover:bg-slate-800/80'
                    : 'text-slate-800 hover:text-cyan-700 hover:bg-slate-200'
                }`}
                title="クリックしてタイトルを編集"
              >
                {currentDoc.title || '無題のドキュメント'}
              </button>
            )}
            {/* Remote File Indicator Badge */}
            {currentDoc.isRemote && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded shrink-0 border bg-indigo-500/15 border-indigo-500/30 text-indigo-400 flex items-center gap-1">
                <Globe className="w-3 h-3 text-indigo-400" />
                リモート
              </span>
            )}
            {/* Document Encoding & Line Ending Badges */}
            <div className="flex items-center gap-1 shrink-0">
              <span
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded shrink-0 border ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-amber-300'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
                title="文字コード"
              >
                {currentDoc.encoding || 'UTF-8'}
              </span>
              <span
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded shrink-0 border ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-cyan-300'
                    : 'bg-cyan-50 border-cyan-200 text-cyan-800'
                }`}
                title="改行コード (Line Ending)"
              >
                {detectLineEnding(currentDoc.content)}
              </span>
            </div>
          </div>

          <div className="ml-2 flex items-center gap-1 text-[11px] shrink-0">
            {currentDoc.isRemote ? (
              <span className="text-indigo-400 flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-medium">
                <Globe className="w-3 h-3 text-indigo-400" />
                リモート (自動保存OFF)
              </span>
            ) : (
              <>
                {saveStatus === 'editing' && (
                  <span className="text-cyan-400 flex items-center gap-1 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20 font-medium animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    編集中...
                  </span>
                )}
                {saveStatus === 'saving' && (
                  <span className="text-amber-400 flex items-center gap-1 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                    保存中...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="hidden md:inline">自動保存済み {lastSavedTime ? `(${lastSavedTime})` : ''}</span>
                  </span>
                )}
                {saveStatus === 'unsaved' && (
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded ${isDark ? 'text-slate-400 bg-slate-800' : 'text-slate-500 bg-slate-200'}`}>
                    <Save className="w-3 h-3" />
                    未保存の変更
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* 右側: ウィンドウコントロール (pointer-events-auto) */}
        <div className="flex items-center gap-1 shrink-0 pointer-events-auto">
          {/* テーマ切り替えドロップダウン */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 text-xs ${
                isDark
                  ? 'hover:bg-slate-800 text-slate-300'
                  : 'hover:bg-slate-200 text-slate-700'
              }`}
              title={`テーマ切り替え (現在: ${getThemeLabel()})`}
            >
              {getThemeIcon()}
              <span className="hidden md:inline font-medium text-[11px] ml-0.5">{getThemeLabel()}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {isThemeMenuOpen && (
              <div className={`absolute right-0 top-full mt-1 w-44 rounded-lg shadow-xl border py-1 z-50 text-xs ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-slate-200'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}>
                <div className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  表示テーマ設定
                </div>
                <button
                  onClick={() => {
                    onChangeTheme('light');
                    setIsThemeMenuOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left flex items-center justify-between ${
                    theme === 'light'
                      ? isDark ? 'bg-slate-800 text-amber-300 font-medium' : 'bg-slate-100 text-amber-700 font-medium'
                      : isDark ? 'hover:bg-slate-800/80 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    ライトモード
                  </span>
                  {theme === 'light' && <Check className="w-3.5 h-3.5 text-amber-500" />}
                </button>
                <button
                  onClick={() => {
                    onChangeTheme('dark');
                    setIsThemeMenuOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left flex items-center justify-between ${
                    theme === 'dark'
                      ? isDark ? 'bg-slate-800 text-cyan-300 font-medium' : 'bg-slate-100 text-cyan-700 font-medium'
                      : isDark ? 'hover:bg-slate-800/80 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Moon className="w-3.5 h-3.5 text-cyan-400" />
                    ダークモード
                  </span>
                  {theme === 'dark' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
                <button
                  onClick={() => {
                    onChangeTheme('system');
                    setIsThemeMenuOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left flex items-center justify-between ${
                    theme === 'system'
                      ? isDark ? 'bg-slate-800 text-blue-300 font-medium' : 'bg-slate-100 text-blue-700 font-medium'
                      : isDark ? 'hover:bg-slate-800/80 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Monitor className="w-3.5 h-3.5 text-blue-400" />
                    システムに合わせる
                  </span>
                  {theme === 'system' && <Check className="w-3.5 h-3.5 text-blue-500" />}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onOpenAbout}
            className={`p-1.5 rounded transition-colors flex items-center gap-1 text-xs ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-cyan-300' : 'hover:bg-slate-200 text-slate-600 hover:text-cyan-700'
            }`}
            title="バージョン情報"
          >
            <Info className="w-4 h-4 text-cyan-500" />
            <span className="hidden md:inline font-mono text-[11px] text-cyan-500">v{packageJson.version}</span>
          </button>

          <button
            onClick={onOpenSettings}
            className={`p-1.5 rounded transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="設定"
          >
            <Settings className="w-4 h-4" />
          </button>

          <div className={`h-4 w-px my-auto mx-1 ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`}></div>

          {/* Windowsスタイルのネイティブウィンドウボタン (Tauri Window API 連携) */}
          <button
            onClick={handleWindowMinimize}
            className={`p-1.5 rounded transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'}`}
            title="最小化"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleWindowMaximize}
            className={`p-1.5 rounded transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'}`}
            title="最大化 / 元に戻す"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleWindowClose}
            className="p-1.5 hover:bg-rose-600 text-slate-400 hover:text-white rounded transition-colors"
            title="閉じる"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* メニューバー / コマンドリボン */}
      <div className={`h-9 px-3 flex items-center justify-between gap-2 text-xs ${isDark ? 'bg-slate-900/90' : 'bg-slate-100'}`} ref={menuRef}>
        {/* ドロップダウンメニュー */}
        <div className="flex items-center gap-1">
          {/* ファイルメニュー */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                activeMenu === 'file'
                  ? isDark ? 'bg-slate-800 text-cyan-400' : 'bg-slate-200 text-cyan-700 font-medium'
                  : isDark ? 'hover:bg-slate-800/80 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
              }`}
            >
              ファイル <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {activeMenu === 'file' && (
              <div className={`absolute top-full left-0 mt-1 w-56 rounded-md shadow-2xl py-1 z-50 border ${
                isDark ? 'bg-slate-900 border-slate-700/80 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                <button
                  onClick={() => {
                    onNewDoc();
                    setActiveMenu(null);
                  }}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-500" />
                  新規ドキュメント
                </button>
                <button
                  onClick={() => {
                    onOpenLocalFile();
                    setActiveMenu(null);
                  }}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                >
                  <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                  ファイルを開く (PC/ファイルサーバー)
                </button>
                <button
                  onClick={() => {
                    onDuplicateDoc();
                    setActiveMenu(null);
                  }}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                >
                  <Copy className="w-3.5 h-3.5 text-blue-500" />
                  複製を作成
                </button>
                {onOpenDiffModal && (
                  <button
                    onClick={() => {
                      onOpenDiffModal();
                      setActiveMenu(null);
                    }}
                    className={`w-full px-3 py-1.5 text-left flex items-center gap-2 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                  >
                    <GitCompare className="w-3.5 h-3.5 text-cyan-500" />
                    タブ差分を比較...
                  </button>
                )}
                {onOpenBatchConvert && (
                  <button
                    onClick={() => {
                      onOpenBatchConvert();
                      setActiveMenu(null);
                    }}
                    className={`w-full px-3 py-1.5 text-left flex items-center gap-2 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                    一括文字コード変換 (Rust並列)...
                  </button>
                )}
                <div className={`my-1 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}></div>
                <button
                  onClick={() => {
                    onExportMarkdown();
                    setActiveMenu(null);
                  }}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                >
                  <Download className="w-3.5 h-3.5 text-emerald-500" />
                  Markdown (.md) として出力
                </button>
                <button
                  onClick={() => {
                    onExportHtml();
                    setActiveMenu(null);
                  }}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                >
                  <FileCode className="w-3.5 h-3.5 text-purple-500" />
                  HTML ファイルとして出力
                </button>
                {onExportPdfDirect && (
                  <button
                    onClick={() => {
                      onExportPdfDirect();
                      setActiveMenu(null);
                    }}
                    className={`w-full px-3 py-1.5 text-left flex items-center gap-2 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                  >
                    <Download className="w-3.5 h-3.5 text-rose-500" />
                    PDFとして直接保存 (Rustネイティブ生成)
                  </button>
                )}
                <button
                  onClick={() => {
                    onPrint();
                    setActiveMenu(null);
                  }}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                >
                  <Printer className="w-3.5 h-3.5 text-amber-500" />
                  印刷 / ブラウザPDFダイアログ
                </button>
              </div>
            )}
          </div>

          {/* テンプレートメニュー */}
          <button
            onClick={onOpenTemplates}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
              isDark ? 'hover:bg-slate-800/80 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            テンプレート
          </button>

          {/* ヘルプメニュー */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                activeMenu === 'help'
                  ? isDark ? 'bg-slate-800 text-cyan-400' : 'bg-slate-200 text-cyan-700 font-medium'
                  : isDark ? 'hover:bg-slate-800/80 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-500" />
              ヘルプ <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {activeMenu === 'help' && (
              <div className={`absolute top-full left-0 mt-1 w-52 rounded-md shadow-2xl py-1 z-50 border ${
                isDark ? 'bg-slate-900 border-slate-700/80 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                <button
                  onClick={() => {
                    onOpenShortcuts?.();
                    setActiveMenu(null);
                  }}
                  className={`w-full px-3 py-1.5 text-left flex items-center justify-between ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                >
                  <span className="flex items-center gap-2">
                    <Keyboard className="w-3.5 h-3.5 text-cyan-500" />
                    キーボードショートカット
                  </span>
                  <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                    isDark ? 'bg-slate-800 text-cyan-300 border-slate-700' : 'bg-slate-100 text-cyan-700 border-slate-300'
                  }`}>F1</kbd>
                </button>
                {onOpenLogModal && (
                  <button
                    onClick={() => {
                      onOpenLogModal();
                      setActiveMenu(null);
                    }}
                    className={`w-full px-3 py-1.5 text-left flex items-center gap-2 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                  >
                    <ScrollText className="w-3.5 h-3.5 text-emerald-500" />
                    動作ログ表示 (最大100件)
                  </button>
                )}
                <div className={`my-1 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}></div>
                <button
                  onClick={() => {
                    onOpenAbout?.();
                    setActiveMenu(null);
                  }}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                >
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  バージョン情報
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 表示モード切替 */}
        <div className={`flex items-center gap-0.5 p-0.5 rounded border ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-200 border-slate-300'
        }`}>
          <button
            onClick={() => onChangeViewMode('split')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              viewMode === 'split'
                ? 'bg-cyan-600 text-white shadow'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            分割表示
          </button>
          <button
            onClick={() => onChangeViewMode('editor')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              viewMode === 'editor'
                ? 'bg-cyan-600 text-white shadow'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            編集のみ
          </button>
          <button
            onClick={() => onChangeViewMode('preview')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              viewMode === 'preview'
                ? 'bg-cyan-600 text-white shadow'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            プレビューのみ
          </button>
        </div>

        {/* Zen集中モード切替 */}
        {onToggleZenMode && (
          <button
            onClick={onToggleZenMode}
            className={`px-2.5 py-1 rounded border text-[11px] font-medium transition-all flex items-center gap-1.5 ${
              isZenMode
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm'
                : isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-cyan-400'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-cyan-700 shadow-2xs'
            }`}
            title="Zen集中執筆モードに切り替え (Ctrl+Shift+Z)"
          >
            {isZenMode ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />}
            <span className="hidden sm:inline">Zenモード</span>
          </button>
        )}
      </div>
    </header>
  );
};
