import { useEffect, useRef, useCallback } from 'react';
import { MarkdownDoc } from '../types';
import { getFileMetadataNative } from '../utils/tauriNative';
import { commands } from '../bindings';

interface UseFileWatcherProps {
  currentDoc: MarkdownDoc;
  onReloadFile: (filePath: string) => Promise<void>;
  saveStatus?: string;
}

export function useFileWatcher({ currentDoc, onReloadFile, saveStatus }: UseFileWatcherProps) {
  // 各ファイルの直近 mtime (ミリ秒) を保持するマップ
  const fileMtimeMapRef = useRef<Map<string, number>>(new Map());
  // 自プロセス保存の直近タイムスタンプ
  const lastLocalSaveTimeRef = useRef<number>(0);
  // 再読み込み中フラグ
  const isReloadingRef = useRef<boolean>(false);

  // 自アプリによるローカル保存開始または完了をマークし、誤検知を防ぐ
  const markLocalSaving = useCallback(() => {
    lastLocalSaveTimeRef.current = Date.now();
  }, []);

  // 自アプリによるローカル保存完了を通知し、直近 mtime を更新する
  const recordLocalSave = useCallback((filePath: string, newMtimeMs?: number) => {
    lastLocalSaveTimeRef.current = Date.now();
    if (newMtimeMs !== undefined && newMtimeMs > 0) {
      fileMtimeMapRef.current.set(filePath, newMtimeMs);
    } else {
      // mtime が渡されない場合は直ちに取得して記録
      getFileMetadataNative(filePath).then((meta) => {
        if (meta && meta.exists && meta.mtimeMs > 0) {
          fileMtimeMapRef.current.set(filePath, meta.mtimeMs);
        }
      });
    }
  }, []);

  // 外部変更チェック処理（targetPath があればそれを、なければ currentDoc.filePath を対象）
  const checkFileUpdate = useCallback(async (targetPath?: string) => {
    const filePath = targetPath || currentDoc?.filePath;
    if (!filePath || currentDoc.isRemote || isReloadingRef.current) {
      return;
    }

    try {
      const meta = await getFileMetadataNative(filePath);
      if (!meta || !meta.exists) {
        return;
      }

      const recordedMtime = fileMtimeMapRef.current.get(filePath);

      // 初回記録
      if (recordedMtime === undefined) {
        fileMtimeMapRef.current.set(filePath, meta.mtimeMs);
        return;
      }

      // 自プロセスの保存直後（4.0秒以内）であれば誤検知防止
      const timeSinceLocalSave = Date.now() - lastLocalSaveTimeRef.current;
      if (timeSinceLocalSave < 4000) {
        fileMtimeMapRef.current.set(filePath, meta.mtimeMs);
        return;
      }

      // 外部更新検知: mtime が記録値より新しくなった場合
      if (meta.mtimeMs > recordedMtime + 50) {
        isReloadingRef.current = true;
        fileMtimeMapRef.current.set(filePath, meta.mtimeMs);
        try {
          await onReloadFile(filePath);
        } finally {
          isReloadingRef.current = false;
        }
      }
    } catch (err) {
      console.warn('[FileWatcher] 外部変更チェック失敗:', err);
    }
  }, [currentDoc?.filePath, currentDoc?.isRemote, onReloadFile]);

  // 手動再読み込みハンドラー (Ctrl+R / F5 用)
  const reloadCurrentDoc = useCallback(async () => {
    const filePath = currentDoc?.filePath;
    if (!filePath || currentDoc.isRemote || isReloadingRef.current) {
      return false;
    }

    isReloadingRef.current = true;
    try {
      const meta = await getFileMetadataNative(filePath);
      if (meta && meta.exists) {
        fileMtimeMapRef.current.set(filePath, meta.mtimeMs);
      }
      await onReloadFile(filePath);
      return true;
    } catch (err) {
      console.error('[FileWatcher] 手動再読み込み失敗:', err);
      return false;
    } finally {
      isReloadingRef.current = false;
    }
  }, [currentDoc?.filePath, currentDoc?.isRemote, onReloadFile]);

  // ドキュメント切り替え時およびステータス変更時に mtime を確認し、外部更新があれば即時再読み込み
  useEffect(() => {
    const filePath = currentDoc?.filePath;
    if (!filePath || currentDoc.isRemote) return;

    // 自プロセスの保存アクション（saving / saved_file / saved_local）時は外部再読み込みを行わない
    if (saveStatus === 'saving' || saveStatus === 'saved_file' || saveStatus === 'saved_local') {
      getFileMetadataNative(filePath).then((meta) => {
        if (meta && meta.exists && meta.mtimeMs > 0) {
          fileMtimeMapRef.current.set(filePath, meta.mtimeMs);
        }
      });
      return;
    }

    // 自プロセスの保存直後（4.0秒以内）であれば誤検知防止（最新mtimeを記録してスキップ）
    const timeSinceLocalSave = Date.now() - lastLocalSaveTimeRef.current;
    if (timeSinceLocalSave < 4000) {
      getFileMetadataNative(filePath).then((meta) => {
        if (meta && meta.exists && meta.mtimeMs > 0) {
          fileMtimeMapRef.current.set(filePath, meta.mtimeMs);
        }
      });
      return;
    }

    getFileMetadataNative(filePath).then(async (meta) => {
      if (meta && meta.exists && meta.mtimeMs > 0) {
        const recorded = fileMtimeMapRef.current.get(filePath);
        if (recorded !== undefined && meta.mtimeMs > recorded + 50) {
          // 切り替え先ファイルがバックグラウンドで外部更新されていた場合
          fileMtimeMapRef.current.set(filePath, meta.mtimeMs);
          if (saveStatus !== 'editing' && saveStatus !== 'saving') {
            await onReloadFile(filePath);
          }
        } else {
          fileMtimeMapRef.current.set(filePath, meta.mtimeMs);
        }
      }
    });
  }, [currentDoc?.id, currentDoc?.filePath, currentDoc?.isRemote, onReloadFile, saveStatus]);

  // ウィンドウフォーカス時および定期ポーリング (2.5秒) による監視
  useEffect(() => {
    const handleFocus = () => {
      checkFileUpdate();
    };

    window.addEventListener('focus', handleFocus);
    const intervalId = setInterval(() => checkFileUpdate(), 2500);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, [checkFileUpdate]);

  // OS ネイティブ外部変更監視 (notify + Tauri イベント連携)
  useEffect(() => {
    const filePath = currentDoc?.filePath;
    if (!filePath || currentDoc.isRemote) return;

    let unlistenFn: (() => void) | null = null;

    // ネイティブ監視の登録
    commands.watchFileNative(filePath).catch((err) => {
      console.warn('[NativeFileWatcher] watchFileNative 失敗:', err);
    });

    // Tauri イベント native-file-changed の購読
    import('@tauri-apps/api/event').then(({ listen }) => {
      listen<{ file_path: string; mtime_ms: number }>('native-file-changed', async (event) => {
        const changedPath = event.payload.file_path;
        // 現在開いているファイルと一致し、再読み込み中でない場合
        if (
          changedPath.toLowerCase().replace(/\\/g, '/') === filePath.toLowerCase().replace(/\\/g, '/') &&
          !isReloadingRef.current
        ) {
          isReloadingRef.current = true;
          fileMtimeMapRef.current.set(filePath, event.payload.mtime_ms);
          try {
            await onReloadFile(filePath);
          } finally {
            isReloadingRef.current = false;
          }
        }
      }).then((unlisten) => {
        unlistenFn = unlisten;
      });
    });

    return () => {
      if (unlistenFn) {
        unlistenFn();
      }
      commands.unwatchFileNative(filePath).catch(() => {});
    };
  }, [currentDoc?.filePath, currentDoc?.isRemote, onReloadFile]);

  return {
    markLocalSaving,
    recordLocalSave,
    checkFileUpdate,
    reloadCurrentDoc,
  };
}

