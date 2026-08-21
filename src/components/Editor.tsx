import React, { useRef, useState, useMemo } from 'react';
import { Upload, Lock, Unlock, Tag, Plus, X, ChevronDown, ChevronRight, Edit3, Layers, Download, Zap } from 'lucide-react';
import { EditorSettings, MarkdownDoc } from '../types';
import { handleAutoListContinuation, insertFormatting, handleTabIndent } from '../utils/markdownUtils';

interface EditorProps {
  content: string;
  onChange: (newContent: string) => void;
  settings: EditorSettings;
  onCursorChange: (line: number, col: number) => void;
  onScrollSync?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  onImageDrop?: (file: File) => void;
  onDropFiles?: (files: File[]) => void;
  doc?: MarkdownDoc;
  onUpdateTags?: (newTags: string[]) => void;
  /** textareaRef を親コンポーネントへ公開するコールバック (フォーマット時の選択範囲取得に使用) */
  onTextareaRef?: (ref: HTMLTextAreaElement | null) => void;
  isDark?: boolean;
  isReadOnly?: boolean;
  onLoadFullDoc?: () => void;
  onLoadMoreChunk?: () => void;
}

// ドキュメントごとの直前カーソル位置・スクロール位置キャッシュ
const docCursorHistoryMap = new Map<string, { start: number; end: number; scrollTop: number }>();

