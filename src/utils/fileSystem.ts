import { open, save } from '@tauri-apps/plugin-dialog';
import { readFile, writeTextFile, writeFile } from '@tauri-apps/plugin-fs';
import { commands } from '../bindings';
import { MarkdownDoc, SupportedEncoding } from '../types';
import { decodeFileContent } from './encodingUtils';
import { parseYamlFrontMatter, buildFullMarkdownWithFrontMatter } from './yamlUtils';
import { convertToEncodingNative } from './tauriNative';
import { logger } from './logger';

/**
 * ファイルオープン成功時の戻り値結果インターフェース
 */
export interface OpenedFileResult {
  /** 構築された MarkdownDoc ドキュメントオブジェクト */
  doc: MarkdownDoc;
  /** 開かれた実ファイルの絶対パス */
  filePath: string;
}

/**
 * 対象ドキュメントが CSV ファイルであるかを判定します
 *
 * @param doc 判定対象のドキュメント
 * @returns CSV の場合 true
 */
export function isCsvDoc(doc?: MarkdownDoc | null): boolean {
  if (!doc) return false;
  if (doc.isCsv) return true;
  if (doc.filePath && /\.csv$/i.test(doc.filePath)) return true;
  if (doc.title && /\.csv$/i.test(doc.title)) return true;
  return false;
}

/**
 * ファイル保存処理の結果インターフェース
 */
export interface SaveFileResult {
  /** 保存処理が成功したかどうか */
  success: boolean;
  /** 保存先のファイルパス */
  filePath?: string;
  /** 「名前を付けて保存」として保存されたかどうか */
  isSaveAs?: boolean;
  /** 失敗時のエラーメッセージ */
  error?: string;
}

/**
 * 指定された絶対パスから直接ローカルファイルを読み込み、MarkdownDoc オブジェクトを構築します。
 * (Rust ネイティブ読み込みを最優先し、失敗時は JS plugin-fs へ安全にフォールバックします)
 *
 * @param filePath 読み込む対象の絶対ファイルパス
 * @returns 読み込み成功時は OpenedFileResult、失敗時は null
 */
export async function openNativeFileFromPath(
  filePath: string,
  options: { loadFull?: boolean; initialChunkSize?: number } = {}
): Promise<OpenedFileResult | null> {
  const cleanPath = filePath.trim().replace(/^"|"$/g, '');
  if (!cleanPath) return null;

  try {
    let text = '';
    let encoding: SupportedEncoding = 'UTF-8';
    let isChunkedLoaded = false;
    let loadedBytes = 0;
    let totalSizeBytes = 0;

    const isCsvFile = /\.csv$/i.test(cleanPath);

    // メタデータの確認 (大容量判定)
    let fileSize = 0;
    try {
      const metaRes = await commands.getFileMetadataNative(cleanPath);
      if (metaRes.status === 'ok' && metaRes.data.exists) {
        fileSize = metaRes.data.size_bytes;
        totalSizeBytes = fileSize;
      }
    } catch {
      // メタデータ取得不可時は通常ロードへ
    }

    // 500KB 超のテキスト、または 300KB 超の CSV ファイルは大容量高速チャンクロード (0.01秒でオープン)
    const isLargeFile = !options.loadFull && fileSize > (isCsvFile ? 300 * 1024 : 500 * 1024);

    if (isLargeFile) {
      const initialChunkBytes = options.initialChunkSize || 150 * 1024; // 冒頭 約1,500行分
      const chunkRes = await commands.readFileChunkNative(cleanPath, 0, initialChunkBytes);
      if (chunkRes.status === 'ok') {
        text = chunkRes.data.chunk_text;
        loadedBytes = text.length;
        isChunkedLoaded = !chunkRes.data.is_eof;
      }
    }

    // チャンクロード未実行または失敗時は通常読込
    if (!text) {
      try {
        const nativeRes = await commands.readFileNative(cleanPath);
        if (nativeRes.status === 'ok') {
          text = nativeRes.data.text;
          encoding = (nativeRes.data.encoding as SupportedEncoding) || 'UTF-8';
          totalSizeBytes = totalSizeBytes || text.length;
          loadedBytes = text.length;
        } else {
          throw new Error(nativeRes.error);
        }
      } catch (nativeErr) {
        // フォールバック: JS plugin-fs で読み込み
        const fileBytes = await readFile(cleanPath);
        const decoded = decodeFileContent(fileBytes);
        text = decoded.text;
        encoding = decoded.encoding;
        totalSizeBytes = fileBytes.length;
        loadedBytes = text.length;
      }
    }

    const { body, metadata } = isCsvFile ? { body: text, metadata: {} as any } : parseYamlFrontMatter(text);
    const fileNameWithExt = cleanPath.split(/[/\\]/).pop() || '無題のドキュメント';
    const defaultTitle = fileNameWithExt.replace(/\.[^/.]+$/, '') || fileNameWithExt;

    const doc: MarkdownDoc = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: metadata.title || defaultTitle,
      author: metadata.author || 'Unknown',
      updatedBy: metadata.updatedBy || metadata.author || 'Unknown',
      content: isCsvFile ? text : body,
      encoding: (metadata.encoding as SupportedEncoding) || encoding,
      createdAt: metadata.created || new Date().toISOString(),
      updatedAt: metadata.updated || new Date().toISOString(),
      tags: metadata.tags || [],
      filePath: cleanPath,
      isFavorite: false,
      isRemote: false,
      isCsv: isCsvFile,
      isChunkedLoaded,
      loadedBytes,
      totalSizeBytes,
    };

    return { doc, filePath: cleanPath };
  } catch (err: any) {
    logger.error(
      `[ファイル読み込み失敗] ファイルが開けませんでした: ${err?.message || err}`,
      `対象パス: ${cleanPath}`
    );
    console.error('openNativeFileFromPath failed:', err);
    return null;
  }
}

