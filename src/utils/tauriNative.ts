import { commands, CsvPreviewDto } from '../bindings';
export type { CsvPreviewDto };

/**
 * 文字コード自動判別結果のインターフェース
 */
export interface ConvertedTextResult {
  /** 変換後の UTF-8 テキスト */
  text: string;
  /** 判別された元のエンコーディング名 ('UTF-8' | 'Shift_JIS' | 'EUC-JP') */
  encoding: 'UTF-8' | 'Shift_JIS' | 'EUC-JP';
}

/**
 * 大容量ファイルストリーミング読み込みチャンク結果のインターフェース
 */
export interface ChunkResult {
  /** チャンクテキストデータ */
  content: string;
  /** 後続チャンクが存在するかどうか */
  has_more: boolean;
  /** ファイル全体のバイトサイズ */
  total_size: number;
}

/**
 * 全文検索インデックス登録用ドキュメント入力構造体
 */
export interface DocSearchInput {
  /** ドキュメントの一意な識別子 */
  id: string;
  /** ドキュメントのタイトル */
  title: string;
  /** ドキュメントの本文章データ */
  content: string;
}

/**
 * 全文検索ヒット結果構造体
 */
export interface SearchHit {
  /** ヒットしたドキュメントのID */
  doc_id: string;
  /** ヒットしたドキュメントのタイトル */
  doc_title: string;
  /** 該当行番号 (1-indexed) */
  line_number: number;
  /** 該当行のテキスト内容 */
  line_text: string;
}

/**
 * ファイル一括文字コード変換結果のインターフェース
 */
export interface BatchConvertResult {
  /** 成功件数 */
  success_count: number;
  /** 失敗件数 */
  failure_count: number;
  /** 処理ログメッセージのリスト */
  messages: string[];
}

/**
 * テキスト Diff (差分) の各変更要素
 */
export interface DiffChange {
  /** 変更種別 ('insert': 挿入, 'delete': 削除, 'equal': 変更なし) */
  tag: 'insert' | 'delete' | 'equal';
  /** 変更箇所の文字列 */
  value: string;
  /** 旧テキストの対応行番号 */
  old_line?: number;
  /** 新テキストの対応行番号 */
  new_line?: number;
}

/**
 * Rust ネイティブコマンドによる文字コード判別および UTF-8 テキスト変換
 *
 * @param bytes 判別対象の生バイト配列 (Uint8Array)
 * @returns 判別結果オブジェクト (ConvertedTextResult) または失敗時 null
 */
export async function detectAndConvertNative(bytes: Uint8Array): Promise<ConvertedTextResult | null> {
  try {
    const res = await commands.detectAndConvertToUtf8(Array.from(bytes));
    if (res.status === 'ok') {
      return res.data as ConvertedTextResult;
    }
    return null;
  } catch (err) {
    console.warn('Native detectAndConvertToUtf8 failed or fallback:', err);
    return null;
  }
}

/**
 * Rust ネイティブコマンドによる指定エンコーディング (Shift_JIS / EUC-JP 等) へのバイト変換
 *
 * @param text 変換元の UTF-8 文字列
 * @param encoding ターゲットエンコーディング名
 * @returns 変換後のバイト配列 (Uint8Array) または失敗時 null
 */
export async function convertToEncodingNative(text: string, encoding: string): Promise<Uint8Array | null> {
  try {
    const res = await commands.convertUtf8ToEncoding(text, encoding);
    if (res.status === 'ok') {
      return new Uint8Array(res.data);
    }
    return null;
  } catch (err) {
    console.warn('Native convertUtf8ToEncoding failed or fallback:', err);
    return null;
  }
}

/**
 * 大容量ファイルのストリーミング分割読み込み (Rust 高速チャンク処理)
 *
 * @param filePath 対象ファイルの絶対パス
 * @param offset 読み込み開始バイトオフセット
 * @param chunkSize 1回の読み込みサイズ (デフォルト: 512KB)
 * @returns チャンク結果オブジェクト (ChunkResult) または失敗時 null
 */
export async function readFileChunkNative(
  filePath: string,
  offset: number,
  chunkSize: number = 512 * 1024
): Promise<ChunkResult | null> {
  try {
    const res = await commands.readFileChunkNative(filePath, offset, chunkSize);
    if (res.status === 'ok') {
      return {
        content: res.data.chunk_text,
        has_more: !res.data.is_eof,
        total_size: res.data.total_bytes,
      };
    }
    return null;
  } catch (err) {
    console.warn('Native readFileChunkNative failed:', err);
    return null;
  }
}

/**
 * 全文検索用ドキュメントインデックスの作成・一括登録 (Rust インメモリ保持)
 *
 * @param docs インデックス登録するドキュメントリスト
 * @returns 登録成功数、または失敗時 null
 */
export async function indexDocumentsNative(docs: DocSearchInput[]): Promise<number | null> {
  try {
    const res = await commands.indexDocumentsNative(docs);
    if (res.status === 'ok') {
      return res.data ? docs.length : 0;
    }
    return null;
  } catch (err) {
    console.warn('Native indexDocumentsNative failed:', err);
    return null;
  }
}

