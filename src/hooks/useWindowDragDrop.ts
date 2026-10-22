import React, { useState, useEffect, useCallback } from 'react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { readFile } from '@tauri-apps/plugin-fs';
import { commands } from '../bindings';
import { MarkdownDoc, SupportedEncoding } from '../types';
import { openNativeFileFromPath } from '../utils/fileSystem';
import { parseYamlFrontMatter } from '../utils/yamlUtils';
import { logger } from '../utils/logger';

interface UseWindowDragDropParams {
  handleAddOpenedDoc: (doc: MarkdownDoc) => void;
  handleFormat: (type: string, value?: string) => void;
  defaultAuthor?: string;
}

/**
 * ウィンドウ全体およびエディタ領域へのドラッグ＆ドロップ操作を管理するカスタムフック
 * - 画像ファイルドロップ時: Base64/DataURL にエンコードして Markdown 記法としてエディタに即時挿入
 * - Markdown / テキストファイルドロップ時: 自動的にタブを開いてドキュメントとしてロード
 * - Tauri ネイティブウィンドウ D&D イベントおよび HTML5 標準 D&D イベントの両方に対応
 */
export function useWindowDragDrop({
  handleAddOpenedDoc,
  handleFormat,
  defaultAuthor = 'Unknown',
}: UseWindowDragDropParams) {
  // アプリ全体でのドラッグオーバーレイ状態管理
  const [isAppDraggingOver, setIsAppDraggingOver] = useState(false);

  // パス指定でのファイルドロップ処理 (Tauri ネイティブ Window Drag&Drop 用)
  const handleDroppedPaths = useCallback(
    async (paths: string[]) => {
      if (!paths || paths.length === 0) return;

      for (const path of paths) {
        const cleanPath = path.trim().replace(/^"|"$/g, '');
        if (!cleanPath) continue;

        const ext = cleanPath.split('.').pop()?.toLowerCase() || '';
        const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'].includes(ext);

        if (isImage) {
          try {
            const nativeRes = await commands.readFileNative(cleanPath);
            if (nativeRes.status === 'ok') {
              const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
              const dataUrl = `data:${mimeType};utf8,${encodeURIComponent(nativeRes.data.text)}`;
              handleFormat('image', dataUrl);
            } else {
              const fileBytes = await readFile(cleanPath);
              let binary = '';
              const bytes = new Uint8Array(fileBytes);
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const base64 = btoa(binary);
              const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
              const dataUrl = `data:${mimeType};base64,${base64}`;
              handleFormat('image', dataUrl);
            }
          } catch (e) {
            console.error('Failed to read image path:', cleanPath, e);
          }
        } else {
          // テキストファイルドロップ
          const openResult = await openNativeFileFromPath(cleanPath);
          if (openResult && openResult.doc) {
            handleAddOpenedDoc(openResult.doc);
          }
        }
      }
    },
    [handleAddOpenedDoc, handleFormat]
  );

  // Tauri ネイティブ Window Drag & Drop イベントリスナー
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    const setupDragDropListener = async () => {
      try {
        const win = getCurrentWebviewWindow();
        unlisten = await win.onDragDropEvent(async (event) => {
          const payload = event.payload;
          if (payload.type === 'drop') {
            setIsAppDraggingOver(false);
            if (payload.paths && payload.paths.length > 0) {
              await handleDroppedPaths(payload.paths);
            }
          } else if (payload.type === 'enter' || payload.type === 'over') {
            setIsAppDraggingOver(true);
          } else if (payload.type === 'leave') {
            setIsAppDraggingOver(false);
          }
        });
      } catch (e) {
        console.log('Tauri dragDropEvent listen error:', e);
      }
    };

    setupDragDropListener();
    return () => {
      if (unlisten) unlisten();
    };
  }, [handleDroppedPaths]);

  // ブラウザ（HTML5）レベルでのデフォルト動作防止
  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsAppDraggingOver(false);
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);
    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  // 画像/ファイルのドロップ処理（複数ファイル・画像/テキスト自動判別対応）
  const handleDroppedFiles = useCallback(
    async (files: File[]) => {
      if (!files || files.length === 0) return;

      for (const file of files) {
        const isImage =
          file.type.startsWith('image/') ||
          /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i.test(file.name);

        if (isImage) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            if (dataUrl) {
              handleFormat('image', dataUrl);
            }
          };
          reader.readAsDataURL(file);
        } else {
          // テキスト/ローカルドキュメントの場合: まずネイティブパスで試行
          const nativePath = (file as any).path || (file as any).webkitRelativePath;
          if (nativePath && typeof nativePath === 'string' && nativePath.length > 0) {
            const openResult = await openNativeFileFromPath(nativePath);
            if (openResult && openResult.doc) {
              handleAddOpenedDoc(openResult.doc);
              continue;
            }
          }

          // ネイティブパスが取れない場合のフォールバック（直接ファイル読み取り）
          try {
            const text = await file.text();
            const { body, metadata } = parseYamlFrontMatter(text);
            const fileNameWithExt = file.name || '無題のドキュメント';
            const defaultTitle = fileNameWithExt.replace(/\.[^/.]+$/, '') || fileNameWithExt;

            const doc: MarkdownDoc = {
              id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              title: metadata.title || defaultTitle,
              author: metadata.author || defaultAuthor,
              updatedBy: metadata.updatedBy || metadata.author || defaultAuthor,
              content: body,
              encoding: (metadata.encoding as SupportedEncoding) || 'UTF-8',
              createdAt: metadata.created || new Date().toISOString(),
              updatedAt: metadata.updated || new Date().toISOString(),
              tags: metadata.tags || [],
              summary: metadata.summary,
              summaryType: metadata.summary_type,
              filePath: undefined,
              isFavorite: false,
              isRemote: false,
            };

            handleAddOpenedDoc(doc);
          } catch (err) {
            logger.error(`[ドロップファイル読み込み失敗] ${file.name}: ${err}`);
          }
        }
      }
    },
    [defaultAuthor, handleAddOpenedDoc, handleFormat]
  );

  const handleDroppedFile = useCallback(
    (file: File) => {
      handleDroppedFiles([file]);
    },
    [handleDroppedFiles]
  );

  const handleAppDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    setIsAppDraggingOver(true);
  }, []);

  const handleAppDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsAppDraggingOver(false);
    }
  }, []);

  const handleAppDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsAppDraggingOver(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleDroppedFiles(Array.from(files));
      }
    },
    [handleDroppedFiles]
  );

  return {
    isAppDraggingOver,
    handleAppDragOver,
    handleAppDragLeave,
    handleAppDrop,
    handleDroppedFiles,
    handleDroppedFile,
  };
}