/**
 * Tauri ネイティブのファイル選択ダイアログを開き、ユーザーが選択したファイルパスからドキュメントを読み込みます。
 *
 * @returns 選択および読み込み成功時は OpenedFileResult、キャンセルまたは失敗時は null
 */
export async function openNativeFileDialog(): Promise<OpenedFileResult | null> {
  try {
    const selected = await open({
      multiple: false,
      directory: false,
      filters: [
        {
          name: 'Markdown / Text Document',
          extensions: ['md', 'markdown', 'txt', 'mdown', 'mkd'],
        },
        {
          name: 'CSV File (*.csv)',
          extensions: ['csv'],
        },
        {
          name: 'All Files',
          extensions: ['*'],
        },
      ],
    });

    if (!selected || Array.isArray(selected)) {
      return null;
    }

    const filePath = selected as string;
    return await openNativeFileFromPath(filePath);
  } catch (err) {
    console.warn('Native openNativeFileDialog error or fallback:', err);
    return null;
  }
}

/**
 * ドキュメントをローカル実ファイルへ直接上書き保存、または指定パスへ保存します。
 * (非 UTF-8 エンコーディングの場合は Rust ネイティブコンバーター経由でエンコードして書き込みます)
 *
 * @param doc 保存対象の MarkdownDoc オブジェクト
 * @param options オプション設定 (forceSaveAs: 強制的に「名前を付けて保存」ダイアログを表示するかどうか)
 * @returns 保存処理結果 (SaveFileResult)
 */
