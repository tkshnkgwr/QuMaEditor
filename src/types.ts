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
  isRemote?: boolean;   // リモートファイルフラグ（trueの場合は自動保存対象外）
  remoteUrl?: string;  // リモート参照元URL
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

export type SaveStatus = 'saved' | 'saving' | 'editing' | 'unsaved';

// UPDATE 2026-08-04: 自動保存状態（編集中 'editing' を含む）の型定義を追加
export interface EditorSettings {
  fontSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  syncScroll: boolean;
  autoSaveIntervalMs: number; // 最小1000ms, 最大10000ms
  theme: ThemeMode;
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
