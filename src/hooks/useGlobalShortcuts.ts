import { useEffect } from 'react';
import { ViewMode } from '../types';
import { ToastMessage } from '../components/Toast';

interface UseGlobalShortcutsOptions {
  isZenMode: boolean;
  setIsZenMode: (v: boolean) => void;
  toggleZenMode: () => void;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  handleSaveCurrentDoc: (opts: { forceSaveAs?: boolean }) => void;
  handleOpenLocalFile: () => void;
  handleNewDoc: () => void;
  handlePrint: () => void;
  handleAutoFormat: () => void;
  reloadCurrentDoc: () => Promise<boolean>;
  setToast: (toast: ToastMessage) => void;
  setIsShortcutsModalOpen: (v: boolean) => void;
}

/**
 * アプリケーション全体のグローバルキーボードショートカットを登録・制御するカスタムフック
 */
export function useGlobalShortcuts({
  isZenMode,
  setIsZenMode,
  toggleZenMode,
  viewMode,
  setViewMode,
  handleSaveCurrentDoc,
  handleOpenLocalFile,
  handleNewDoc,
  handlePrint,
  handleAutoFormat,
  reloadCurrentDoc,
  setToast,
  setIsShortcutsModalOpen,
}: UseGlobalShortcutsOptions): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1: ショートカット一覧
      if (e.key === 'F1') {
        e.preventDefault();
        setIsShortcutsModalOpen(true);
        return;
      }

      // Ctrl + Shift + Z: Zen モード切替
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'Z' || e.key === 'z')) {
        e.preventDefault();
        toggleZenMode();
        return;
      }

      // Escape: Zen モード解除
      if (isZenMode && e.key === 'Escape') {
        e.preventDefault();
        setIsZenMode(false);
        return;
      }

      // Ctrl + E: エディタ / プレビュー表示切替
      if ((e.ctrlKey || e.metaKey) && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        if (viewMode === 'editor') {
          setViewMode('preview');
        } else if (viewMode === 'preview') {
          setViewMode('editor');
        }
        return;
      }

      // Ctrl + S / Ctrl + Shift + S: 保存 / 名前を付けて保存
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSaveCurrentDoc({ forceSaveAs: e.shiftKey });
        return;
      }

      // Ctrl + O: ファイルを開く
      if ((e.ctrlKey || e.metaKey) && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        handleOpenLocalFile();
        return;
      }

      // Ctrl + N: 新規ドキュメント
      if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        handleNewDoc();
        return;
      }

      // Ctrl + Shift + F: Markdown 自動整形 (Rust ネイティブ)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault();
        handleAutoFormat();
        return;
      }

      // F5 または Ctrl + R: ディスクから再読み込み
      if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R'))) {
        e.preventDefault();
        reloadCurrentDoc().then((success) => {
          if (success) {
            setToast({
              id: Date.now().toString(),
              message: 'ファイルをディスクから再読み込みしました。',
              type: 'reload',
              duration: 3000,
            });
          }
        });
        return;
      }

      // Ctrl + P: 印刷 / PDF 出力
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        handlePrint();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isZenMode,
    setIsZenMode,
    viewMode,
    setViewMode,
    handleSaveCurrentDoc,
    handleOpenLocalFile,
    handleNewDoc,
    handlePrint,
    handleAutoFormat,
    reloadCurrentDoc,
    toggleZenMode,
    setIsShortcutsModalOpen,
    setToast,
  ]);
}