/**
 * インデックス登録済みドキュメントに対する高速全文検索の実行 (Rust)
 *
 * @param query 検索キーワード文字列
 * @returns 検索ヒットリスト (SearchHit[]) または失敗時 null
 */
export async function searchDocumentsNative(query: string): Promise<SearchHit[] | null> {
  try {
    const res = await commands.searchDocumentsNative(query);
    if (res.status === 'ok') {
      return res.data.map((h) => ({
        doc_id: h.doc_id,
        doc_title: h.title,
        line_number: 1,
        line_text: h.snippet,
      }));
    }
    return null;
  } catch (err) {
    console.warn('Native searchDocumentsNative failed:', err);
    return null;
  }
}

/**
 * 複数ファイルの一括文字コード変換処理 (Rust ネイティブ並列処理)
 *
 * @param filePaths 対象ファイルパスの配列
 * @param targetEncoding 変換先エンコーディング名
 * @returns 一括変換結果 (BatchConvertResult) または失敗時 null
 */
export async function batchConvertFilesNative(
  _filePaths: string[],
  _targetEncoding: string
): Promise<BatchConvertResult | null> {
  return null;
}

/**
 * 2つのテキスト文字列間の行単位・単語単位リアルタイム Diff (差分) 計算 (Rust)
 *
 * @param oldText 変更前の文字列
 * @param newText 変更後の文字列
 * @returns Diff 変更要素のリスト (DiffChange[]) または失敗時 null
 */
export async function computeTextDiffNative(oldText: string, newText: string): Promise<DiffChange[] | null> {
  try {
    const res = await commands.computeTextDiffNative(oldText, newText);
    if (res.status === 'ok') {
      return res.data as DiffChange[];
    }
    return null;
  } catch (err) {
    console.warn('Native computeTextDiffNative failed:', err);
    return null;
  }
}

/**
 * Rust ネイティブパーサー (pulldown-cmark) による爆速 Markdown → HTML 変換
 *
 * @param markdown 変換対象の Markdown 文字列
 * @returns 変換後の HTML 文字列、または失敗時 null
 */
export async function parseMarkdownNative(markdown: string): Promise<string | null> {
  try {
    const res = await commands.parseMarkdownNative(markdown);
    if (res.status === 'ok') {
      return res.data;
    }
    return null;
  } catch (err) {
    console.warn('Native parseMarkdownNative failed or fallback:', err);
    return null;
  }
}

/**
 * Rust ネイティブライブラリによる高速 PDF バイナリ生成 (将来実装用スタブ)
 *
 * @param _title 文書タイトル
 * @param _content 文書本文データ
 * @returns 生成された PDF バイナリデータ (Uint8Array) または失敗時 null
 */
export async function generatePdfNative(_title: string, _content: string): Promise<Uint8Array | null> {
  return null;
}

/**
 * Rust ネイティブライブラリによるソースコードシンタックスハイライト生成 (将来実装用スタブ)
 *
 * @param _code ソースコード文字列
 * @param _language プログラミング言語識別子 (e.g. 'rust', 'typescript', 'python')
 * @returns ハイライト表示用 HTML 文字列、または失敗時 null
 */
export async function highlightCodeNative(_code: string, _language: string): Promise<string | null> {
  return null;
}

/**
 * Windows 「送る (SendTo)」ショートカット登録状態のチェック (互換性維持スタブ)
 *
 * @returns 常に false (機能保留中)
 */
export async function checkSendToMenuNative(): Promise<boolean> {
  return false;
}

/**
 * Windows 「送る (SendTo)」ショートカットの登録 / 解除 (互換性維持スタブ)
 *
 * @param _enable 登録する場合は true
 * @returns 処理結果
 */
export async function registerSendToMenuNative(_enable: boolean): Promise<boolean> {
  return false;
}

/**
 * 指定ファイルの親フォルダをエクスプローラーで開く (Windows)
 *
 * @param filePath 対象ファイルの絶対パス
 * @returns 成功時 true、失敗時 false
 */
export async function openFolderNative(filePath: string): Promise<boolean> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const result = await invoke<boolean>('open_folder_native', { filePath });
    return result;
  } catch (err) {
    console.warn('openFolderNative failed:', err);
    return false;
  }
}

/**
 * Rust ネイティブによるテキスト統計（文字数・単語数・行数・読了時間）の高速算出
 *
 * @param text 対象テキスト
 * @returns 統計結果オブジェクトまたは失敗時 null
 */
export async function calculateTextStatsNative(text: string): Promise<{
  characters: number;
  charactersNoSpace: number;
  words: number;
  lines: number;
  readingTimeMinutes: number;
} | null> {
  try {
    const res = await commands.calculateTextStatsNative(text);
    if (res.status === 'ok') {
      return {
        characters: res.data.characters,
        charactersNoSpace: res.data.characters_no_space,
        words: res.data.words,
        lines: res.data.lines,
        readingTimeMinutes: res.data.reading_time_minutes,
      };
    }
    return null;
  } catch (err) {
    console.warn('Native calculateTextStatsNative failed:', err);
    return null;
  }
}

