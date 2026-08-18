import React, { useRef } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Table as TableIcon,
  Code,
  FileCode,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  Calendar,
  Sparkles,
  Upload
} from 'lucide-react';

interface ToolbarProps {
  onFormat: (
    type:
      | 'bold'
      | 'italic'
      | 'underline'
      | 'strikethrough'
      | 'h1'
      | 'h2'
      | 'h3'
      | 'bullet'
      | 'numbered'
      | 'task'
      | 'code'
      | 'codeblock'
      | 'quote'
      | 'link'
      | 'image'
      | 'table'
      | 'hr'
  ) => void;
  onOpenTableModal: () => void;
  onInsertDate: () => void;
  onImageUpload: (file: File) => void;
  onAutoFormat?: () => void;
  isDark?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onFormat,
  onOpenTableModal,
  onInsertDate,
  onImageUpload,
  onAutoFormat,
  isDark = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const btnHoverClass = isDark
    ? 'hover:bg-slate-800 hover:text-cyan-400'
    : 'hover:bg-slate-200 hover:text-cyan-700';

  const dividerClass = isDark ? 'border-slate-800' : 'border-slate-200';

  return (
    <div className={`border-b px-3 py-1.5 flex items-center flex-wrap gap-1 select-none overflow-x-auto shrink-0 z-10 transition-colors print:hidden ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
    }`}>
      {/* 非表示の画像ファイル入力 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* 見出しボタン */}
      <div className={`flex items-center gap-0.5 pr-1 border-r ${dividerClass}`}>
        <button
          onClick={() => onFormat('h1')}
          className={`p-1.5 rounded transition-colors ${btnHoverClass}`}
          title="見出し 1 (# )"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onFormat('h2')}
          className={`p-1.5 rounded transition-colors ${btnHoverClass}`}
          title="見出し 2 (## )"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onFormat('h3')}
          className={`p-1.5 rounded transition-colors ${btnHoverClass}`}
          title="見出し 3 (### )"
        >
          <Heading3 className="w-4 h-4" />
        </button>
      </div>

      {/* インラインテキスト装飾 */}
      <div className={`flex items-center gap-0.5 px-1 border-r ${dividerClass}`}>
        <button
          onClick={() => onFormat('bold')}
          className={`p-1.5 rounded transition-colors ${btnHoverClass}`}
          title="太字 (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => onFormat('italic')}
          className={`p-1.5 rounded transition-colors ${btnHoverClass}`}
          title="斜体 (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => onFormat('underline')}
          className={`p-1.5 rounded transition-colors ${btnHoverClass}`}
          title="下線 (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onFormat('strikethrough')}
          className={`p-1.5 rounded transition-colors ${btnHoverClass}`}
          title="打ち消し線 (~~)"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
      </div>

      {/* リスト＆タスク */}
      <div className={`flex items-center gap-0.5 px-1 border-r ${dividerClass}`}>
        <button
          onClick={() => onFormat('bullet')}
          className={`p-1.5 rounded transition-colors ${btnHoverClass}`}
          title="箇条書きリスト (- )"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => onFormat('numbered')}
          className={`p-1.5 rounded transition-colors ${btnHoverClass}`}
          title="番号付きリスト (1. )"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={() => onFormat('task')}
          className={`p-1.5 rounded transition-colors ${btnHoverClass}`}
          title="タスクリスト (- [ ] )"
        >
          <CheckSquare className="w-4 h-4 text-emerald-500" />
        </button>
      </div>

      {/* テーブル・コード・引用 */}
      <div className={`flex items-center gap-0.5 px-1 border-r ${dividerClass}`}>
        <button
          onClick={onOpenTableModal}
          className={`p-1.5 rounded transition-colors flex items-center gap-1 ${btnHoverClass}`}
          title="表組（テーブル）を挿入"
        >
          <TableIcon className="w-4 h-4 text-purple-500" />
        </button>
        <button
          onClick={() => onFormat('code')}
          className={`p-1.5 rounded transition-colors ${btnHoverClass}`}
          title="インラインコード (`)"
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          onClick={() => onFormat('codeblock')}
          className={`p-1.5 rounded transition-colors ${btnHoverClass}`}
          title="コードブロック (```)"
        >
          <FileCode className="w-4 h-4" />
        </button>
        <button
          onClick={() => onFormat('quote')}
          className={`p-1.5 rounded transition-colors ${btnHoverClass}`}
          title="引用 (> )"
        >
          <Quote className="w-4 h-4" />
        </button>
      </div>

      {/* リンク・画像・その他 */}
      <div className="flex items-center gap-0.5 px-1">
        <button
          onClick={() => onFormat('link')}
          className={`p-1.5 rounded transition-colors ${btnHoverClass}`}
          title="リンクを挿入"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`p-1.5 rounded transition-colors flex items-center gap-1 text-xs ${btnHoverClass}`}
          title="画像をアップロード / 挿入"
        >
          <ImageIcon className="w-4 h-4 text-amber-500" />
        </button>
        <button
          onClick={() => onFormat('hr')}
          className={`p-1.5 rounded transition-colors ${btnHoverClass}`}
          title="水平区切り線 (---)"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={onInsertDate}
          className={`p-1.5 rounded transition-colors ${btnHoverClass}`}
          title="現在の日時を挿入"
        >
          <Calendar className="w-4 h-4 text-cyan-500" />
        </button>
        {onAutoFormat && (
          <button
            onClick={onAutoFormat}
            className={`p-1.5 rounded transition-colors flex items-center gap-1 text-xs font-medium ml-1 ${
              isDark
                ? 'bg-cyan-950/50 hover:bg-cyan-900/70 text-cyan-300 border border-cyan-800/60'
                : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300'
            }`}
            title="Markdown 自動整形 (Ctrl+Shift+F) — 表組み垂直整列・見出し空行・連続空行圧縮"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
            <span className="hidden sm:inline">整形</span>
          </button>
        )}
      </div>
    </div>
  );
};
