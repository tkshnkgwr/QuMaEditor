import { useState, useRef, useCallback } from 'react';
import { MarkdownDoc, EditorSettings, SaveStatus } from '../types';
import { saveStoredDocs } from '../utils/storage';
import { saveNativeFile } from '../utils/fileSystem';
import { saveSnapshot } from '../utils/snapshotManager';
import { logger } from '../utils/logger';

interface UseAutoSaveManagerProps {
  currentDoc: MarkdownDoc;
  docs: MarkdownDoc[];
  setDocs: React.Dispatch<React.SetStateAction<MarkdownDoc[]>>;
  settings: EditorSettings;
  markLocalSaving: () => void;
  recordLocalSave: (filePath: string, mtimeMs?: number) => void;
}

/**
 * テキスト編集の即時反映、LocalStorage/実ファイルへのディバウンス自動保存、
 * およびローカルスナップショット（リビジョン履歴）の自動記録を調停するカスタムフック
 */
export function useAutoSaveManager({
  currentDoc,
  docs,
  setDocs,
  settings,
  markLocalSaving,
  recordLocalSave,
}: UseAutoSaveManagerProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 自動保存タイマーの明示的キャンセルハンドラー
  const handleCancelAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
  }, []);

  // テキスト内容の更新＆自動保存タイマー
  const updateDocContent = useCallback(
    (newContent: string, targetDocId?: string) => {
      const docId = targetDocId || currentDoc.id;
      const targetDoc = docs.find((d) => d.id === docId) || currentDoc;
      const nowISO = new Date().toISOString();
      const updaterName =
        settings.defaultAuthor?.trim() || targetDoc.updatedBy || targetDoc.author || 'Unknown';
      const targetFilePath = targetDoc.filePath;
      const isRemote = targetDoc.isRemote;
      const docToSave: MarkdownDoc = {
        ...targetDoc,
        content: newContent,
        author: targetDoc.author || 'Unknown',
        updatedAt: nowISO,
        updatedBy: updaterName,
      };

      setDocs((prevDocs) =>
        prevDocs.map((doc) =>
          doc.id === docId
            ? {
                ...doc,
                content: newContent,
                author: doc.author || 'Unknown',
                updatedAt: nowISO,
                updatedBy: updaterName,
              }
            : doc
        )
      );

      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      setSaveStatus('editing');

      const delayMs = Math.max(2000, Math.min(10000, settings.autoSaveIntervalMs || 3000));

      autoSaveTimeoutRef.current = setTimeout(async () => {
        if (isRemote) {
          setSaveStatus('unsaved');
          logger.info(
            `[自動保存スキップ] リモートファイル "${docToSave.title}" はリモート仕様に基づき自動保存されません。`
          );
          return;
        }

        if (docToSave.isChunkedLoaded) {
          setSaveStatus('unsaved');
          logger.info(
            `[自動保存スキップ] 大容量チャンク部分読込中のファイル "${docToSave.title}" は後半データ保護のため自動保存をスキップします。`
          );
          return;
        }

        setSaveStatus('saving');
        let savedToFile = false;
        if (targetFilePath) {
          markLocalSaving();
          const res = await saveNativeFile(docToSave, {
            forceSaveAs: false,
            defaultAuthor: settings.defaultAuthor,
          });
          if (res.success && res.filePath) {
            recordLocalSave(res.filePath, res.mtimeMs);
            savedToFile = true;
          }
        }

        // LocalStorage ストレージスリム化保存
        setDocs((prevDocs) => {
          saveStoredDocs(prevDocs);
          return prevDocs;
        });

        // リビジョン履歴（自動スナップショット）の保存
        saveSnapshot(docToSave, 'auto');

        const timeStr = new Date().toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        setLastSavedTime(timeStr);
        setSaveStatus(savedToFile ? 'saved_file' : 'saved_local');
        logger.info(
          `[自動保存完了] "${docToSave.title}" を自動保存しました (${timeStr})`,
          savedToFile ? `実ファイル: ${targetFilePath}` : 'LocalStorage'
        );
      }, delayMs);
    },
    [currentDoc, docs, setDocs, settings.defaultAuthor, settings.autoSaveIntervalMs, markLocalSaving, recordLocalSave]
  );

  // リビジョン履歴からの復元ハンドラー
  const handleRestoreContent = useCallback(
    (newContent: string) => {
      updateDocContent(newContent);
    },
    [updateDocContent]
  );

  return {
    saveStatus,
    setSaveStatus,
    lastSavedTime,
    setLastSavedTime,
    handleCancelAutoSave,
    updateDocContent,
    handleRestoreContent,
  };
}
