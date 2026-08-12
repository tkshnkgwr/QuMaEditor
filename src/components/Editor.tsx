import React, { useRef, useState } from 'react';
import { Upload, Lock, Tag, Plus, X, ChevronDown, ChevronRight } from 'lucide-react';
import { EditorSettings, MarkdownDoc } from '../types';
import { handleAutoListContinuation, insertFormatting } from '../utils/markdownUtils';

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
}

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

  // 行番号の計算
  const lineCount = content ? content.split('\n').length : 1;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  // 行番号およびプレビューとのスクロール同期処理
  const handleScroll = () => {
    if (textareaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = textareaRef.current;
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = scrollTop;
      }
      if (onScrollSync) {
        onScrollSync(scrollTop, scrollHeight, clientHeight);
      }
    }
  };

  // カーソル位置の行・列番号を更新
  const updateCursorPos = () => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBefore = content.slice(0, pos);
    const lines = textBefore.split('\n');
    const currentLine = lines.length;
    const currentCol = lines[lines.length - 1].length + 1;
    onCursorChange(currentLine, currentCol);
  };

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
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
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

      {/* YAML Front Matter 保護エリア (タグのみ編集可 - テーマ完全調和・高明度) */}
      <div className={`border-b shrink-0 font-mono text-xs select-none transition-colors ${
        isDark
          ? 'bg-slate-900/90 border-slate-800 text-slate-300'
          : 'bg-amber-50/90 border-amber-200 text-slate-900 shadow-2xs'
      }`}>
        <div
          onClick={() => setIsFrontMatterOpen(!isFrontMatterOpen)}
          className={`px-3 py-1.5 flex items-center justify-between cursor-pointer transition-colors ${
            isDark ? 'hover:bg-slate-800/60' : 'hover:bg-amber-100/80'
          }`}
        >
          <div className="flex items-center gap-2">
            {isFrontMatterOpen ? (
              <ChevronDown className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-800'}`} />
            ) : (
              <ChevronRight className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-800'}`} />
            )}
            <span className={`font-bold ${isDark ? 'text-amber-400' : 'text-amber-950'}`}>
              YAML Front Matter
            </span>
            <span className={`px-1.5 py-0.2 text-[10px] rounded flex items-center gap-1 font-semibold ${
              isDark
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                : 'bg-amber-200/90 border border-amber-300/90 text-amber-950'
            }`}>
              <Lock className="w-2.5 h-2.5" />
              保護領域 (エディタ直接編集不可)
            </span>
          </div>
          <div className={`text-[11px] flex items-center gap-1.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
            <Tag className={`w-3 h-3 ${isDark ? 'text-cyan-400' : 'text-cyan-800'}`} />
            <span>タグのみ設定可能 ({tags.length})</span>
          </div>
        </div>

        {isFrontMatterOpen && (
          <div className={`px-4 py-2.5 border-t space-y-1.5 transition-colors ${
            isDark
              ? 'bg-slate-950/60 border-slate-800/80 text-slate-400'
              : 'bg-amber-50/60 border-amber-200 text-slate-900'
          }`}>
            <div className={isDark ? 'text-slate-500' : 'text-amber-800/60 font-bold'}>---</div>
            <div className="flex items-center gap-2 text-[11px]" title="読み取り専用">
              <span className={`w-20 font-bold ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>title:</span>
              <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{JSON.stringify(doc?.title || '無題のドキュメント')}</span>
              <Lock className={`w-3 h-3 ml-auto ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
            </div>
            <div className="flex items-center gap-2 text-[11px]" title="読み取り専用">
              <span className={`w-20 font-bold ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>created:</span>
              <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-900'}`}>{JSON.stringify(doc?.createdAt || new Date().toISOString())}</span>
              <Lock className={`w-3 h-3 ml-auto ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
            </div>
            <div className="flex items-center gap-2 text-[11px]" title="読み取り専用">
              <span className={`w-20 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>encoding:</span>
              <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>{JSON.stringify(doc?.encoding || 'UTF-8')}</span>
              <Lock className={`w-3 h-3 ml-auto ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
            </div>

            {/* タグ設定エリア (タグのみ編集可能) */}
            <div className={`flex items-start gap-2 text-[11px] pt-1.5 border-t ${
              isDark ? 'border-slate-800/60' : 'border-amber-200/60'
            }`}>
              <span className={`font-semibold w-20 pt-1 flex items-center gap-1 ${
                isDark ? 'text-cyan-400' : 'text-cyan-800'
              }`}>
                <Tag className="w-3 h-3" />
                tags:
              </span>
              <div className="flex-1 flex flex-wrap items-center gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                      isDark
                        ? 'bg-cyan-950/80 border border-cyan-800 text-cyan-300'
                        : 'bg-cyan-50 border border-cyan-300 text-cyan-900'
                    }`}
                  >
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-500 transition-colors p-0.5"
                      title="タグを削除"
                    >
                      <X className="w-3 h-3" />
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
        )}
      </div>

      {/* エディタ＆行番号エリア */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 行番号カラム */}
        {settings.lineNumbers && (
          <div
            ref={lineNumbersRef}
            className={`w-12 py-3 text-right pr-3 font-mono text-xs select-none overflow-hidden shrink-0 leading-relaxed border-r ${
              isDark
                ? 'bg-slate-950 text-slate-600 border-slate-800'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
            style={{ fontSize: `${settings.fontSize}px` }}
          >
            {lineNumbers.map((num) => (
              <div key={num}>{num}</div>
            ))}
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
          placeholder="ここからMarkdown入力を開始してください..."
          spellCheck={false}
          className={`flex-1 w-full h-full p-3 font-mono resize-none focus:outline-none leading-relaxed transition-colors ${
            isDark
              ? 'bg-slate-950 text-slate-100 selection:bg-cyan-800 selection:text-slate-100'
              : 'bg-white text-slate-900 selection:bg-cyan-200 selection:text-slate-900'
          } ${
            settings.wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre overflow-x-auto'
          }`}
          style={{
            fontSize: `${settings.fontSize}px`,
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
};
