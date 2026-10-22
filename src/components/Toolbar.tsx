import React, { useRef, useState, useEffect } from 'react';
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
  Upload,
  Network,
  ChevronDown,
} from 'lucide-react';

const MERMAID_TEMPLATES = [
  {
    id: 'flowchart',
    label: 'フローチャート (Flowchart)',
    description: '処理の流れや条件分岐を可視化',
    code: `flowchart TD
    Start([開始]) --> Process[処理を実行]
    Process --> Decision{条件判定}
    Decision -- はい --> Success([完了])
    Decision -- いいえ --> Retry[再試行]
    Retry --> Process`,
  },
  {
    id: 'sequence',
    label: 'シーケンス図 (Sequence)',
    description: 'メッセージ送受信や非同期通信を可視化',
    code: `sequenceDiagram
    autonumber
    actor Boss as ユーザー
    participant UI as フロントエンド
    participant Backend as バックエンド

    Boss->>UI: 操作を実行
    activate UI
    UI->>Backend: データ取得リクエスト
    activate Backend
    Backend-->>UI: 処理結果レスポンス
    deactivate Backend
    UI-->>Boss: 画面更新
    deactivate UI`,
  },
  {
    id: 'state',
    label: '状態遷移図 (State)',
    description: 'システムや画面の状態遷移を可視化',
    code: `stateDiagram-v2
    [*] --> 待機中
    待機中 --> 処理中: 実行指示
    処理中 --> 完了: 成功
    処理中 --> エラー: 失敗
    エラー --> 待機中: リセット
    完了 --> [*]`,
  },
  {
    id: 'class',
    label: 'クラス図 (Class)',
    description: 'オブジェクト指向やクラス関係を可視化',
    code: `classDiagram
    class Document {
        +String title
        +String content
        +save() void
        +exportHtml() String
    }
    class Editor {
        +render() void
        +formatText() void
    }
    Document <|-- MarkdownDoc
    Editor o-- Document`,
  },
  {
    id: 'er',
    label: 'ER図 (Entity-Relationship)',
    description: 'データベース構造やエンティティ関連を可視化',
    code: `erDiagram
    USER ||--o{ DOCUMENT : "作成する"
    USER {
        string user_id PK
        string user_name
    }
    DOCUMENT ||--o{ TAG : "タグ付け"
    DOCUMENT {
        string doc_id PK
        string title
        string body
    }`,
  },
  {
    id: 'mindmap',
    label: 'マインドマップ (Mindmap)',
    description: 'アイデアの発散・ブレインストーミング',
    code: `mindmap
  root((プロジェクト))
    要件定義
      画面仕様
      非機能要件
    設計
      バックエンド
      フロントエンド
    検証
      単体テスト
      事前検証`,
  },
  {
    id: 'gantt',
    label: 'ガントチャート (Gantt)',
    description: 'プロジェクト進捗・工程管理',
    code: `gantt
    title プロジェクト進捗スケジュール
    dateFormat  YYYY-MM-DD
    section 設計
    要件定義         :done,    des1, 2026-10-01, 2026-10-05
    画面仕様設計     :active,  des2, 2026-10-06, 5d
    section 開発
    フロント実装     :         dev1, after des2, 7d
    バックエンド連携 :         dev2, after dev1, 5d`,
  },
  {
    id: 'gitGraph',
    label: 'Git グラフ (Git Graph)',
    description: 'ブランチ運用やマージの流れを可視化',
    code: `gitGraph
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit`,
  },
];

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
  onInsertMermaidTemplate?: (templateCode: string) => void;
  isDark?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onFormat,
  onOpenTableModal,
  onInsertDate,
  onImageUpload,
  onAutoFormat,
  onInsertMermaidTemplate,
  isDark = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mermaidMenuRef = useRef<HTMLDivElement>(null);
  const [isMermaidMenuOpen, setIsMermaidMenuOpen] = useState(false);

  // メニュー外部クリック時の自動クローズ
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mermaidMenuRef.current &&
        !mermaidMenuRef.current.contains(event.target as Node)
      ) {
        setIsMermaidMenuOpen(false);
      }
    };
    if (isMermaidMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMermaidMenuOpen]);

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
    <div
      onMouseDown={(e) => {
        // ボタンクリック時に textarea からフォーカスが外れて選択範囲が消えるのを防止
        if ((e.target as HTMLElement).tagName !== 'INPUT') {
          e.preventDefault();
        }
      }}
      className={`border-b px-3 py-1.5 flex items-center flex-wrap gap-1 select-none overflow-x-auto shrink-0 z-10 transition-colors print:hidden ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
      }`}
    >
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

      {/* テーブル・Mermaid・コード・引用 */}
      <div className={`flex items-center gap-0.5 px-1 border-r ${dividerClass}`}>
        <button
          onClick={onOpenTableModal}
          className={`p-1.5 rounded transition-colors flex items-center gap-1 ${btnHoverClass}`}
          title="表組（テーブル）を挿入"
        >
          <TableIcon className="w-4 h-4 text-purple-500" />
        </button>

        {/* Mermaid ダイアグラム挿入メニュー */}
        <div className="relative" ref={mermaidMenuRef}>
          <button
            onClick={() => setIsMermaidMenuOpen((prev) => !prev)}
            className={`p-1.5 rounded transition-colors flex items-center gap-0.5 ${btnHoverClass} ${
              isMermaidMenuOpen ? (isDark ? 'bg-slate-800 text-cyan-400' : 'bg-slate-200 text-cyan-700') : ''
            }`}
            title="Mermaid ダイアグラム（フローチャート・シーケンス図等）を挿入"
          >
            <Network className="w-4 h-4 text-cyan-400" />
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {isMermaidMenuOpen && (
            <div
              className={`absolute top-full left-0 mt-1 w-64 rounded-xl border shadow-xl py-1.5 z-50 animate-fade-in ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-200'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className={`px-3 py-1.5 border-b text-[11px] font-semibold flex items-center gap-1.5 ${
                isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
              }`}>
                <Network className="w-3.5 h-3.5 text-cyan-400" />
                <span>Mermaid 記法の雛形を挿入</span>
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {MERMAID_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      onInsertMermaidTemplate?.(tmpl.code);
                      setIsMermaidMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex flex-col ${
                      isDark
                        ? 'hover:bg-slate-800 text-slate-200'
                        : 'hover:bg-cyan-50 text-slate-700 hover:text-cyan-900'
                    }`}
                  >
                    <span className="font-medium text-[11.5px]">{tmpl.label}</span>
                    <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {tmpl.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

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
