import React, { useCallback } from 'react';
import { EditorSettings } from '../types';
import { insertFormatting, applyTextReplacementWithUndo } from '../utils/markdownUtils';

interface UseEditorToolbarActionsParams {
  content: string;
  updateDocContent: (newContent: string) => void;
  editorTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  previewScrollRef: React.RefObject<HTMLDivElement | null>;
  settings: EditorSettings;
  setCursorLine: (line: number) => void;
  setCursorCol: (col: number) => void;
  setIsTableModalOpen: (open: boolean) => void;
}

/**
 * エディタのツールバーアクション（書式挿入、現在日付挿入、テーブルモーダル起動、カーソル位置追跡）
 * を一括管理するカスタムフック
 * - ブラウザネイティブの Undo 履歴 (document.execCommand / inputType) を維持したまま文字列置換を実行
 */
export function useEditorToolbarActions({
  content,
  updateDocContent,
  editorTextareaRef,
  previewScrollRef,
  settings,
  setCursorLine,
  setCursorCol,
  setIsTableModalOpen,
}: UseEditorToolbarActionsParams) {
  // ツールバー各種フォーマット挿入（ネイティブ Undo/Ctrl+Z 履歴対応）
  const handleFormat = useCallback(
    (type: string, value?: string) => {
      const textarea = editorTextareaRef.current;
      if (!textarea) return;

      textarea.focus();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const res = insertFormatting(content, start, end, type, value);

      const success = applyTextReplacementWithUndo(
        textarea,
        res.rangeStart,
        res.rangeEnd,
        res.resultString,
        res.newCursorStart,
        res.newCursorEnd,
        (fallbackText) => {
          updateDocContent(fallbackText);
        }
      );

      if (success) {
        updateDocContent(textarea.value);
      }
    },
    [content, editorTextareaRef, updateDocContent]
  );

  // 日付挿入
  const handleInsertDate = useCallback(() => {
    const dateStr = new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    });
    handleFormat('text', dateStr);
  }, [handleFormat]);

  // テーブル挿入
  const handleInsertTable = useCallback(
    (markdownTable: string) => {
      handleFormat('text', `\n${markdownTable}\n`);
      setIsTableModalOpen(false);
    },
    [handleFormat, setIsTableModalOpen]
  );

  // Mermaid ダイアグラムテンプレート挿入
  const handleInsertMermaidTemplate = useCallback(
    (templateCode: string) => {
      handleFormat('text', `\n\`\`\`mermaid\n${templateCode.trim()}\n\`\`\`\n`);
    },
    [handleFormat]
  );

  // 見出しアウトラインクリック時の該当行＆プレビュージャンプ処理
  const handleJumpToHeading = useCallback(
    (lineNumber: number, headingText: string) => {
      // 1. エディタ側の該当行へカーソル移動＆フォーカス＆スクロール
      const textarea = editorTextareaRef.current;
      if (textarea) {
        const lines = content.split('\n');
        let charIndex = 0;
        for (let i = 0; i < Math.min(lineNumber - 1, lines.length); i++) {
          charIndex += lines[i].length + 1; // +1 for '\n'
        }
        const targetLineText = lines[lineNumber - 1] || '';

        textarea.focus();
        textarea.setSelectionRange(charIndex, charIndex + targetLineText.length);

        // 行の高さ概算でスムーズに画面中央近くへスクロール
        const lineHeightPx = (settings.fontSize || 15) * (settings.lineHeight || 1.6);
        textarea.scrollTop = Math.max(0, (lineNumber - 5) * lineHeightPx);

        setCursorLine(lineNumber);
        setCursorCol(1);
      }

      // 2. プレビュー側の該当見出し要素へスムーズスクロール
      if (previewScrollRef.current) {
        const headings = Array.from(
          previewScrollRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6')
        );
        const cleanTarget = headingText.trim().toLowerCase();
        // テキスト内容が一致する見出し要素を検索
        const targetEl = headings.find((el) => {
          const text = el.textContent?.trim().toLowerCase() || '';
          return text === cleanTarget || text.includes(cleanTarget) || cleanTarget.includes(text);
        });

        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    },
    [content, editorTextareaRef, previewScrollRef, setCursorCol, setCursorLine, settings.fontSize, settings.lineHeight]
  );

  return {
    handleFormat,
    handleInsertDate,
    handleInsertTable,
    handleInsertMermaidTemplate,
    handleJumpToHeading,
  };
}
