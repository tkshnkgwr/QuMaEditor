import { open, save } from '@tauri-apps/plugin-dialog';
import { readFile, writeTextFile, writeFile } from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';
import { MarkdownDoc, SupportedEncoding } from '../types';
import { decodeFileContent } from './encodingUtils';
import { parseYamlFrontMatter, buildFullMarkdownWithFrontMatter } from './yamlUtils';
import { convertToEncodingNative } from './tauriNative';

export interface OpenedFileResult {
  doc: MarkdownDoc;
  filePath: string;
}

export interface SaveFileResult {
  success: boolean;
  filePath?: string;
  isSaveAs?: boolean;
  error?: string;
}

/**
 * 指定された絶対パスから直接ファイルを読み込み、MarkdownDoc オブジェクトを構築します。
 */
export async function openNativeFileFromPath(filePath: string): Promise<OpenedFileResult | null> {
  try {
    let text = '';
    let encoding: SupportedEncoding = 'UTF-8';

    // まず Rust ネイティブ読み込み (C/C++級・パーミッションフリー) を試行
    try {
      const nativeRes = await invoke<{ text: string; encoding: string }>('read_file_native', { filePath });
      if (nativeRes && nativeRes.text) {
        text = nativeRes.text;
        encoding = (nativeRes.encoding as SupportedEncoding) || 'UTF-8';
      }
    } catch (nativeErr) {
      // フォールバック: JS plugin-fs で読込
      const fileBytes = await readFile(filePath);
      const decoded = decodeFileContent(fileBytes);
      text = decoded.text;
      encoding = decoded.encoding;
    }

    const { body, metadata } = parseYamlFrontMatter(text);
    const fileNameWithExt = filePath.split(/[/\\]/).pop() || '無題のドキュメント';
    const defaultTitle = fileNameWithExt.replace(/\.[^/.]+$/, '') || fileNameWithExt;

    const doc: MarkdownDoc = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: metadata.title || defaultTitle,
      content: body,
      encoding: (metadata.encoding as SupportedEncoding) || encoding,
      createdAt: metadata.created || new Date().toISOString(),
      updatedAt: metadata.updated || new Date().toISOString(),
      tags: metadata.tags || [],
      filePath,
      isFavorite: false,
      isRemote: false,
    };

    return { doc, filePath };
  } catch (err) {
    console.error('openNativeFileFromPath failed:', err);
    return null;
  }
}

/**
 * Tauri ネイティブのダイアログでファイルを選択し、絶対パスと内容を読み込みます。
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
 * Tauri ネイティブでドキュメントを保存します。
 * - filePath が存在し forceSaveAs=false かつ !isRemote の場合 ➔ 元ファイルへ直上書き保存
 * - それ以外 ➔ 名前を付けて保存ダイアログを表示
 */
export async function saveNativeFile(
  doc: MarkdownDoc,
  options: { forceSaveAs?: boolean } = {}
): Promise<SaveFileResult> {
  try {
    const fullMarkdownText = buildFullMarkdownWithFrontMatter(doc);
    const encoding = doc.encoding || 'UTF-8';

    // バイト配列の生成（エンコーディング対応）
    let bytesToSave: Uint8Array | null = null;
    if (encoding !== 'UTF-8') {
      bytesToSave = await convertToEncodingNative(fullMarkdownText, encoding);
    }

    let targetPath = doc.filePath;
    let isSaveAs = false;

    // パスが無い、または「名前を付けて保存」、またはリモートファイルからの初保存の場合ダイアログ表示
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

    // ファイル書き込み実行
    if (bytesToSave) {
      await writeFile(targetPath, bytesToSave);
    } else {
      await writeTextFile(targetPath, fullMarkdownText);
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
