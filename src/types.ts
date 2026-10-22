export type SupportedEncoding = 'UTF-8' | 'Shift_JIS' | 'EUC-JP';

// UPDATE 2026-08-04: 改行コード型 (LF, CRLF, CR) の定義
export type LineEnding = 'LF' | 'CRLF' | 'CR';

// UPDATE 2026-08-04: テンプレートの編集・カスタム追加用インターフェース
export interface CustomTemplate {
  id: string;
  title: string;
  description: string;
  content: string;
  isCustom?: boolean;
}

// UPDATE 2026-08-04: リモートファイル判別用プロパティ(isRemote, remoteUrl)および操作ログ用LogEntry型を追加
export interface MarkdownDoc {
  id: string;
  title: string;
  content: string;
  encoding?: SupportedEncoding;
  author?: string;      // 作成者
  createdAt: string;    // 作成日時
  updatedAt: string;    // 更新日時
  updatedBy?: string;    // 更新者
  isFavorite?: boolean;
  tags?: string[];
  summary?: string;     // 要約
  summaryType?: string; // 要約生成方式・モデル名
  filePath?: string;   // 実ファイルの絶対パス（ローカルファイル上書き保存用）
  isRemote?: boolean;   // リモートファイルフラグ（trueの場合は自動保存対象外）
  remoteUrl?: string;  // リモート参照元URL
  isChunkedLoaded?: boolean; // 遅延読み込み（部分表示中）フラグ
  loadedBytes?: number;     // 現在読み込み済みのバイト数
  totalSizeBytes?: number;  // ファイル全体の総バイト数
}

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: string;
}

export type ViewMode = 'split' | 'editor' | 'preview';

export type ThemeMode = 'dark' | 'light' | 'system';

export type HeadingTheme = 'muted' | 'vivid' | 'high_contrast' | 'monochrome';

/**
 * コードブロックのシンタックスハイライト配色テーマ
 */
export type CodeBlockTheme = 'vscDarkPlus' | 'dracula' | 'nord' | 'okaidia' | 'oneDark' | 'prism';

export type SaveStatus = 'saved' | 'saved_file' | 'saved_local' | 'saving' | 'editing' | 'unsaved';

/**
 * エディタのフォントファミリー設定
 * - `monospace`: 等幅フォント (JetBrains Mono / Cascadia Code / Consolas)
 * - `sans-serif`: ゴシック体 (Inter / メイリオ / Hiragino Sans)
 * - `serif`: 明朝体 (Noto Serif JP / 游明朝)
 */
export type EditorFontFamily = 'monospace' | 'sans-serif' | 'serif';

/**
 * エディタ全般の動作・外観カスタマイズ設定インターフェース
 */
export interface EditorSettings {
  /** 基本フォントサイズ (px, 12〜24) */
  fontSize: number;
  /** 行間 Line Height (1.4: コンパクト, 1.625: 標準, 1.8: ゆったり, 2.0: 広め) */
  lineHeight?: number;
  /** エディタフォントファミリー ('monospace' | 'sans-serif' | 'serif') */
  fontFamily?: EditorFontFamily;
  /** タブ文字幅 Tab Size (2 または 4 スペース) */
  tabSize?: number;
  /** 右端での自動折り返し有効フラグ */
  wordWrap: boolean;
  /** 行番号表示フラグ */
  lineNumbers: boolean;
  /** 分割表示時のスクロール連動同期フラグ */
  syncScroll: boolean;
  /** 自動保存インターバルミリ秒 (1000〜10000ms) */
  autoSaveIntervalMs: number;
  /** カラーテーマ ('dark' | 'light' | 'system') */
  theme: ThemeMode;
  /** 見出しカラーテーマ ('muted' | 'vivid' | 'high_contrast' | 'monochrome') */
  headingTheme?: HeadingTheme;
  /** コードブロック配色テーマ ('vscDarkPlus' | 'dracula' | 'nord' | 'okaidia' | 'oneDark' | 'prism') */
  codeBlockTheme?: CodeBlockTheme;
  /** スマートペースト（テキスト選択中のURL自動リンク化）有効フラグ */
  smartPaste?: boolean;
  /** 既定の作成者名 (YAML Front Matter 自動付与用) */
  defaultAuthor?: string;
  /** タイプライタースクロール（カーソル行を画面中央に維持）有効フラグ */
  typewriterScroll?: boolean;
  /** Markdown プレビュー描画エンジン ('rust' | 'react') */
  previewEngine?: 'rust' | 'react';
  /** Gemini API キー */
  geminiApiKey?: string;
  /** 使用する Gemini モデル ('gemini-3.7-flash' 等) */
  geminiModel?: string;
  /** Gemini Base URL (プロキシ・カスタムエンドポイント対応) */
  geminiBaseUrl?: string;
  /** AI要約生成ルール（プロンプト） */
  summaryRule?: string;
  /** アクティブ要約実行モード ('api' | 'local_fallback' | 'web_proxy') */
  activeSummaryMode?: 'api' | 'local_fallback' | 'web_proxy';
  /** 直近のAPI接続テスト結果 */
  lastTestResult?: {
    testedAt?: string;
    apiSuccess?: boolean;
    apiMessage?: string;
    apiLatency?: number;
    urlSuccess?: boolean;
    urlMessage?: string;
    urlLatency?: number;
  };
  /** Google から動的取得した利用可能モデル一覧（スマートフィルター適用済み） */
  cachedAvailableModels?: { value: string; label: string }[];
}

export interface TextStats {
  characters: number;
  charactersNoSpace: number;
  words: number;
  lines: number;
  readingTimeMinutes: number;
}

export interface SelectionState {
  start: number;
  end: number;
}
