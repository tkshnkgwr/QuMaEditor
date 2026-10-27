import React from 'react';
import { MarkdownDoc, ViewMode, EditorSettings } from '../types';
import { Editor } from './Editor';
import { Preview } from './Preview';
import { Columns2, X, FileText, CheckCircle2 } from 'lucide-react';

interface DualPaneWorkspaceProps {
  leftDoc: MarkdownDoc;
  secondaryDoc: MarkdownDoc;
  viewMode: ViewMode;
  activePane: 'left' | 'right';
  onFocusPane: (pane: 'left' | 'right') => void;
  onCloseSecondaryPane: () => void;
  onUpdateContent: (content: string, targetDocId: string) => void;
  settings: EditorSettings;
  isDark: boolean;
  onCursorChange: (line: number, col: number) => void;
  onScrollSync?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  onImageDrop?: (file: File) => void;
  onDropFiles?: (files: File[]) => void;
  onUpdateTags?: (tags: string[]) => void;
  onUpdateSummary?: (summary: string, summaryType?: string, targetDocId?: string) => void;
  onLeftTextareaRef?: (el: HTMLTextAreaElement | null) => void;
  onRightTextareaRef?: (el: HTMLTextAreaElement | null) => void;
  onLoadFullDoc?: (doc: MarkdownDoc) => void;
  onLoadMoreChunk?: (doc: MarkdownDoc) => void;
  onToggleTaskItem?: (taskIndex: number) => void;
}

