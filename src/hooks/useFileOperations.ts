import { useCallback } from 'react';
import { MarkdownDoc, EditorSettings, SaveStatus } from '../types';
import { openNativeFileDialog, saveNativeFile, openNativeFileFromPath } from '../utils/fileSystem';
import { decodeFileContent, prepareEncodedBlob } from '../utils/encodingUtils';
import { parseYamlFrontMatter, buildFullMarkdownWithFrontMatter } from '../utils/yamlUtils';
import { generatePdfNative, exportHtmlFullNative } from '../utils/tauriNative';
import { saveStoredDocs } from '../utils/storage';
import { logger } from '../utils/logger';

interface FileOperationsProps {
  currentDoc: MarkdownDoc;
  settings: EditorSettings;
  setDocs: React.Dispatch<React.SetStateAction<MarkdownDoc[]>>;
  setSaveStatus: (status: SaveStatus) => void;
  setLastSavedTime: (time: string | null) => void;
  handleAddOpenedDoc: (doc: MarkdownDoc) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSaveSuccess?: (filePath: string) => void;
}

/**
 * ローカルファイルオープン・直上書き保存/名前を付けて保存・各種エクスポート (Markdown/HTML/PDF)・印刷
 * のロジックを一括処理するカスタムフック
 */
export function useFileOperations({
  currentDoc,
  settings,
  setDocs,
  setSaveStatus,
  setLastSavedTime,
  handleAddOpenedDoc,
  fileInputRef,
  onSaveSuccess,
}: FileOperationsProps) {
  // Markdown ファイルとしてのエクスポート (ダウンロード)
  const handleExportMarkdown = useCallback(() => {
    const exportText = buildFullMarkdownWithFrontMatter(currentDoc);
    const targetEncoding = currentDoc.encoding || 'UTF-8';
    const blob = prepareEncodedBlob(exportText, targetEncoding);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDoc.title || 'document'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    logger.info(`[エクスポート] Markdownを出力しました (${targetEncoding})`, `ファイル名: ${a.download}`);
  }, [currentDoc]);

  // 実ファイルへの保存（直上書き保存 または 名前を付けて保存）
  const handleSaveCurrentDoc = useCallback(
    async (options: { forceSaveAs?: boolean } = {}) => {
      setSaveStatus('saving');

      // Tauri ネイティブ保存の試行
      const res = await saveNativeFile(currentDoc, { defaultAuthor: settings.defaultAuthor, ...options });

      if (res.success && res.filePath) {
        const updatedDocPath = res.filePath;
        const fileNameWithExt = updatedDocPath.split(/[/\\]/).pop() || currentDoc.title;
        const newTitle = res.isSaveAs ? fileNameWithExt.replace(/\.[^/.]+$/, '') || currentDoc.title : currentDoc.title;

        setDocs((prevDocs) => {
          const updated = prevDocs.map((doc) =>
            doc.id === currentDoc.id
              ? {
                  ...doc,
                  filePath: updatedDocPath,
                  title: newTitle,
                  isRemote: false, // リモートからローカル保存された場合はリモートフラグ解除
                  updatedAt: new Date().toISOString(),
                }
              : doc
          );
          saveStoredDocs(updated);
          return updated;
        });

        setSaveStatus('saved_file');
        const timeStr = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSavedTime(timeStr);
        onSaveSuccess?.(updatedDocPath);

        logger.info(
          res.isSaveAs
            ? `[名前を付けて保存完了] "${newTitle}" を実ファイルへ保存しました (${timeStr})`
            : `[実ファイル上書き保存完了] "${newTitle}" を実ファイルへ直上書き保存しました (${timeStr})`,
          `パス: ${updatedDocPath}`
        );
        return;
      }

      if (res.error && res.error !== 'Canceled by user') {
        logger.error(`[ファイル保存エラー] 保存処理に失敗しました`, res.error);
        alert(`ファイルの保存に失敗しました:\n${res.error}`);
        setSaveStatus('unsaved');
      } else if (!res.success && res.error === 'Canceled by user') {
        setSaveStatus('saved');
      } else {
        // フォールバック（Web環境ブラウザダウンロード）
        handleExportMarkdown();
        setSaveStatus('saved');
      }
    },
    [currentDoc, settings.defaultAuthor, setDocs, setSaveStatus, setLastSavedTime, handleExportMarkdown]
  );

  // PC/ファイルサーバーのローカルファイルを開く
  const handleOpenLocalFile = useCallback(async () => {
    const nativeResult = await openNativeFileDialog();
    if (nativeResult) {
      const { doc: openedDoc } = nativeResult;
      handleAddOpenedDoc(openedDoc);
      logger.info(
        `[ファイルオープン成功] ファイルを開きました: "${openedDoc.title}"`,
        `パス: ${openedDoc.filePath}`
      );
      return;
    }
    fileInputRef.current?.click();
  }, [handleAddOpenedDoc, fileInputRef]);

  // HTML ファイルとしてのエクスポート (Rust ネイティブ pulldown-cmark + 埋め込み CSS)
  const handleExportHtml = useCallback(async () => {
    try {
      const isDark = settings.theme === 'dark';
      const nativeHtml = await exportHtmlFullNative(
        currentDoc.title || '無題のドキュメント',
        currentDoc.content,
        isDark
      );

      const htmlContent = nativeHtml || `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${currentDoc.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #333; }
    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
    code { font-family: monospace; background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
  </style>
</head>
<body>
  <pre>${buildFullMarkdownWithFrontMatter(currentDoc)}</pre>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentDoc.title || 'document'}.html`;
      a.click();
      URL.revokeObjectURL(url);
      logger.info(`[エクスポート] HTMLを出力しました (Rustネイティブ)`, `ファイル名: ${currentDoc.title}.html`);
    } catch (e) {
      logger.error(`[HTMLエクスポートエラー]`, String(e));
    }
  }, [currentDoc, settings.theme]);

  // ダイレクト PDF 保存 (Rust ネイティブ生成)
  const handleExportPdfDirect = useCallback(async () => {
    try {
      const pdfBytes = await generatePdfNative(currentDoc.title, currentDoc.content);
      const uint8Array = new Uint8Array(pdfBytes);
      const blob = new Blob([uint8Array], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentDoc.title || 'document'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      logger.info(`[Rust PDFダイレクト生成成功] PDFを出力しました`, `タイトル: ${currentDoc.title}`);
    } catch (e) {
      logger.error(`[Rust PDF生成エラー] PDF出力に失敗しました`, String(e));
      alert(`PDF生成に失敗しました: ${String(e)}`);
    }
  }, [currentDoc]);

  // 印刷
  const handlePrint = useCallback(() => {
    const originalTitle = document.title;
    document.title = currentDoc.title || 'document';
    window.print();
    // 印刷ダイアログ終了後に元に戻す (非同期)
    setTimeout(() => {
      document.title = currentDoc.title || originalTitle;
    }, 1000);
  }, [currentDoc.title]);

  return {
    handleOpenLocalFile,
    handleSaveCurrentDoc,
    handleExportMarkdown,
    handleExportHtml,
    handleExportPdfDirect,
    handlePrint,
  };
}
