import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  Replace as ReplaceIcon,
  ChevronUp,
  ChevronDown,
  X,
  CaseSensitive,
  WholeWord,
  Regex as RegexIcon,
  ChevronRight,
} from 'lucide-react';

export interface FindReplaceBarProps {
  content: string;
  onReplace: (newContent: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'find' | 'replace';
  isDark?: boolean;
}

interface FindMatch {
  index: number;
  length: number;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const FindReplaceBar: React.FC<FindReplaceBarProps> = ({
  content,
  onReplace,
  textareaRef,
  isOpen,
  onClose,
  initialMode = 'find',
  isDark = true,
}) => {
  const [query, setQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [isReplaceMode, setIsReplaceMode] = useState(initialMode === 'replace');
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [isWholeWord, setIsWholeWord] = useState(false);
  const [isRegex, setIsRegex] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const queryInputRef = useRef<HTMLInputElement>(null);

  // initialMode が変わった際に置換モードを連動
  useEffect(() => {
    if (isOpen) {
      setIsReplaceMode(initialMode === 'replace');
      // 開いたときに入力欄へフォーカス
      setTimeout(() => {
        queryInputRef.current?.focus();
        queryInputRef.current?.select();
      }, 50);
    }
  }, [isOpen, initialMode]);

  // textarea で選択されているテキストがある場合、初期クエリに設定
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      const textarea = textareaRef.current;
      const selected = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      if (selected && !selected.includes('\n') && selected.length < 100) {
        setQuery(selected);
      }
    }
  }, [isOpen]);

  // マッチ一覧の高速算出
  const matches = useMemo<FindMatch[]>(() => {
    if (!query) return [];
    try {
      let pattern = query;
      if (!isRegex) {
        pattern = escapeRegExp(query);
      }
      if (isWholeWord) {
        pattern = `\\b${pattern}\\b`;
      }
      const flags = isCaseSensitive ? 'g' : 'gi';
      const regex = new RegExp(pattern, flags);
      const results: FindMatch[] = [];
      let m: RegExpExecArray | null;
      while ((m = regex.exec(content)) !== null) {
        results.push({ index: m.index, length: m[0].length });
        if (m.index === regex.lastIndex) regex.lastIndex++;
      }
      return results;
    } catch {
      return [];
    }
  }, [content, query, isCaseSensitive, isWholeWord, isRegex]);

  // マッチ変更時にインデックス境界を補正
  useEffect(() => {
    if (matches.length === 0) {
      setCurrentMatchIndex(0);
    } else if (currentMatchIndex >= matches.length) {
      setCurrentMatchIndex(0);
    }
  }, [matches.length]);

  // 一致箇所へキャレット移動＆スクロール
  const jumpToMatch = useCallback(
    (index: number) => {
      if (matches.length === 0 || !textareaRef.current) return;
      const target = matches[index];
      if (!target) return;
      const textarea = textareaRef.current;
      textarea.focus();
      textarea.setSelectionRange(target.index, target.index + target.length);

      // 行番号に基づいてスクロール位置を調整
      const textBefore = content.substring(0, target.index);
      const lineNum = textBefore.split('\n').length;
      const lineHeight = 22;
      const targetTop = Math.max(0, (lineNum - 4) * lineHeight);
      textarea.scrollTop = targetTop;
    },
    [matches, textareaRef, content]
  );