export const DualPaneWorkspace: React.FC<DualPaneWorkspaceProps> = ({
  leftDoc,
  secondaryDoc,
  viewMode,
  activePane,
  onFocusPane,
  onCloseSecondaryPane,
  onUpdateContent,
  settings,
  isDark,
  onCursorChange,
  onScrollSync,
  onImageDrop,
  onDropFiles,
  onUpdateTags,
  onUpdateSummary,
  onLeftTextareaRef,
  onRightTextareaRef,
  onLoadFullDoc,
  onLoadMoreChunk,
  onToggleTaskItem,
}) => {
  const isPreviewMode = viewMode === 'preview';

  const [splitRatio, setSplitRatio] = React.useState<number>(() => {
    try {
      const saved = localStorage.getItem('quma_dual_pane_split_ratio');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 20 && val <= 80) return val;
      }
    } catch {}
    return 50;
  });
  const [isResizing, setIsResizing] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleSplitterMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleSplitterDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setSplitRatio(50);
    try {
      localStorage.setItem('quma_dual_pane_split_ratio', '50');
    } catch {}
  };

  React.useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const offsetX = e.clientX - rect.left;
      const rawPercent = (offsetX / rect.width) * 100;
      const clamped = Math.min(80, Math.max(20, rawPercent));
      setSplitRatio(clamped);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      try {
        localStorage.setItem('quma_dual_pane_split_ratio', splitRatio.toString());
      } catch {}
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, splitRatio]);

  return (
    <div ref={containerRef} className="flex-1 flex min-h-0 w-full overflow-hidden select-none">
      {/* 左ペイン */}
      <div
        onClick={() => onFocusPane('left')}
        style={{ width: `${splitRatio}%` }}
        className={`h-full flex flex-col min-w-0 transition-colors ${
          isDark
            ? activePane === 'left'
              ? 'border-cyan-500/80'
              : 'border-slate-800'
            : activePane === 'left'
            ? 'border-cyan-600'
            : 'border-slate-300'
        }`}
      >
        {/* 左ペインヘッダー */}
        <div
          className={`h-7 px-2.5 flex items-center justify-between text-xs border-b shrink-0 ${
            activePane === 'left'
              ? isDark
                ? 'bg-slate-900 border-cyan-500/60 text-cyan-300'
                : 'bg-cyan-50 border-cyan-300 text-cyan-950 font-medium'
              : isDark
              ? 'bg-slate-950 border-slate-800 text-slate-400'
              : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <FileText className={`w-3.5 h-3.5 shrink-0 ${activePane === 'left' ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span className="font-semibold text-[11px] truncate">{leftDoc.title || '無題のドキュメント'}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {activePane === 'left' && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                isDark ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800' : 'bg-cyan-100 text-cyan-800 border border-cyan-300'
              }`}>
                アクティブ
              </span>
            )}
          </div>
        </div>

        {/* 左ペイン本文 (Editor または Preview) */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          {isPreviewMode ? (
            <Preview
              key={`preview-left-${leftDoc.id}`}
              content={leftDoc.content}
              docTitle={leftDoc.title}
              onToggleTaskItem={onToggleTaskItem}
              isDark={isDark}
              fontSize={settings.fontSize}
              lineHeight={settings.lineHeight}
              fontFamily={settings.fontFamily}
              headingTheme={settings.headingTheme}
              codeBlockTheme={settings.codeBlockTheme}
              previewEngine={settings.previewEngine}
            />
          ) : (
            <Editor
              content={leftDoc.content}
              onChange={(newContent) => onUpdateContent(newContent, leftDoc.id)}
              settings={settings}
              onCursorChange={activePane === 'left' ? onCursorChange : undefined}
              onScrollSync={onScrollSync}
              onImageDrop={onImageDrop}
              onDropFiles={onDropFiles}
              doc={leftDoc}
              onUpdateTags={onUpdateTags}
              onUpdateSummary={(summary, summaryType) => onUpdateSummary?.(summary, summaryType, leftDoc.id)}
              onTextareaRef={onLeftTextareaRef}
              isDark={isDark}
              viewMode="editor"
              onLoadFullDoc={onLoadFullDoc ? () => onLoadFullDoc(leftDoc) : undefined}
              onLoadMoreChunk={onLoadMoreChunk ? () => onLoadMoreChunk(leftDoc) : undefined}
            />
          )}
        </div>
      </div>

      {/* スプリッター (幅リサイズバー) */}
      <div
        onMouseDown={handleSplitterMouseDown}
        onDoubleClick={handleSplitterDoubleClick}
        title="ドラッグして左右ペイン幅を変更 / ダブルクリックで50:50にリセット"
        className={`relative w-1.5 hover:w-2 shrink-0 cursor-col-resize z-20 flex items-center justify-center transition-all group select-none ${
          isResizing
            ? 'bg-cyan-500 shadow-md'
            : isDark
            ? 'bg-slate-800 hover:bg-cyan-500/80 border-x border-slate-700/50'
            : 'bg-slate-200 hover:bg-cyan-500 border-x border-slate-300'
        }`}
      >
        <div
          className={`w-0.5 h-6 rounded-full transition-colors ${
            isResizing ? 'bg-white' : isDark ? 'bg-slate-600 group-hover:bg-white' : 'bg-slate-400 group-hover:bg-white'
          }`}
        />
      </div>

      {/* 右ペイン */}
      <div
        onClick={() => onFocusPane('right')}
        style={{ width: `${100 - splitRatio}%` }}
        className={`h-full flex flex-col min-w-0 transition-colors ${
          isDark
            ? activePane === 'right'
              ? 'bg-slate-950/40'
              : 'bg-transparent'
            : activePane === 'right'
            ? 'bg-cyan-50/20'
            : 'bg-transparent'
        }`}
      >
        {/* 右ペインヘッダー */}
        <div
          className={`h-7 px-2.5 flex items-center justify-between text-xs border-b shrink-0 ${
            activePane === 'right'
              ? isDark
                ? 'bg-slate-900 border-cyan-500/60 text-cyan-300'
                : 'bg-cyan-50 border-cyan-300 text-cyan-950 font-medium'
              : isDark
              ? 'bg-slate-950 border-slate-800 text-slate-400'
              : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Columns2 className={`w-3.5 h-3.5 shrink-0 ${activePane === 'right' ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span className="font-semibold text-[11px] truncate">{secondaryDoc.title || '無題のドキュメント'}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {activePane === 'right' && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                isDark ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800' : 'bg-cyan-100 text-cyan-800 border border-cyan-300'
              }`}>
                アクティブ
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseSecondaryPane();
              }}
              className={`p-0.5 rounded transition-colors ${
                isDark
                  ? 'hover:bg-rose-500/20 text-slate-400 hover:text-rose-400'
                  : 'hover:bg-rose-100 text-slate-500 hover:text-rose-600'
              }`}
              title="並べて表示を解除 (1画面に戻す)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 右ペイン本文 (Editor または Preview) */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          {isPreviewMode ? (
            <Preview
              key={`preview-right-${secondaryDoc.id}`}
              content={secondaryDoc.content}
              docTitle={secondaryDoc.title}
              onToggleTaskItem={onToggleTaskItem}
              isDark={isDark}
              fontSize={settings.fontSize}
              lineHeight={settings.lineHeight}
              fontFamily={settings.fontFamily}
              headingTheme={settings.headingTheme}
              codeBlockTheme={settings.codeBlockTheme}
              previewEngine={settings.previewEngine}
            />
          ) : (
            <Editor
              content={secondaryDoc.content}
              onChange={(newContent) => onUpdateContent(newContent, secondaryDoc.id)}
              settings={settings}
              onCursorChange={activePane === 'right' ? onCursorChange : undefined}
              onScrollSync={onScrollSync}
              onImageDrop={onImageDrop}
              onDropFiles={onDropFiles}
              doc={secondaryDoc}
              onUpdateTags={onUpdateTags}
              onUpdateSummary={(summary, summaryType) => onUpdateSummary?.(summary, summaryType, secondaryDoc.id)}
              onTextareaRef={onRightTextareaRef}
              isDark={isDark}
              viewMode="editor"
              onLoadFullDoc={onLoadFullDoc ? () => onLoadFullDoc(secondaryDoc) : undefined}
              onLoadMoreChunk={onLoadMoreChunk ? () => onLoadMoreChunk(secondaryDoc) : undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
};