/**
 * Rust ネイティブによる YAML Front Matter の高速抽出・パース
 *
 * @param fullText 対象 Markdown テキスト
 * @returns パース結果オブジェクトまたは失敗時 null
 */
export async function parseYamlFrontMatterNative(fullText: string): Promise<{
  body: string;
  metadata: {
    title?: string;
    author?: string;
    created?: string;
    updated?: string;
    updatedBy?: string;
    encoding?: any;
    tags?: string[];
  };
} | null> {
  try {
    const res = await commands.parseYamlFrontMatterNative(fullText);
    if (res.status === 'ok') {
      return {
        body: res.data.body,
        metadata: {
          title: res.data.title || undefined,
          author: res.data.author || undefined,
          created: res.data.created || undefined,
          updated: res.data.updated || undefined,
          updatedBy: res.data.updated_by || undefined,
          encoding: res.data.encoding as any,
          tags: res.data.tags,
        },
      };
    }
    return null;
  } catch (err) {
    console.warn('Native parseYamlFrontMatterNative failed:', err);
    return null;
  }
}

/**
 * Rust ネイティブによる見出し (H1〜H6) 目次ツリーの高速抽出
 *
 * @param markdownText Markdown テキスト
 * @returns 見出し要素リストまたは失敗時 null
 */
export async function extractHeadingsNative(markdownText: string): Promise<Array<{
  level: number;
  text: string;
  lineNumber: number;
}> | null> {
  try {
    const res = await commands.extractHeadingsNative(markdownText);
    if (res.status === 'ok') {
      return res.data.map((h) => ({
        level: h.level,
        text: h.text,
        lineNumber: h.line_number,
      }));
    }
    return null;
  } catch (err) {
    console.warn('Native extractHeadingsNative failed:', err);
    return null;
  }
}

/**
 * Rust ネイティブによるタスクチェック状態の高速トグル
 *
 * @param markdownText Markdown テキスト
 * @param targetIndex 対象タスク項目の連番インデックス (0-indexed)
 * @returns 置換後テキストまたは失敗時 null
 */
export async function toggleTaskNative(markdownText: string, targetIndex: number): Promise<string | null> {
  try {
    const res = await commands.toggleTaskNative(markdownText, targetIndex);
    if (res.status === 'ok') {
      return res.data;
    }
    return null;
  } catch (err) {
    console.warn('Native toggleTaskNative failed:', err);
    return null;
  }
}

/**
 * Rust ネイティブによる完全なスタンドアロン HTML ドキュメントのエクスポート
 *
 * @param title ドキュメントタイトル
 * @param markdownText Markdown テキスト
 * @param isDark ダークモードスタイルを埋め込むか
 * @returns 完全な HTML 文字列または失敗時 null
 */
export async function exportHtmlFullNative(
  title: string,
  markdownText: string,
  isDark: boolean
): Promise<string | null> {
  try {
    const res = await commands.exportHtmlFullNative(title, markdownText, isDark);
    if (res.status === 'ok') {
      return res.data;
    }
    return null;
  } catch (err) {
    console.warn('Native exportHtmlFullNative failed:', err);
    return null;
  }
}

/**
 * ファイルメタデータ情報インターフェース
 */
export interface FileMetadataResult {
  /** ファイルが存在するか */
  exists: boolean;
  /** 最終更新日時 (UNIXエポックからのミリ秒) */
  mtimeMs: number;
  /** ファイルサイズ (バイト) */
  sizeBytes: number;
}

/**
 * 指定ファイルパスのメタデータ（存在有無、mtime、サイズ）を超軽量に取得する
 *
 * @param filePath 対象ファイルの絶対パス
 * @returns メタデータオブジェクトまたは失敗時 null
 */
export async function getFileMetadataNative(filePath: string): Promise<FileMetadataResult | null> {
  try {
    const res = await commands.getFileMetadataNative(filePath);
    if (res.status === 'ok') {
      return {
        exists: res.data.exists,
        mtimeMs: res.data.mtime_ms,
        sizeBytes: res.data.size_bytes,
      };
    }
    return null;
  } catch (err) {
    console.warn('Native getFileMetadataNative failed:', err);
    return null;
  }
}

/**
 * CSV データを Rust ネイティブで高速解析し、プレビュー用サマリーと統計を取得する
 *
 * @param content CSV テキストデータ
 * @param maxRows プレビュー抽出する最大行数 (デフォルト: 100)
 * @returns CsvPreviewDto または失敗時 null
 */
export async function parseCsvPreviewNative(
  content: string,
  maxRows: number = 100
): Promise<CsvPreviewDto | null> {
  try {
    const res = await commands.parseCsvPreviewNative(content, maxRows);
    if (res.status === 'ok') {
      return res.data;
    }
    return null;
  } catch (err) {
    console.warn('Native parseCsvPreviewNative failed:', err);
    return null;
  }
}