  const handleNext = () => {
    if (matches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(nextIdx);
    jumpToMatch(nextIdx);
  };

  const handlePrev = () => {
    if (matches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + matches.length) % matches.length;
    setCurrentMatchIndex(prevIdx);
    jumpToMatch(prevIdx);
  };

  // 1箇所置換
  const handleReplace = () => {
    if (matches.length === 0 || !textareaRef.current) return;
    const match = matches[currentMatchIndex];
    if (!match) return;

    const newContent =
      content.substring(0, match.index) + replaceText + content.substring(match.index + match.length);
    onReplace(newContent);

    // 次のマッチへ進む
    setTimeout(() => {
      jumpToMatch(currentMatchIndex % (matches.length - 1 || 1));
    }, 20);
  };

  // すべて置換
  const handleReplaceAll = () => {
    if (!query || matches.length === 0) return;
    try {
      let pattern = query;
      if (!isRegex) {
        pattern = escapeRegExp(query);
      }
      if (isWholeWord) {
        pattern = `\\b${pattern}\\b`;
      }
      const flags = isCaseSensitive ? 'g' : 'gi';
      const regex = new RegExp(pattern, flags);
      const newContent = content.replace(regex, replaceText);
      onReplace(newContent);
    } catch (err) {
      console.error('一括置換エラー:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      textareaRef.current?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`absolute top-2 right-4 z-30 flex flex-col p-2 rounded-xl shadow-2xl border text-xs backdrop-blur-md transition-all select-none ${
        isDark
          ? 'bg-slate-900/95 border-slate-700/80 text-slate-200 shadow-black/60'
          : 'bg-white/95 border-slate-300 text-slate-800 shadow-slate-400/40'
      }`}
      style={{ minWidth: '340px', maxWidth: '420px' }}
      onKeyDown={handleKeyDown}
    >
      {/* 検索行 */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsReplaceMode((prev) => !prev)}
          className={`p-1 rounded hover:bg-slate-700/40 transition-colors cursor-pointer ${
            isReplaceMode ? 'text-cyan-400' : 'text-slate-400'
          }`}
          title={isReplaceMode ? '置換を閉じる' : '置換モードを展開 (Ctrl+H)'}
        >
          {isReplaceMode ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        <div className="relative flex-1 flex items-center">
          <Search className={`w-3.5 h-3.5 absolute left-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            ref={queryInputRef}
            type="text"
            placeholder="ドキュメント内を検索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`w-full text-xs rounded pl-7 pr-20 py-1 border focus:outline-none transition-colors ${
              isDark
                ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-600'
            }`}
          />
          {/* オプションボタン群 */}
          <div className="absolute right-1 flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setIsCaseSensitive((prev) => !prev)}
              className={`p-0.5 rounded text-[10px] cursor-pointer transition-colors ${
                isCaseSensitive
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="大文字・小文字を区別 (Alt+C)"
            >
              <CaseSensitive className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setIsWholeWord((prev) => !prev)}
              className={`p-0.5 rounded text-[10px] cursor-pointer transition-colors ${
                isWholeWord
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="単語単位で検索 (Alt+W)"
            >
              <WholeWord className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setIsRegex((prev) => !prev)}
              className={`p-0.5 rounded text-[10px] cursor-pointer transition-colors ${
                isRegex
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="正規表現を使用 (Alt+R)"
            >
              <RegexIcon className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* マッチ件数 */}
        <span className={`text-[11px] font-mono shrink-0 px-1 ${matches.length === 0 && query ? 'text-rose-400' : 'text-slate-400'}`}>
          {query ? `${matches.length > 0 ? currentMatchIndex + 1 : 0}/${matches.length}` : '0件'}
        </span>

        {/* ナビゲーション・閉じる */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={handlePrev}
            disabled={matches.length === 0}
            className="p-1 rounded hover:bg-slate-700/40 disabled:opacity-30 cursor-pointer transition-colors"
            title="前の一致 (Shift+Enter)"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={matches.length === 0}
            className="p-1 rounded hover:bg-slate-700/40 disabled:opacity-30 cursor-pointer transition-colors"
            title="次の一致 (Enter)"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-700/40 cursor-pointer transition-colors text-slate-400 hover:text-slate-100"
            title="閉じる (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 置換行 (置換モード時) */}
      {isReplaceMode && (
        <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-slate-700/50">
          <div className="w-5 flex justify-center text-slate-400">
            <ReplaceIcon className="w-3 h-3" />
          </div>

          <input
            type="text"
            placeholder="置換後のテキスト..."
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            className={`flex-1 text-xs rounded px-2.5 py-1 border focus:outline-none transition-colors ${
              isDark
                ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-600'
            }`}
          />

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleReplace}
              disabled={matches.length === 0}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer transition-colors disabled:opacity-30 ${
                isDark
                  ? 'bg-slate-800 hover:bg-cyan-600/30 border-slate-700 text-cyan-300'
                  : 'bg-slate-100 hover:bg-cyan-100 border-slate-300 text-cyan-800'
              }`}
              title="現在の一致を置換"
            >
              置換
            </button>
            <button
              type="button"
              onClick={handleReplaceAll}
              disabled={matches.length === 0}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer transition-colors disabled:opacity-30 ${
                isDark
                  ? 'bg-cyan-600 hover:bg-cyan-500 border-cyan-500 text-white'
                  : 'bg-cyan-700 hover:bg-cyan-600 border-cyan-700 text-white'
              }`}
              title="すべての一致を一括置換"
            >
              一括置換
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
