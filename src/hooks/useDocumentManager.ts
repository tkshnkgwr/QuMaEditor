import { useState, useEffect, useCallback } from 'react';
import { MarkdownDoc, SaveStatus } from '../types';
import {
  loadStoredDocs,
  saveStoredDocs,
  loadActiveDocId,
  saveActiveDocId,
  loadOpenTabIds,
  saveOpenTabIds,
} from '../utils/storage';
import { logger } from '../utils/logger';

/**
 * ドキュメント一覧 (docs)、アクティブドキュメント (activeDocId)、オープンタブ (openTabIds)
 * の状態およびドキュメント操作系ロジックを一括管理するカスタムフック
 */
export function useDocumentManager() {
  const [docs, setDocs] = useState<MarkdownDoc[]>(loadStoredDocs);
  const [activeDocId, setActiveDocId] = useState<string>(loadActiveDocId);
  const [previousDocId, setPreviousDocId] = useState<string | undefined>(undefined);
  const [openTabIds, setOpenTabIds] = useState<string[]>(() => loadOpenTabIds(docs));

  // activeDocId が openTabIds に含まれていなければ自動追加
  useEffect(() => {
    if (activeDocId && !openTabIds.includes(activeDocId)) {
      setOpenTabIds((prev) => {
        if (!prev.includes(activeDocId)) {
          const next = [...prev, activeDocId];
          saveOpenTabIds(next);
          return next;
        }
        return prev;
      });
    }
  }, [activeDocId, openTabIds]);

  // 実ファイルを持つドキュメントのディスクからの完全読み込み（ハイドレーション）
  const loadFullDocFromDisk = useCallback(async (docToLoad: MarkdownDoc) => {
    if (!docToLoad.filePath || docToLoad.isRemote) return;
    try {
      const { openNativeFileFromPath } = await import('../utils/fileSystem');
      const res = await openNativeFileFromPath(docToLoad.filePath);
      if (res && res.doc) {
        setDocs((prevDocs) => {
          const updated = prevDocs.map((d) =>
            d.id === docToLoad.id
              ? {
                  ...d,
                  title: res.doc.title,
                  content: res.doc.content,
                  tags: res.doc.tags,
                  author: res.doc.author,
                  updatedAt: res.doc.updatedAt || d.updatedAt,
                  updatedBy: res.doc.updatedBy,
                  encoding: res.doc.encoding,
                }
              : d
          );
          return updated;
        });
      }
    } catch (err) {
      console.warn('[useDocumentManager] loadFullDocFromDisk failed:', err);
    }
  }, []);

  // 起動時にスリム化されているドキュメント、または開いているタブの実ファイルを自動フルロード
  useEffect(() => {
    const docsToHydrate = docs.filter(
      (d) =>
        d.filePath &&
        !d.isRemote &&
        (d.content.includes('[STORAGE_SLIMMED_LOAD_FROM_DISK]') || openTabIds.includes(d.id))
    );

    for (const docToHydrate of docsToHydrate) {
      loadFullDocFromDisk(docToHydrate);
    }
  }, []); // 起動時1回

  // 現在アクティブなドキュメントの取得
  const currentDoc = docs.find((d) => d.id === activeDocId) || docs[0] || {
    id: 'default',
    title: '無題のドキュメント',
    content: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // タブの選択
  const handleSelectTab = useCallback((id: string) => {
    if (id !== activeDocId) {
      setPreviousDocId(activeDocId);
    }
    setActiveDocId(id);
    saveActiveDocId(id);
    setOpenTabIds((prev) => {
      if (!prev.includes(id)) {
        const next = [...prev, id];
        saveOpenTabIds(next);
        return next;
      }
      return prev;
    });

    // 選択したドキュメントがスリム化されている場合、即座にディスクからフルロード
    const targetDoc = docs.find((d) => d.id === id);
    if (targetDoc && targetDoc.filePath && targetDoc.content.includes('[STORAGE_SLIMMED_LOAD_FROM_DISK]')) {
      loadFullDocFromDisk(targetDoc);
    }
  }, [activeDocId, docs, loadFullDocFromDisk]);

  // ドキュメントの選択
  const handleSelectDoc = useCallback((id: string) => {
    handleSelectTab(id);
  }, [handleSelectTab]);

  // タブを閉じる
  const handleCloseTab = useCallback((idToClose: string) => {
    setOpenTabIds((prevOpen) => {
      const nextOpen = prevOpen.filter((id) => id !== idToClose);

      // すべてのタブが閉じられた場合、新規ドキュメントを作成
      if (nextOpen.length === 0) {
        const newDoc: MarkdownDoc = {
          id: `doc-${Date.now()}`,
          title: '新規ドキュメント',
          content: '# 新規ドキュメント\n\nここから記述を開始してください。',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isFavorite: false,
        };
        setDocs((prevDocs) => {
          const updatedDocs = [newDoc, ...prevDocs];
          saveStoredDocs(updatedDocs);
          return updatedDocs;
        });
        setActiveDocId(newDoc.id);
        saveActiveDocId(newDoc.id);
        const initialTabs = [newDoc.id];
        saveOpenTabIds(initialTabs);
        return initialTabs;
      }

      saveOpenTabIds(nextOpen);

      // 閉じたタブがアクティブだった場合、隣のタブをアクティブ化
      if (activeDocId === idToClose) {
        const currentIndex = prevOpen.indexOf(idToClose);
        const nextActiveIndex = Math.max(0, currentIndex - 1);
        const nextActiveId = nextOpen[nextActiveIndex] || nextOpen[0];
        setActiveDocId(nextActiveId);
        saveActiveDocId(nextActiveId);
      }

      return nextOpen;
    });
  }, [activeDocId]);

  // 他のタブをすべて閉じる
  const handleCloseOtherTabs = useCallback((keepId: string) => {
    const nextOpen = [keepId];
    setOpenTabIds(nextOpen);
    saveOpenTabIds(nextOpen);
    setActiveDocId(keepId);
    saveActiveDocId(keepId);
  }, []);

  // 新規ドキュメントの作成
  const handleNewDoc = useCallback(() => {
    const now = new Date().toISOString();
    const defaultTitle = '新規ドキュメント';
    const bodyContent = `# ${defaultTitle}\n\nここから記述を開始してください。\n\n- [ ] 未完了タスク\n- [/] 進行中タスク\n- [x] 完了済みタスク`;

    const newDoc: MarkdownDoc = {
      id: `doc-${Date.now()}`,
      title: defaultTitle,
      content: bodyContent,
      author: '作成者',
      createdAt: now,
      updatedAt: now,
      updatedBy: '作成者',
      encoding: 'UTF-8',
      tags: ['新規ノート'],
      isFavorite: false,
    };

    setDocs((prevDocs) => {
      const updated = [newDoc, ...prevDocs];
      saveStoredDocs(updated);
      return updated;
    });
    setActiveDocId(newDoc.id);
    saveActiveDocId(newDoc.id);
    setOpenTabIds((prev) => {
      const next = prev.includes(newDoc.id) ? prev : [...prev, newDoc.id];
      saveOpenTabIds(next);
      return next;
    });
  }, []);

  // 開いたドキュメントのリスト追加＆アクティブ化処理（共通ロジック）
  const handleAddOpenedDoc = useCallback((openedDoc: MarkdownDoc) => {
    setDocs((prevDocs) => {
      const existing = prevDocs.find((d) => d.filePath === openedDoc.filePath && d.filePath);
      if (existing) {
        return prevDocs;
      }
      const updated = [openedDoc, ...prevDocs];
      saveStoredDocs(updated);
      return updated;
    });

    setActiveDocId(openedDoc.id);
    saveActiveDocId(openedDoc.id);
    setOpenTabIds((prev) => {
      const next = prev.includes(openedDoc.id) ? prev : [...prev, openedDoc.id];
      saveOpenTabIds(next);
      return next;
    });
  }, []);

  // ドキュメントの削除
  const handleDeleteDoc = useCallback((id: string) => {
    setDocs((prevDocs) => {
      const updated = prevDocs.filter((d) => d.id !== id);
      saveStoredDocs(updated);
      if (updated.length > 0 && activeDocId === id) {
        const nextId = updated[0].id;
        setActiveDocId(nextId);
        saveActiveDocId(nextId);
      }
      return updated;
    });
    setOpenTabIds((prevTabs) => {
      const nextTabs = prevTabs.filter((tabId) => tabId !== id);
      saveOpenTabIds(nextTabs);
      return nextTabs;
    });
  }, [activeDocId]);

  // お気に入りフラグの切り替え
  const handleToggleFavorite = useCallback((id: string) => {
    setDocs((prevDocs) => {
      const updated = prevDocs.map((doc) =>
        doc.id === id ? { ...doc, isFavorite: !doc.isFavorite } : doc
      );
      saveStoredDocs(updated);
      return updated;
    });
  }, []);

  // タイトルの更新
  const handleUpdateTitle = useCallback((newTitle: string, setSaveStatus?: (status: SaveStatus) => void) => {
    setDocs((prevDocs) => {
      const updated = prevDocs.map((doc) =>
        doc.id === currentDoc.id
          ? { ...doc, title: newTitle, updatedAt: new Date().toISOString() }
          : doc
      );
      saveStoredDocs(updated);
      return updated;
    });
    setSaveStatus?.('saved');
  }, [currentDoc.id]);

  // 更新者名 (updatedBy) の更新
  const handleUpdateUpdatedBy = useCallback((newUpdatedBy: string, setSaveStatus?: (status: SaveStatus) => void) => {
    setDocs((prevDocs) => {
      const updated = prevDocs.map((doc) =>
        doc.id === currentDoc.id
          ? { ...doc, updatedBy: newUpdatedBy, updatedAt: new Date().toISOString() }
          : doc
      );
      saveStoredDocs(updated);
      return updated;
    });
    setSaveStatus?.('saved_local');
    logger.info(`[更新者名変更] "${currentDoc.title}" の更新者を "${newUpdatedBy}" に変更しました`);
  }, [currentDoc.id, currentDoc.title]);

  // タグの更新
  const handleUpdateTags = useCallback((newTags: string[]) => {
    setDocs((prevDocs) => {
      const updated = prevDocs.map((doc) =>
        doc.id === currentDoc.id
          ? { ...doc, tags: newTags, updatedAt: new Date().toISOString() }
          : doc
      );
      saveStoredDocs(updated);
      return updated;
    });
  }, [currentDoc.id]);

  return {
    docs,
    setDocs,
    activeDocId,
    setActiveDocId,
    previousDocId,
    openTabIds,
    setOpenTabIds,
    currentDoc,
    handleSelectTab,
    handleSelectDoc,
    handleCloseTab,
    handleCloseOtherTabs,
    handleNewDoc,
    handleAddOpenedDoc,
    handleDeleteDoc,
    handleToggleFavorite,
    handleUpdateTitle,
    handleUpdateUpdatedBy,
    handleUpdateTags,
  };
}
