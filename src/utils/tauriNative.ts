import { commands } from '../bindings';

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
      return res.data;
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
      return res.data;
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
      return res.data;
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
  filePaths: string[],
  targetEncoding: string
): Promise<BatchConvertResult | null> {
  try {
    const items = filePaths.map((fp) => ({ file_path: fp, target_encoding: targetEncoding }));
    const res = await commands.batchConvertFilesNative(items);
    if (res.status === 'ok') {
      return res.data;
    }
    return null;
  } catch (err) {
    console.warn('Native batchConvertFilesNative failed:', err);
    return null;
  }
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
 * Rust ネイティブライブラリ (printpdf) による高速 PDF バイナリ生成
 *
 * @param title 文書タイトル
 * @param content 文書本文データ
 * @returns 生成された PDF バイナリデータ (Uint8Array) または失敗時 null
 */
export async function generatePdfNative(title: string, content: string): Promise<Uint8Array | null> {
  try {
    const res = await commands.generatePdfNative(title, content);
    if (res.status === 'ok') {
      return new Uint8Array(res.data);
    }
    return null;
  } catch (err) {
    console.warn('Native generatePdfNative failed or fallback:', err);
    return null;
  }
}

/**
 * Rust ネイティブライブラリ (syntect) によるソースコードシンタックスハイライト生成
 *
 * @param code ソースコード文字列
 * @param language プログラミング言語識別子 (e.g. 'rust', 'typescript', 'python')
 * @returns ハイライト表示用 HTML 文字列、または失敗時 null
 */
export async function highlightCodeNative(code: string, language: string): Promise<string | null> {
  try {
    const res = await commands.highlightCodeNative(code, language);
    if (res.status === 'ok') {
      return res.data;
    }
    return null;
  } catch (err) {
    console.warn('Native highlightCodeNative failed or fallback:', err);
    return null;
  }
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