export const Editor: React.FC<EditorProps> = ({
  content,
  onChange,
  settings,
  onCursorChange,
  onScrollSync,
  onImageDrop,
  onDropFiles,
  doc,
  onUpdateTags,
  onTextareaRef,
  isDark = true,
  isReadOnly = false,
  onLoadFullDoc,
  onLoadMoreChunk,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // textareaRef を親コンポーネントに公開 (useEffect でマウント/アンマウント時に通知)
  React.useEffect(() => {
    if (onTextareaRef) {
      onTextareaRef(textareaRef.current);
      return () => onTextareaRef(null);
    }
  }, [onTextareaRef]);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isFrontMatterOpen, setIsFrontMatterOpen] = useState(true);
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  const tags = doc?.tags || [];

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      const updated = [...tags, trimmed];
      onUpdateTags?.(updated);
    }
    setNewTagInput('');
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = tags.filter((t) => t !== tagToRemove);
    onUpdateTags?.(updated);
  };

  // 改行文字の高速カウント (ゼロアロケーション)
  const lineCount = useMemo(() => {
    if (!content) return 1;
    let count = 1;
    for (let i = 0; i < content.length; i++) {
      if (content.charCodeAt(i) === 10) {
        count++;
      }
    }
    return count;
  }, [content]);

  // 行番号文字列の単一キャッシュ (10万個のDOM要素生成を完全廃止し1要素化)
  const lineNumbersText = useMemo(() => {
    let result = '';
    for (let i = 1; i <= lineCount; i++) {
      result += i + (i === lineCount ? '' : '\n');
    }
    return result;
  }, [lineCount]);

  // カーソル・スクロール位置の保存
  const saveCursorState = () => {
    if (!textareaRef.current || !doc?.id) return;
    docCursorHistoryMap.set(doc.id, {
      start: textareaRef.current.selectionStart,
      end: textareaRef.current.selectionEnd,
      scrollTop: textareaRef.current.scrollTop,
    });
  };

  // カーソル位置の行・列番号を高速更新 (split を使わないゼロアロケーション走査)
  const updateCursorPos = () => {
    if (!textareaRef.current) return;
    saveCursorState();
    const pos = textareaRef.current.selectionStart;
    let line = 1;
    let lastLineStart = 0;
    for (let i = 0; i < pos; i++) {
      if (content.charCodeAt(i) === 10) {
        line++;
        lastLineStart = i + 1;
      }
    }
    const col = pos - lastLineStart + 1;
    onCursorChange(line, col);
  };

  // 行番号およびプレビューとのスクロール同期処理
  const handleScroll = () => {
    if (textareaRef.current) {
      saveCursorState();
      const { scrollTop, scrollHeight, clientHeight } = textareaRef.current;
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = scrollTop;
      }
      if (onScrollSync) {
        onScrollSync(scrollTop, scrollHeight, clientHeight);
      }
    }
  };

  // マウント時・ドキュメント切り替え・プレビュー復帰時のカーソル位置・フォーカス自動復元
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    if (doc?.id) {
      const history = docCursorHistoryMap.get(doc.id);
      if (history) {
        el.setSelectionRange(
          Math.min(history.start, el.value.length),
          Math.min(history.end, el.value.length)
        );
        el.scrollTop = history.scrollTop;
      }
    }

    // プレビュー復帰時等の自動フォーカス
    const timer = setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        updateCursorPos();
      }
    }, 10);

    return () => clearTimeout(timer);
  }, [doc?.id]);

  // キーバインドと特殊動作
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;

    // Ctrl + B (太字)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      const res = insertFormatting(content, start, end, 'bold');
      onChange(res.newText);
      setTimeout(() => {
        textareaRef.current?.setSelectionRange(res.newCursorStart, res.newCursorEnd);
      }, 0);
      return;
    }

    // Ctrl + I (斜体)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      const res = insertFormatting(content, start, end, 'italic');
      onChange(res.newText);
      setTimeout(() => {
        textareaRef.current?.setSelectionRange(res.newCursorStart, res.newCursorEnd);
      }, 0);
      return;
    }

    // Tab / Shift + Tab (インデント・階層ネスト・アンインデント)
    if (e.key === 'Tab') {
      e.preventDefault();
      const tabSize = settings.tabSize || 2;
      const res = handleTabIndent(content, start, end, e.shiftKey, tabSize);
      onChange(res.newText);
      setTimeout(() => {
        textareaRef.current?.setSelectionRange(res.newCursorStart, res.newCursorEnd);
        updateCursorPos();
      }, 0);
      return;
    }

    // Enterキーでのリスト自動継続
    if (e.key === 'Enter') {
      const continuation = handleAutoListContinuation(content, start);
      if (continuation.handled) {
        e.preventDefault();
        onChange(continuation.newText);
        setTimeout(() => {
          textareaRef.current?.setSelectionRange(continuation.newCursor, continuation.newCursor);
        }, 0);
        return;
      }
    }
  };

  // 画像のドラッグ＆ドロップ処理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const fileList = Array.from(files);
      if (onDropFiles) {
        onDropFiles(fileList);
      } else if (onImageDrop) {
        const firstImage = fileList.find((f) => f.type.startsWith('image/'));
        if (firstImage) {
          onImageDrop(firstImage);
        }
      }
    }
  };

  const getFontFamilyCss = (ff?: string) => {
    switch (ff) {
      case 'sans-serif':
        return '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hiragino Sans", "Meiryo", sans-serif';
      case 'serif':
        return '"Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", serif';
      case 'monospace':
      default:
        return '"JetBrains Mono", "Cascadia Code", "Consolas", "Courier New", monospace';
    }
  };

  const effectiveLineHeight = settings.lineHeight || 1.625;
  const effectiveFontFamily = getFontFamilyCss(settings.fontFamily);
  const effectiveTabSize = settings.tabSize || 2;

  return (
    <div
      className={`relative flex-1 flex flex-col h-full overflow-hidden transition-colors print:hidden ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ドラッグ＆ドロップ時のビジュアルオーバーレイ */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-cyan-950/90 border-2 border-dashed border-cyan-400 rounded-lg flex flex-col items-center justify-center text-cyan-200 backdrop-blur-sm transition-all pointer-events-none">
          <div className="p-4 bg-cyan-900/60 rounded-full mb-3 shadow-lg animate-bounce">
            <Upload className="w-10 h-10 text-cyan-300" />
          </div>
          <p className="text-lg font-semibold tracking-wide">ファイルや画像をここにドロップ</p>
          <p className="text-xs text-cyan-400 mt-1">📄 テキストファイル：新しいタブで開きます ／ 🖼️ 画像ファイル：カーソル位置に挿入されます</p>
        </div>
      )}

      {/* Front Matter 設定アコーディオンパネル */}
      <div className={`border-b select-none transition-colors ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <button
          onClick={() => setIsFrontMatterOpen(!isFrontMatterOpen)}
          className={`w-full px-4 py-1.5 flex items-center justify-between text-xs font-medium transition-colors ${
            isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="flex items-center gap-1.5">
            {isFrontMatterOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <span>ドキュメント属性 (Front Matter / メタデータ)</span>
            {tags.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isDark ? 'bg-slate-800 text-cyan-400' : 'bg-slate-200 text-cyan-700'}`}>
                {tags.length} tags
              </span>
            )}
          </span>
          <span className="text-[10px] opacity-60">クリックで開閉</span>
        </button>

        {isFrontMatterOpen && (
          <div className="px-4 py-2 space-y-2 text-xs font-mono">
            <div className={isDark ? 'text-slate-500' : 'text-amber-800/60 font-bold'}>---</div>
            <div className="pl-3 space-y-1.5 border-l-2 border-slate-800">
              <div className="flex items-center gap-2">
                <span className={isDark ? 'text-cyan-400' : 'text-cyan-700 font-semibold'}>title:</span>
                <span className={isDark ? 'text-slate-300' : 'text-slate-800'}>"{doc?.title || '無題'}"</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={isDark ? 'text-cyan-400' : 'text-cyan-700 font-semibold'}>created:</span>
                <span className="text-slate-400">{doc?.createdAt ? new Date(doc.createdAt).toLocaleString('ja-JP') : '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={isDark ? 'text-cyan-400' : 'text-cyan-700 font-semibold'}>updated:</span>
                <span className="text-slate-400">{doc?.updatedAt ? new Date(doc.updatedAt).toLocaleString('ja-JP') : '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={isDark ? 'text-cyan-400' : 'text-cyan-700 font-semibold'}>updated_by:</span>
                <span className="text-slate-400">{doc?.updatedBy || doc?.author || settings.defaultAuthor || 'Unknown'}</span>
              </div>
              {doc?.encoding && (
                <div className="flex items-center gap-2">
                  <span className={isDark ? 'text-cyan-400' : 'text-cyan-700 font-semibold'}>encoding:</span>
                  <span className="text-slate-400">{doc.encoding}</span>
                </div>
              )}
              {doc?.filePath && (
                <div className="flex items-center gap-2">
                  <span className={isDark ? 'text-emerald-400' : 'text-emerald-700 font-semibold'}>file_path:</span>
                  <span className="text-emerald-400/80 truncate max-w-md" title={doc.filePath}>{doc.filePath}</span>
                </div>
              )}
              <div className="flex items-start gap-2 pt-0.5">
                <span className={`flex items-center gap-1 ${isDark ? 'text-cyan-400' : 'text-cyan-700 font-semibold'}`}>
                  <Tag className="w-3 h-3" />
                  tags:
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-sans ${
                        isDark
                          ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                          : 'bg-white text-cyan-800 border border-slate-300'
                      }`}
                    >
                      <span>#{tag}</span>
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className={`hover:text-rose-400 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}

                  {isAddingTag ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        autoFocus
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddTag();
                          if (e.key === 'Escape') setIsAddingTag(false);
                        }}
                        placeholder="タグ名を入力..."
                        className={`px-2 py-0.5 border rounded text-[11px] outline-none w-28 ${
                          isDark
                            ? 'bg-slate-900 border-cyan-500 text-slate-100'
                            : 'bg-white border-cyan-600 text-slate-900'
                        }`}
                      />
                      <button
                        onClick={handleAddTag}
                        className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-medium"
                      >
                        追加
                      </button>
                      <button
                        onClick={() => setIsAddingTag(false)}
                        className={`p-0.5 ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingTag(true)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 border border-dashed rounded text-[11px] transition-colors ${
                        isDark
                          ? 'border-slate-700 hover:border-cyan-500 text-slate-400 hover:text-cyan-300'
                          : 'border-slate-300 hover:border-cyan-600 text-slate-600 hover:text-cyan-800'
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      タグを追加
                    </button>
                  )}
                </div>
              </div>
              <div className={isDark ? 'text-slate-500' : 'text-amber-800/60 font-bold'}>---</div>
            </div>
          </div>
        )}
      </div>

      {/* エディタ＆行番号エリア */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 行番号カラム (単一 pre による超高速・ゼロDOMオーバーヘッド描画) */}
        {settings.lineNumbers && (
          <div
            ref={lineNumbersRef}
            className={`min-w-12 px-2.5 py-3 text-right text-xs select-none overflow-hidden shrink-0 border-r pointer-events-none ${
              isDark
                ? 'bg-slate-950 text-slate-600 border-slate-800'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
            style={{
              fontSize: `${settings.fontSize}px`,
              lineHeight: effectiveLineHeight,
              fontFamily: effectiveFontFamily,
            }}
          >
            <pre
              className="m-0 p-0 text-right whitespace-pre"
              style={{
                fontFamily: effectiveFontFamily,
                lineHeight: effectiveLineHeight,
              }}
            >
              {lineNumbersText}
            </pre>
          </div>
        )}

        {/* メインテキストエリアエディタ */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={updateCursorPos}
          onClick={updateCursorPos}
          onScroll={handleScroll}
          readOnly={isReadOnly}
          placeholder="ここからMarkdown入力を開始してください..."
          spellCheck={false}
          className={`flex-1 w-full h-full p-3 font-mono resize-none focus:outline-none leading-relaxed transition-colors ${
            isDark
              ? 'bg-slate-950 text-slate-100 selection:bg-cyan-800 selection:text-slate-100'
              : 'bg-white text-slate-900 selection:bg-cyan-200 selection:text-slate-900'
          } ${
            isReadOnly ? 'cursor-default opacity-90' : ''
          } ${
            settings.wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre overflow-x-auto'
          }`}
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: effectiveLineHeight,
            fontFamily: effectiveFontFamily,
            tabSize: effectiveTabSize,
          }}
        />
      </div>

      {/* 大容量ファイルの遅延読み込み（部分表示中）アクションバー */}
      {doc?.isChunkedLoaded && (
        <div
          className={`px-4 py-2 border-t select-none flex items-center justify-between transition-colors text-xs shrink-0 ${
            isDark
              ? 'bg-slate-900/95 border-slate-800 text-slate-300'
              : 'bg-cyan-50/95 border-cyan-200 text-cyan-950 shadow-md'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-bold">
              <Zap className="w-3 h-3 text-cyan-400 fill-cyan-400" />
              大容量高速ロード中
            </span>
            <span className="font-medium">
              冒頭 <strong className={isDark ? 'text-white' : 'text-cyan-900'}>{lineCount.toLocaleString()}</strong> 行を表示中
              {doc.totalSizeBytes && (
                <span className="text-[11px] opacity-70 ml-1">
                  (全体: 約 {(doc.totalSizeBytes / 1024 / 1024).toFixed(1)} MB)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onLoadMoreChunk && (
              <button
                onClick={onLoadMoreChunk}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-cyan-800 border border-cyan-300'
                }`}
                title="さらに約 1,500 行読み込みます"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>さらに読み込む</span>
              </button>
            )}

            {onLoadFullDoc && (
              <button
                onClick={onLoadFullDoc}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                  isDark
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                    : 'bg-cyan-700 hover:bg-cyan-800 text-white'
                }`}
                title="ファイル全体を完全に読み込みます"
              >
                <Download className="w-3.5 h-3.5" />
                <span>全文を一括読み込み</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
