import { useState, useCallback, useEffect } from 'react';
import { MarkdownDoc, ViewMode } from '../types';

/**
 * 2画面（左右ペイン）比較編集・プレビュー状態を管理するカスタムフック
 * - 最大2つのMarkdownファイルを横並びで表示
 * - 左右ペインで表示モード（エディタ/プレビュー）は連動
 * - 2画面時は従来の split（4分割）を抑止
 * - フォーカス中のペイン ('left' | 'right') に応じて activeDocId とタブ操作が連動
 */
export function useDualPane(
  docs: MarkdownDoc[],
  activeDocId: string,
  setActiveDocId: (id: string) => void,
  openTabIds: string[],
  setOpenTabIds: React.Dispatch<React.SetStateAction<string[]>>,
  viewMode: ViewMode,
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>
) {
  // 左ペインのドキュメントID (1画面時および2画面の左側)
  const [leftDocId, setLeftDocId] = useState<string>(activeDocId);
  // 右ペインのドキュメントID (null なら 1画面モード)
  const [secondaryDocId, setSecondaryDocId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('quma_secondary_doc_id') || null;
    } catch {
      return null;
    }
  });
  // 現在フォーカスされているペイン ('left' | 'right')
  const [activePane, setActivePane] = useState<'left' | 'right'>('left');

  // 1画面時は leftDocId を常に activeDocId に同期
  useEffect(() => {
    if (!secondaryDocId && activeDocId) {
      setLeftDocId(activeDocId);
    }
  }, [activeDocId, secondaryDocId]);

  // ドキュメントオブジェクトの導出
  const leftDoc = docs.find((d) => d.id === leftDocId) || docs.find((d) => d.id === activeDocId) || docs[0];
  const secondaryDoc = secondaryDocId ? docs.find((d) => d.id === secondaryDocId) || null : null;

  // secondaryDocId がドキュメント一覧から消滅した場合は自動解除
  useEffect(() => {
    if (secondaryDocId && !secondaryDoc) {
      setSecondaryDocId(null);
      setActivePane('left');
      try {
        localStorage.removeItem('quma_secondary_doc_id');
      } catch {}
    }
  }, [secondaryDocId, secondaryDoc]);

  // 2画面がアクティブな場合、'split' モードは不可（'editor' にフォールバック）
  useEffect(() => {
    if (secondaryDoc && viewMode === 'split') {
      setViewMode('editor');
    }
  }, [secondaryDoc, viewMode, setViewMode]);

  // 右ペインで指定ドキュメントを開く
  const handleOpenInSecondaryPane = useCallback(
    (docId: string) => {
      // 左ペインに現在の activeDocId を確実に保持
      if (activeDocId !== docId) {
        setLeftDocId(activeDocId);
      }
      setSecondaryDocId(docId);
      setActivePane('right');
      setActiveDocId(docId);

      try {
        localStorage.setItem('quma_secondary_doc_id', docId);
      } catch {}

      // タブに追加されていなければ追加
      setOpenTabIds((prev) => (prev.includes(docId) ? prev : [...prev, docId]));

      // 4分割を防ぐため split モードなら editor に切り替え
      setViewMode((prev) => (prev === 'split' ? 'editor' : prev));
    },
    [activeDocId, setActiveDocId, setOpenTabIds, setViewMode]
  );

  // 右ペインを閉じる（1画面に戻す）
  const handleCloseSecondaryPane = useCallback(() => {
    setSecondaryDocId(null);
    setActivePane('left');
    if (leftDocId) {
      setActiveDocId(leftDocId);
    }
    try {
      localStorage.removeItem('quma_secondary_doc_id');
    } catch {}
  }, [leftDocId, setActiveDocId]);

  // 2画面のトグル切り替え（タブバーやショートカット用）
  const handleToggleDualPane = useCallback(
    (fallbackDocId?: string) => {
      if (secondaryDoc) {
        handleCloseSecondaryPane();
      } else {
        const candidateId =
          fallbackDocId ||
          openTabIds.find((id) => id !== activeDocId) ||
          docs.find((d) => d.id !== activeDocId)?.id ||
          activeDocId;
        if (candidateId) {
          handleOpenInSecondaryPane(candidateId);
        }
      }
    },
    [secondaryDoc, handleCloseSecondaryPane, handleOpenInSecondaryPane, openTabIds, activeDocId, docs]
  );

  // ペイン選択時のフォーカス切替
  const handleFocusPane = useCallback(
    (pane: 'left' | 'right') => {
      setActivePane(pane);
      if (pane === 'left' && leftDoc) {
        setActiveDocId(leftDoc.id);
      } else if (pane === 'right' && secondaryDoc) {
        setActiveDocId(secondaryDoc.id);
      }
    },
    [leftDoc, secondaryDoc, setActiveDocId]
  );

  // タブ選択時のハンドラー（2画面表示時はアクティブなペインにタブをロード）
  const handleSelectTabWithDualPane = useCallback(
    (id: string, originalSelectTab: (id: string) => void) => {
      if (secondaryDocId && activePane === 'right') {
        // 右ペインがアクティブなら右ペインのドキュメントを切り替え
        setSecondaryDocId(id);
        setActiveDocId(id);
        try {
          localStorage.setItem('quma_secondary_doc_id', id);
        } catch {}
      } else {
        // 左ペインがアクティブまたは1画面なら通常通り
        setLeftDocId(id);
        originalSelectTab(id);
      }
    },
    [secondaryDocId, activePane, setActiveDocId]
  );

  // タブクローズ時のハンドラー（右ペインで開いているタブが閉じられたら右ペイン解除）
  const handleCloseTabWithDualPane = useCallback(
    (id: string, originalCloseTab: (id: string) => void) => {
      if (secondaryDocId === id) {
        handleCloseSecondaryPane();
      }
      originalCloseTab(id);
    },
    [secondaryDocId, handleCloseSecondaryPane]
  );

  return {
    secondaryDocId,
    secondaryDoc,
    leftDoc,
    activePane,
    isDualPane: secondaryDoc !== null,
    handleOpenInSecondaryPane,
    handleCloseSecondaryPane,
    handleToggleDualPane,
    handleFocusPane,
    handleSelectTabWithDualPane,
    handleCloseTabWithDualPane,
  };
}
