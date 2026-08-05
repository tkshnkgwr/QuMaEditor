import { invoke } from '@tauri-apps/api/core';

export interface ConvertedTextResult {
  text: string;
  encoding: 'UTF-8' | 'Shift_JIS' | 'EUC-JP';
}

export interface ChunkResult {
  content: string;
  has_more: boolean;
  total_size: number;
}

export interface DocSearchInput {
  id: string;
  title: string;
  content: string;
}

export interface SearchHit {
  doc_id: string;
  doc_title: string;
  line_number: number;
  line_text: string;
}

export interface BatchConvertResult {
  success_count: number;
  failure_count: number;
  messages: string[];
}

export interface DiffChange {
  tag: 'insert' | 'delete' | 'equal';
  value: string;
  old_line?: number;
  new_line?: number;
}

/**
 * Rust ネイティブコマンドによる文字コード自動判別＆UTF-8変換
 */
export async function detectAndConvertNative(bytes: Uint8Array): Promise<ConvertedTextResult | null> {
  try {
    const res = await invoke<ConvertedTextResult>('detect_and_convert_to_utf8', {
      bytes: Array.from(bytes),
    });
    return res;
  } catch (err) {
    console.warn('Native detect_and_convert_to_utf8 failed or fallback:', err);
    return null;
  }
}

/**
 * Rust ネイティブコマンドによる指定エンコーディングへの変換
 */
export async function convertToEncodingNative(text: string, encoding: string): Promise<Uint8Array | null> {
  try {
    const res = await invoke<number[]>('convert_utf8_to_encoding', {
      text,
      encoding,
    });
    return new Uint8Array(res);
  } catch (err) {
    console.warn('Native convert_utf8_to_encoding failed or fallback:', err);
    return null;
  }
}

/**
 * 1. 大容量ファイルのストリーミング分割読み込み (Rust)
 */
export async function readFileChunkNative(
  filePath: string,
  offset: number,
  chunkSize: number = 512 * 1024
): Promise<ChunkResult | null> {
  try {
    const res = await invoke<ChunkResult>('read_file_chunk_native', {
      filePath,
      offset,
      chunkSize,
    });
    return res;
  } catch (err) {
    console.warn('Native read_file_chunk_native failed:', err);
    return null;
  }
}

/**
 * 2-A. ドキュメント群をリアルタイム全文検索インデックスに登録 (Rust)
 */
export async function indexDocumentsNative(docs: DocSearchInput[]): Promise<number | null> {
  try {
    const res = await invoke<number>('index_documents_native', { docs });
    return res;
  } catch (err) {
    console.warn('Native index_documents_native failed:', err);
    return null;
  }
}

/**
 * 2-B. リアルタイム全文検索を実行 (Rust)
 */
export async function searchDocumentsNative(query: string): Promise<SearchHit[] | null> {
  try {
    const res = await invoke<SearchHit[]>('search_documents_native', { query });
    return res;
  } catch (err) {
    console.warn('Native search_documents_native failed:', err);
    return null;
  }
}

/**
 * 3. 複数ファイルの一括文字コード変換 (Rust並列処理)
 */
export async function batchConvertFilesNative(
  filePaths: string[],
  targetEncoding: string,
  outputDir?: string
): Promise<BatchConvertResult | null> {
  try {
    const res = await invoke<BatchConvertResult>('batch_convert_files_native', {
      filePaths,
      targetEncoding,
      outputDir: outputDir || null,
    });
    return res;
  } catch (err) {
    console.warn('Native batch_convert_files_native failed:', err);
    return null;
  }
}

/**
 * 4. タブ間・バージョン間のリアルタイム Text Diff 高速計算 (Rust)
 */
export async function computeTextDiffNative(oldText: string, newText: string): Promise<DiffChange[] | null> {
  try {
    const res = await invoke<DiffChange[]>('compute_text_diff_native', { oldText, newText });
    return res;
  } catch (err) {
    console.warn('Native compute_text_diff_native failed:', err);
    return null;
  }
}

/**
 * Rust ネイティブコマンド (pulldown-cmark) による爆速 Markdown 解析
 */
export async function parseMarkdownNative(markdown: string): Promise<string | null> {
  try {
    const res = await invoke<string>('parse_markdown_native', { markdown });
    return res;
  } catch (err) {
    console.warn('Native parse_markdown_native failed or fallback:', err);
    return null;
  }
}

/**
 * Rust ネイティブコマンド (printpdf) によるブラウザ非依存 PDF 直接作成
 */
export async function generatePdfNative(title: string, content: string): Promise<Uint8Array | null> {
  try {
    const res = await invoke<number[]>('generate_pdf_native', { title, content });
    return new Uint8Array(res);
  } catch (err) {
    console.warn('Native generate_pdf_native failed or fallback:', err);
    return null;
  }
}

/**
 * Rust ネイティブコマンド (syntect) によるコードハイライト作成
 */
export async function highlightCodeNative(code: string, language: string): Promise<string | null> {
  try {
    const res = await invoke<string>('highlight_code_native', { code, language });
    return res;
  } catch (err) {
    console.warn('Native highlight_code_native failed or fallback:', err);
    return null;
  }
}

/**
 * Rust ネイティブコマンドによる Windows 「送る (SendTo)」 メニューのショートカット登録・解除
 */
export async function registerSendToMenuNative(enable: boolean): Promise<boolean> {
  try {
    const res = await invoke<boolean>('register_sendto_menu_native', { enable });
    return res;
  } catch (err) {
    console.warn('register_sendto_menu_native failed:', err);
    return false;
  }
}

/**
 * Rust ネイティブコマンドによる Windows 「送る (SendTo)」 メニュー登録状態チェック
 */
export async function checkSendToMenuNative(): Promise<boolean> {
  try {
    const res = await invoke<boolean>('check_sendto_menu_native');
    return res;
  } catch (err) {
    console.warn('check_sendto_menu_native failed:', err);
    return false;
  }
}