export async function saveNativeFile(
  doc: MarkdownDoc,
  options: { forceSaveAs?: boolean; defaultAuthor?: string } = {}
): Promise<SaveFileResult> {
  try {
    const isCsv = isCsvDoc(doc);
    let targetPath = doc.filePath;
    let isSaveAs = false;

    // パス未指定、または「名前を付けて保存」、またはリモートファイルの場合ダイアログ表示
    if (!targetPath || options.forceSaveAs || doc.isRemote) {
      isSaveAs = true;
      const defaultFileName = isCsv ? `${doc.title || 'table'}.csv` : `${doc.title || 'document'}.md`;
      const selected = await save({
        defaultPath: targetPath || defaultFileName,
        filters: isCsv
          ? [
              {
                name: 'CSV File (*.csv)',
                extensions: ['csv'],
              },
              {
                name: 'All Files',
                extensions: ['*'],
              },
            ]
          : [
              {
                name: 'Markdown Document (*.md)',
                extensions: ['md'],
              },
              {
                name: 'Text File (*.txt)',
                extensions: ['txt'],
              },
              {
                name: 'CSV File (*.csv)',
                extensions: ['csv'],
              },
            ],
      });

      if (!selected) {
        return { success: false, error: 'Canceled by user' };
      }
      targetPath = selected;
    }

    // 保存先パスが CSV の場合、または CSV ドキュメントの場合は Front Matter を絶対に付与しない
    const isFinalCsv = isCsv || /\.csv$/i.test(targetPath);
    const textToSave = isFinalCsv ? doc.content : buildFullMarkdownWithFrontMatter(doc, options.defaultAuthor);
    const encoding = doc.encoding || 'UTF-8';

    // バイト配列の生成 (エンコーディング対応)
    let bytesToSave: Uint8Array | null = null;
    if (encoding !== 'UTF-8') {
      bytesToSave = await convertToEncodingNative(textToSave, encoding);
    }

    // ファイル書き込み実行 (Rust ネイティブ書き込みを優先し、JS Capability 制限を完全回避)
    try {
      const bytes = bytesToSave ? Array.from(bytesToSave) : Array.from(new TextEncoder().encode(textToSave));
      const nativeWriteRes = await commands.writeFileBytesNative(targetPath, bytes);
      if (nativeWriteRes.status !== 'ok') {
        throw new Error(nativeWriteRes.error);
      }
    } catch (nativeWriteErr) {
      // フォールバック: JS plugin-fs で書き込み
      if (bytesToSave) {
        await writeFile(targetPath, bytesToSave);
      } else {
        await writeTextFile(targetPath, textToSave);
      }
    }

    return {
      success: true,
      filePath: targetPath,
      isSaveAs,
    };
  } catch (err: any) {
    console.error('saveNativeFile failed:', err);
    return {
      success: false,
      error: err?.message || String(err),
    };
  }
}

/**
 * 遅延読み込み中のドキュメントの全文を実ファイルから完全ロードします。
 *
 * @param doc 対象の MarkdownDoc
 * @returns 完全ロードされた MarkdownDoc、失敗時は null
 */
export async function loadFullNativeDoc(doc: MarkdownDoc): Promise<MarkdownDoc | null> {
  if (!doc.filePath) return null;
  const res = await openNativeFileFromPath(doc.filePath, { loadFull: true });
  if (res && res.doc) {
    return {
      ...doc,
      content: res.doc.content,
      isChunkedLoaded: false,
      loadedBytes: res.doc.loadedBytes,
      totalSizeBytes: res.doc.totalSizeBytes,
    };
  }
  return null;
}

/**
 * 遅延読み込み中のドキュメントに次のチャンクを追加読み込みして結合します。
 *
 * @param doc 対象の MarkdownDoc
 * @param chunkSize 追加で読み込むバイトサイズ (デフォルト: 200KB)
 * @returns 更新された MarkdownDoc、失敗時は null
 */
export async function loadMoreChunkNativeDoc(
  doc: MarkdownDoc,
  chunkSize: number = 200 * 1024
): Promise<MarkdownDoc | null> {
  if (!doc.filePath || !doc.isChunkedLoaded) return null;

  try {
    const currentOffset = doc.loadedBytes || doc.content.length;
    const chunkRes = await commands.readFileChunkNative(doc.filePath, currentOffset, chunkSize);

    if (chunkRes.status === 'ok') {
      const nextContent = doc.content + chunkRes.data.chunk_text;
      const nextLoadedBytes = currentOffset + chunkRes.data.chunk_text.length;
      const isStillChunked = !chunkRes.data.is_eof;

      return {
        ...doc,
        content: nextContent,
        isChunkedLoaded: isStillChunked,
        loadedBytes: nextLoadedBytes,
      };
    }
    return null;
  } catch (err) {
    console.error('loadMoreChunkNativeDoc failed:', err);
    return null;
  }
}
