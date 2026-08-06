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
export async function openNativeFileFromPath(filePath: string): Promise<OpenedFileResult | null> {
  const cleanPath = filePath.trim().replace(/^"|"$/g, '');
  if (!cleanPath) return null;

  try {
    let text = '';
    let encoding: SupportedEncoding = 'UTF-8';

    // まず Rust ネイティブ読み込み (C/C++・パーミッションフリー) を実行
    try {
      const nativeRes = await commands.readFileNative(cleanPath);
      if (nativeRes.status === 'ok') {
        text = nativeRes.data.text;
        encoding = (nativeRes.data.encoding as SupportedEncoding) || 'UTF-8';
      } else {
        logger.warn(
          `[Rust Native 読み込み失敗] ${nativeRes.error} (JS plugin-fs にフォールバックします)`,
          `パス: ${cleanPath}`
        );
        throw new Error(nativeRes.error);
      }
    } catch (nativeErr) {
      // フォールバック: JS plugin-fs で読み込み
      const fileBytes = await readFile(cleanPath);
      const decoded = decodeFileContent(fileBytes);
      text = decoded.text;
      encoding = decoded.encoding;
    }

    const { body, metadata } = parseYamlFrontMatter(text);
    const fileNameWithExt = cleanPath.split(/[/\\]/).pop() || '無題のドキュメント';
    const defaultTitle = fileNameWithExt.replace(/\.[^/.]+$/, '') || fileNameWithExt;

    const doc: MarkdownDoc = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: metadata.title || defaultTitle,
      author: metadata.author || 'Unknown',
      updatedBy: metadata.updatedBy || metadata.author || 'Unknown',
      content: body,
      encoding: (metadata.encoding as SupportedEncoding) || encoding,
      createdAt: metadata.created || new Date().toISOString(),
      updatedAt: metadata.updated || new Date().toISOString(),
      tags: metadata.tags || [],
      filePath: cleanPath,
      isFavorite: false,
      isRemote: false,
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
    const fullMarkdownText = buildFullMarkdownWithFrontMatter(doc, options.defaultAuthor);
    const encoding = doc.encoding || 'UTF-8';

    // バイト配列の生成 (エンコーディング対応)
    let bytesToSave: Uint8Array | null = null;
    if (encoding !== 'UTF-8') {
      bytesToSave = await convertToEncodingNative(fullMarkdownText, encoding);
    }

    let targetPath = doc.filePath;
    let isSaveAs = false;

    // パス未指定、または「名前を付けて保存」、またはリモートファイルの場合ダイアログ表示
    if (!targetPath || options.forceSaveAs || doc.isRemote) {
      isSaveAs = true;
      const defaultFileName = `${doc.title || 'document'}.md`;
      const selected = await save({
        defaultPath: targetPath || defaultFileName,
        filters: [
          {
            name: 'Markdown Document (*.md)',
            extensions: ['md'],
          },
          {
            name: 'Text File (*.txt)',
            extensions: ['txt'],
          },
        ],
      });

      if (!selected) {
        return { success: false, error: 'Canceled by user' };
      }
      targetPath = selected;
    }

    // ファイル書き込み実行 (Rust ネイティブ書き込みを優先し、JS Capability 制限を完全回避)
    try {
      if (bytesToSave) {
        const nativeWriteRes = await commands.writeFileBytesNative(targetPath, Array.from(bytesToSave));
        if (nativeWriteRes.status !== 'ok') {
          throw new Error(nativeWriteRes.error);
        }
      } else {
        const nativeWriteRes = await commands.writeFileNative(targetPath, fullMarkdownText);
        if (nativeWriteRes.status !== 'ok') {
          throw new Error(nativeWriteRes.error);
        }
      }
    } catch (nativeWriteErr) {
      // フォールバック: JS plugin-fs で書き込み
      if (bytesToSave) {
        await writeFile(targetPath, bytesToSave);
      } else {
        await writeTextFile(targetPath, fullMarkdownText);
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
