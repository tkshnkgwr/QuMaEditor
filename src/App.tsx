import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MarkdownDoc,
  ViewMode,
  EditorSettings,
  TextStats,
  SupportedEncoding,
  ThemeMode,
  SaveStatus,
} from './types';
import {
  saveStoredDocs,
  loadSettings,
  saveSettings,
} from './utils/storage';
import { calculateTextStats, toggleTaskInMarkdown } from './utils/markdownUtils';
import { decodeFileContent } from './utils/encodingUtils';
import { parseYamlFrontMatter } from './utils/yamlUtils';
import {
  parseMarkdownNative,
  calculateTextStatsNative,
  toggleTaskNative,
  formatMarkdownNative,
  lintMarkdownDocumentNative,
  ProofreadingIssue,
} from './utils/tauriNative';
import { openNativeFileFromPath, loadFullNativeDoc, loadMoreChunkNativeDoc, saveNativeFile } from './utils/fileSystem';
import { commands } from './bindings';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { TabBar } from './components/TabBar';
import { Toolbar } from './components/Toolbar';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { DualPaneWorkspace } from './components/DualPaneWorkspace';
import { StatusBar } from './components/StatusBar';
import { Minimize2, Upload } from 'lucide-react';
import { ModalGroup } from './components/ModalGroup';
import { Toast, ToastMessage } from './components/Toast';
import { logger } from './utils/logger';

// リファクタリング用に分離したカスタムフック
import { useModalState } from './hooks/useModalState';
import { useDocumentManager } from './hooks/useDocumentManager';
import { useDualPane } from './hooks/useDualPane';
import { useFileOperations } from './hooks/useFileOperations';
import { useFileWatcher } from './hooks/useFileWatcher';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { useWindowDragDrop } from './hooks/useWindowDragDrop';
import { useEditorToolbarActions } from './hooks/useEditorToolbarActions';

export default function App() {
  // ドキュメント一覧・タブ状態の管理 (useDocumentManager)
  const {
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
    handleUpdateAuthor,
    handleUpdateUpdatedBy,
    handleUpdateTags,
    handleUpdateSummary,
  } = useDocumentManager();

  // モーダルおよび Zen モード開閉状態の管理 (useModalState)
  const {
    isZenMode,
    setIsZenMode,
    toggleZenMode,
    isTableModalOpen,
    setIsTableModalOpen,
    isTemplateModalOpen,
    setIsTemplateModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    isAboutModalOpen,
    setIsAboutModalOpen,
    isHelpGuideModalOpen,
    setIsHelpGuideModalOpen,
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
    isDiffModalOpen,
    setIsDiffModalOpen,
    isBatchConvertModalOpen,
    setIsBatchConvertModalOpen,
    isLogModalOpen,
    setIsLogModalOpen,
    isStatsModalOpen,
    setIsStatsModalOpen,
  } = useModalState();

  // 基本設定 state
  const [settings, setSettings] = useState<EditorSettings>(loadSettings);

  // OSのシステムダークモード設定の検出
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  const effectiveTheme: 'dark' | 'light' =
    settings.theme === 'system' ? systemTheme : settings.theme || 'dark';
  const isDark = effectiveTheme === 'dark';

  // HTML ルート (documentElement) のテーマクラス・color-scheme 同期
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [isDark]);

  // ウィンドウタイトルおよび印刷タイトルを現在のドキュメント名に同期
  useEffect(() => {
    const docName = currentDoc.title || 'QuMaEditor';
    document.title = docName;
  }, [currentDoc.title]);

  const handleChangeTheme = (newTheme: ThemeMode) => {
    handleUpdateSettings({ theme: newTheme });
  };

  // 表示レイアウト＆サイドバー幅
  const [viewMode, setViewMode] = useState<ViewMode>('editor');

  // 2画面比較編集・プレビュー管理 (useDualPane)
  const {
    secondaryDocId,
    secondaryDoc,
    leftDoc,
    activePane,
    isDualPane,
    handleOpenInSecondaryPane,
    handleCloseSecondaryPane,
    handleToggleDualPane,
    handleFocusPane,
    handleSelectTabWithDualPane,
    handleCloseTabWithDualPane,
  } = useDualPane(
    docs,
    activeDocId,
    setActiveDocId,
    openTabIds,
    setOpenTabIds,
    viewMode,
    setViewMode
  );

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('quma_sidebar_width');
    return saved ? parseInt(saved, 10) : 288;
  });

  const handleSidebarWidthChange = (newWidth: number) => {
    setSidebarWidth(newWidth);
    localStorage.setItem('quma_sidebar_width', newWidth.toString());
  };

  // 自動保存ステータス
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // 全文一括読み込みハンドラー
  const handleLoadFullDoc = useCallback(async () => {
    if (!currentDoc.filePath) return;
    const fullDoc = await loadFullNativeDoc(currentDoc);
    if (fullDoc) {
      setDocs((prevDocs) =>
        prevDocs.map((d) => (d.id === currentDoc.id ? fullDoc : d))
      );
      setToast({
        id: Date.now().toString(),
        message: 'ファイル全文を読み込みました。',
        type: 'info',
        duration: 3000,
      });
    }
  }, [currentDoc, setDocs]);

  // 追加チャンク読み込みハンドラー
  const handleLoadMoreChunk = useCallback(async () => {
    if (!currentDoc.filePath) return;
    const updatedDoc = await loadMoreChunkNativeDoc(currentDoc);
    if (updatedDoc) {
      setDocs((prevDocs) =>
        prevDocs.map((d) => (d.id === currentDoc.id ? updatedDoc : d))
      );
    }
  }, [currentDoc, setDocs]);



  // トースト通知 state
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // カーソル位置
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);

  // 参照 (Refs)
  const previewScrollRef = useRef<HTMLDivElement | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editorTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // 自動保存タイマーの明示的キャンセルハンドラー
  const handleCancelAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
  }, []);

  // 外部プロセス更新時のドキュメント自動再読み込み処理 (filePath 完全一致で安全に対象特定)
  const handleReloadExternalFile = useCallback(
    async (filePath: string) => {
      try {
        const result = await openNativeFileFromPath(filePath);
        if (result && result.doc) {
          setDocs((prevDocs) => {
            const updated = prevDocs.map((doc) =>
              doc.filePath === filePath
                ? {
                    ...doc,
                    title: result.doc.title,
                    content: result.doc.content,
                    tags: result.doc.tags,
                    author: result.doc.author,
                    updatedAt: result.doc.updatedAt || new Date().toISOString(),
                    updatedBy: result.doc.updatedBy,
                    encoding: result.doc.encoding,
                    filePath: result.filePath,
                  }
                : doc
            );
            saveStoredDocs(updated);
            return updated;
          });

          // トースト通知を表示
          setToast({
            id: Date.now().toString(),
            message: '別プロセスから更新されました。再読み込みします。',
            type: 'reload',
            duration: 4000,
          });

          logger.info(
            `[外部プロセス更新検知] "${result.doc.title}" を最新ファイルから再読み込みしました`,
            `パス: ${filePath}`
          );
        }
      } catch (err) {
        console.error('外部ファイル再読み込み失敗:', err);
      }
    },
    [setDocs]
  );

  // 外部ファイル変更監視フック (useFileWatcher)
  const { markLocalSaving, recordLocalSave, reloadCurrentDoc } = useFileWatcher({
    currentDoc,
    onReloadFile: handleReloadExternalFile,
    saveStatus,
  });

  // Markdown 自動整形ハンドラー (Rust ネイティブ)
  const handleAutoFormat = useCallback(async () => {
    try {
      const formatted = await formatMarkdownNative(currentDoc.content);
      if (formatted !== null) {
        updateDocContent(formatted);
        setToast({
          id: Date.now().toString(),
          message: 'Markdown を自動整形しました（垂直整列・見出し空行・連続空行圧縮）',
          type: 'info',
          duration: 3000,
        });
      }
    } catch (err) {
      console.error('自動整形エラー:', err);
    }
  }, [currentDoc.content]);

  // ファイル操作アクションの管理 (useFileOperations)
  const {
    handleOpenLocalFile,
    handleSaveCurrentDoc,
    handleExportMarkdown,
    handleExportHtml,
    handleExportPdfDirect,
    handlePrint,
  } = useFileOperations({
    currentDoc,
    settings,
    setDocs,
    setSaveStatus,
    setLastSavedTime,
    handleAddOpenedDoc,
    fileInputRef,
    onBeforeSave: markLocalSaving,
    onSaveSuccess: recordLocalSave,
    onCancelAutoSave: handleCancelAutoSave,
    setToast,
  });

  // テキスト統計情報 (Rust ネイティブによる超高速・低メモリ計算 + 150ms ディバウンス)
  const [nativeStats, setNativeStats] = useState<TextStats | null>(null);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      calculateTextStatsNative(currentDoc.content).then((res) => {
        if (isMounted && res) {
          setNativeStats(res);
        }
      });
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [currentDoc.content]);

  const stats: TextStats = nativeStats || calculateTextStats(currentDoc.content);

  // 日本語校正 ＆ Markdown 構文 lint (Rust 非同期バックグラウンド高速解析 + 250ms ディバウンス)
  const [proofreadingIssues, setProofreadingIssues] = useState<ProofreadingIssue[]>([]);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      lintMarkdownDocumentNative(currentDoc.content).then((issues) => {
        if (isMounted) {
          setProofreadingIssues(issues);
        }
      });
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [currentDoc.content]);

  // 前回のドキュメント情報（差分比較用）
  const previousDoc = docs.find((d) => d.id === previousDocId);

  // テキスト内容の更新＆自動保存タイマー
  const updateDocContent = (newContent: string, targetDocId?: string) => {
    const docId = targetDocId || currentDoc.id;
    const targetDoc = docs.find((d) => d.id === docId) || currentDoc;
    const nowISO = new Date().toISOString();
    const updaterName = settings.defaultAuthor?.trim() || targetDoc.updatedBy || targetDoc.author || 'Unknown';
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
          `[自動保存スキップ] リモートファイル "${docToSave.title}" (ID: ${docToSave.id}) はリモート仕様に基づき自動保存されません。`
        );
        return;
      }

      if (docToSave.isChunkedLoaded) {
        setSaveStatus('unsaved');
        logger.info(
          `[自動保存スキップ] 大容量チャンク部分読込中のファイル "${docToSave.title}" は後半データ保護のため全文読込まで自動上書き保存をスキップします。`
        );
        return;
      }

      setSaveStatus('saving');
      let savedToFile = false;
      if (targetFilePath) {
        markLocalSaving();
        const res = await saveNativeFile(docToSave, { forceSaveAs: false, defaultAuthor: settings.defaultAuthor });
        if (res.success && res.filePath) {
          savedToFile = true;
          recordLocalSave(res.filePath, res.mtimeMs);
        }
      }

      setDocs((latestDocs) => {
        saveStoredDocs(latestDocs);
        return latestDocs;
      });

      const timeStr = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTime(timeStr);

      if (savedToFile) {
        setSaveStatus('saved_file');
      } else {
        setSaveStatus('saved_local');
      }
    }, delayMs);
  };

  // プレビュー上のタスク項目チェック状態トグル (Rust ネイティブ高速置換)
  const handleToggleTaskItem = useCallback(async (taskIndex: number) => {
    try {
      const nativeUpdated = await toggleTaskNative(currentDoc.content, taskIndex);
      if (nativeUpdated !== null) {
        updateDocContent(nativeUpdated);
        return;
      }
    } catch (e) {
      console.warn('Native task toggle error:', e);
    }
    const fallbackUpdated = toggleTaskInMarkdown(currentDoc.content, taskIndex);
    updateDocContent(fallbackUpdated);
  }, [currentDoc.content]);

  // ファイル選択ダイアログからのフォールバック読み込み
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      if (!arrayBuffer) return;

      const uint8Array = new Uint8Array(arrayBuffer);
      const { text, encoding } = decodeFileContent(uint8Array);
      const defaultTitle = file.name.replace(/\.[^/.]+$/, '') || '無題のドキュメント';

      const { body, metadata } = parseYamlFrontMatter(text);

      const openedDoc: MarkdownDoc = {
        id: `doc-${Date.now()}`,
        title: metadata.title || defaultTitle,
        content: body,
        encoding: (metadata.encoding as SupportedEncoding) || encoding,
        createdAt: metadata.created || new Date().toISOString(),
        updatedAt: metadata.updated || new Date().toISOString(),
        tags: metadata.tags || [],
        summary: metadata.summary,
        summaryType: metadata.summary_type,
        isFavorite: false,
      };

      handleAddOpenedDoc(openedDoc);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // 文字コードの変更
  const handleChangeEncoding = (newEncoding: SupportedEncoding) => {
    setDocs((prevDocs) => {
      const updated = prevDocs.map((doc) =>
        doc.id === currentDoc.id
          ? { ...doc, encoding: newEncoding, updatedAt: new Date().toISOString() }
          : doc
      );
      saveStoredDocs(updated);
      return updated;
    });
    setSaveStatus('saved');
  };

  // 複製作成
  const handleDuplicateDoc = () => {
    const dupDoc: MarkdownDoc = {
      id: `doc-${Date.now()}`,
      title: `${currentDoc.title} (コピー)`,
      content: currentDoc.content,
      encoding: currentDoc.encoding || 'UTF-8',
      tags: currentDoc.tags ? [...currentDoc.tags] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFavorite: false,
    };
    handleAddOpenedDoc(dupDoc);
  };

  // テンプレート選択
  const handleSelectTemplate = (title: string, content: string) => {
    const tplDoc: MarkdownDoc = {
      id: `doc-${Date.now()}`,
      title,
      content,
      encoding: 'UTF-8',
      tags: ['Template'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    handleAddOpenedDoc(tplDoc);
    setIsTemplateModalOpen(false);
  };

  // 設定の更新
  const handleUpdateSettings = (newSettings: Partial<EditorSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveSettings(updated);
      return updated;
    });
  };

  // キーボードショートカット管理
  useGlobalShortcuts({
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
  });

  // 起動時のファイルオープンイベントリスナー
  useEffect(() => {
    let unlistenOpenFile: (() => void) | undefined;
    let unlistenOpenFromArgs: (() => void) | undefined;

    const handleIncomingFilePath = async (filePath: string) => {
      if (!filePath) return;
      const openResult = await openNativeFileFromPath(filePath);
      if (openResult && openResult.doc) {
        handleAddOpenedDoc(openResult.doc);
        try {
          const win = getCurrentWebviewWindow();
          await win.unminimize();
          await win.setFocus();
        } catch (e) {
          console.log('Window focus error:', e);
        }
      }
    };

    const setupListener = async () => {
      try {
        unlistenOpenFile = await listen<string>('open-file', async (event) => {
          await handleIncomingFilePath(event.payload);
        });
        unlistenOpenFromArgs = await listen<string>('open-file-from-args', async (event) => {
          await handleIncomingFilePath(event.payload);
        });
      } catch (e) {
        console.log('Tauri listen error:', e);
      }
    };

    setupListener();
    return () => {
      if (unlistenOpenFile) unlistenOpenFile();
      if (unlistenOpenFromArgs) unlistenOpenFromArgs();
    };
  }, [handleAddOpenedDoc]);

  // スクロール連動
  const handleScrollSync = useCallback(
    (scrollTopOrPercentage: number, scrollHeight?: number, clientHeight?: number) => {
      if (!settings.syncScroll || !previewScrollRef.current) return;
      const el = previewScrollRef.current;
      const maxPreviewScroll = el.scrollHeight - el.clientHeight;
      if (maxPreviewScroll <= 0) return;

      if (typeof scrollHeight === 'number' && typeof clientHeight === 'number') {
        const maxEditorScroll = scrollHeight - clientHeight;
        const percentage = maxEditorScroll > 0 ? scrollTopOrPercentage / maxEditorScroll : 0;
        el.scrollTop = maxPreviewScroll * Math.max(0, Math.min(1, percentage));
      } else {
        el.scrollTop = maxPreviewScroll * Math.max(0, Math.min(1, scrollTopOrPercentage));
      }
    },
    [settings.syncScroll]
  );

  // ツールバー各種フォーマット挿入＆見出しジャンプアクション (useEditorToolbarActions)
  const {
    handleFormat,
    handleInsertDate,
    handleInsertTable,
    handleInsertMermaidTemplate,
    handleJumpToHeading,
  } = useEditorToolbarActions({
    content: currentDoc.content,
    updateDocContent,
    editorTextareaRef,
    previewScrollRef,
    settings,
    setCursorLine,
    setCursorCol,
    setIsTableModalOpen,
  });

  // ウィンドウおよび HTML5 ドラッグ＆ドロップ処理 (useWindowDragDrop)
  const {
    isAppDraggingOver,
    handleAppDragOver,
    handleAppDragLeave,
    handleAppDrop,
    handleDroppedFiles,
    handleDroppedFile,
  } = useWindowDragDrop({
    handleAddOpenedDoc,
    handleFormat,
    defaultAuthor: settings.defaultAuthor,
  });

  return (
    <div
      className={`relative h-screen w-screen flex flex-col overflow-hidden font-sans print:h-auto print:w-full print:overflow-visible print:block print:bg-white print:text-slate-900 ${
        isDark ? 'dark bg-slate-950 text-slate-100' : 'light bg-slate-100 text-slate-900'
      }`}
      onDragOver={handleAppDragOver}
      onDragLeave={handleAppDragLeave}
      onDrop={handleAppDrop}
    >
      {/* アプリ画面全体ドロップのビジュアルオーバーレイ */}
      {isAppDraggingOver && (
        <div className="fixed inset-0 z-[100] bg-cyan-950/90 border-4 border-dashed border-cyan-400 rounded-xl flex flex-col items-center justify-center text-cyan-100 backdrop-blur-md transition-all pointer-events-none">
          <div className="p-6 bg-cyan-900/80 rounded-full mb-4 shadow-2xl animate-bounce">
            <Upload className="w-12 h-12 text-cyan-300" />
          </div>
          <p className="text-2xl font-bold tracking-wide">ファイルまたは画像をアプリ上にドロップ</p>
          <p className="text-sm text-cyan-300 mt-2">📄 テキストファイル：新しいタブで開く ／ 🖼️ 画像：カーソル位置に挿入</p>
        </div>
      )}
      {/* 非表示のファイル選択インプット */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept=".md,.txt,.markdown"
        className="hidden"
      />

      {/* タイトルバー (Zenモード時は非表示) */}
      {!isZenMode && (
        <TitleBar
          currentDoc={currentDoc}
          onUpdateTitle={handleUpdateTitle}
          onUpdateAuthor={handleUpdateAuthor}
          onUpdateUpdatedBy={handleUpdateUpdatedBy}
          defaultAuthor={settings.defaultAuthor}
          saveStatus={saveStatus}
          lastSavedTime={lastSavedTime}
          onNewDoc={handleNewDoc}
          onOpenLocalFile={handleOpenLocalFile}
          onSaveFile={handleSaveCurrentDoc}
          onDuplicateDoc={handleDuplicateDoc}
          onExportMarkdown={handleExportMarkdown}
          onExportHtml={handleExportHtml}
          onExportPdfDirect={handleExportPdfDirect}
          onPrint={handlePrint}
          onOpenTemplates={() => setIsTemplateModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenAbout={() => setIsAboutModalOpen(true)}
          onOpenHelpGuide={() => setIsHelpGuideModalOpen(true)}
          onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
          onOpenDiffModal={() => setIsDiffModalOpen(true)}
          onOpenBatchConvert={() => setIsBatchConvertModalOpen(true)}
          onOpenLogModal={() => setIsLogModalOpen(true)}
          onOpenStatsModal={() => setIsStatsModalOpen(true)}
          isZenMode={isZenMode}
          onToggleZenMode={toggleZenMode}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          theme={settings.theme || 'dark'}
          onChangeTheme={handleChangeTheme}
          isDark={isDark}
          isDualPane={isDualPane}
        />
      )}

      {/* メインワークスペース本体 */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* サイドバー (Zenモード時は非表示) */}
        {!isZenMode && (
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            docs={docs}
            activeDocId={activeDocId}
            currentDoc={currentDoc}
            onSelectDoc={handleSelectDoc}
            onOpenInSecondaryPane={handleOpenInSecondaryPane}
            onNewDoc={handleNewDoc}
            onDeleteDoc={handleDeleteDoc}
            onToggleFavorite={handleToggleFavorite}
            onOpenTemplates={() => setIsTemplateModalOpen(true)}
            onJumpToHeading={handleJumpToHeading}
            isDark={isDark}
            width={sidebarWidth}
            onWidthChange={handleSidebarWidthChange}
          />
        )}

        {/* コンテンツエリア (TabBar + ツールバー + 分割ビュー) */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative print:h-auto print:w-full print:overflow-visible print:block print:static">
          {/* マルチタブバー (Zenモード時は非表示) */}
          {!isZenMode && (
            <TabBar
              docs={docs}
              openTabIds={openTabIds}
              activeDocId={activeDocId}
              saveStatus={saveStatus}
              onSelectTab={(id) => handleSelectTabWithDualPane(id, handleSelectTab)}
              onCloseTab={(id) => handleCloseTabWithDualPane(id, handleCloseTab)}
              onCloseOtherTabs={handleCloseOtherTabs}
              onNewDoc={handleNewDoc}
              onOpenDiffModal={() => setIsDiffModalOpen(true)}
              isDualPane={isDualPane}
              onToggleDualPane={handleToggleDualPane}
              onOpenInSecondaryPane={handleOpenInSecondaryPane}
              isDark={isDark}
            />
          )}

          {/* 入力補助ツールバー (Zenモード時は非表示) */}
          {!isZenMode && viewMode !== 'preview' && (
            <Toolbar
              onFormat={handleFormat}
              onOpenTableModal={() => setIsTableModalOpen(true)}
              onInsertDate={handleInsertDate}
              onImageUpload={handleDroppedFile}
              onAutoFormat={handleAutoFormat}
              onInsertMermaidTemplate={handleInsertMermaidTemplate}
              isDark={isDark}
            />
          )}

          {/* Zenモード時の浮遊解除ボタン */}
          {isZenMode && (
            <div className="absolute top-3 right-4 z-40 transition-opacity opacity-50 hover:opacity-100">
              <button
                onClick={() => setIsZenMode(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border shadow-lg backdrop-blur-md transition-all ${
                  isDark
                    ? 'bg-slate-900/90 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-amber-400'
                    : 'bg-white/90 border-slate-300 text-slate-800 hover:bg-slate-100 hover:text-amber-600'
                }`}
                title="Zen集中執筆モードを解除 (Esc または Ctrl+Shift+Z)"
              >
                <Minimize2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Zenモード解除 (Esc)</span>
              </button>
            </div>
          )}

          {/* エディタ＆プレビュー ワークスペースコンテナ */}
          {isDualPane && secondaryDoc ? (
            <DualPaneWorkspace
              leftDoc={leftDoc}
              secondaryDoc={secondaryDoc}
              viewMode={viewMode}
              activePane={activePane}
              onFocusPane={handleFocusPane}
              onCloseSecondaryPane={handleCloseSecondaryPane}
              onUpdateContent={updateDocContent}
              settings={settings}
              isDark={isDark}
              onCursorChange={(line, col) => {
                setCursorLine(line);
                setCursorCol(col);
              }}
              onScrollSync={handleScrollSync}
              onImageDrop={handleDroppedFile}
              onDropFiles={handleDroppedFiles}
              onUpdateTags={handleUpdateTags}
              onUpdateSummary={handleUpdateSummary}
              onLeftTextareaRef={(el) => {
                if (activePane === 'left') editorTextareaRef.current = el;
              }}
              onRightTextareaRef={(el) => {
                if (activePane === 'right') editorTextareaRef.current = el;
              }}
              onLoadFullDoc={async (doc) => {
                if (!doc.filePath) return;
                const fullDoc = await loadFullNativeDoc(doc);
                if (fullDoc) {
                  setDocs((prevDocs) => prevDocs.map((d) => (d.id === doc.id ? fullDoc : d)));
                }
              }}
              onLoadMoreChunk={async (doc) => {
                if (!doc.filePath) return;
                const updatedDoc = await loadMoreChunkNativeDoc(doc);
                if (updatedDoc) {
                  setDocs((prevDocs) => prevDocs.map((d) => (d.id === doc.id ? updatedDoc : d)));
                }
              }}
              onToggleTaskItem={handleToggleTaskItem}
            />
          ) : (
            <div className={`flex-1 flex min-h-0 overflow-hidden relative print:block print:w-full print:h-auto print:overflow-visible print:static print:p-0 print:m-0 ${
              isZenMode && viewMode === 'editor' ? 'max-w-5xl mx-auto w-full px-2 sm:px-6 py-2' : ''
            }`}>
              {/* エディタパネル */}
              <div className={`flex-1 h-full flex flex-col min-w-0 print:hidden ${
                viewMode === 'preview' ? 'hidden' : ''
              } ${
                viewMode === 'split' ? (isDark ? 'border-r border-slate-800/80' : 'border-r border-slate-200') : ''
              }`}>
                <Editor
                  content={currentDoc.content}
                  onChange={updateDocContent}
                  settings={settings}
                  onCursorChange={(line, col) => {
                    setCursorLine(line);
                    setCursorCol(col);
                  }}
                  onScrollSync={handleScrollSync}
                  onImageDrop={handleDroppedFile}
                  onDropFiles={handleDroppedFiles}
                  doc={currentDoc}
                  onUpdateTags={handleUpdateTags}
                  onUpdateSummary={handleUpdateSummary}
                  onTextareaRef={(el) => { editorTextareaRef.current = el; }}
                  isDark={isDark}
                  viewMode={viewMode}
                  onLoadFullDoc={handleLoadFullDoc}
                  onLoadMoreChunk={handleLoadMoreChunk}
                />
              </div>

              {/* プレビューパネル (常時マウント＋CSS表示切替で即時レイアウト反映＆全ページ同期) */}
              <div className={`flex-1 h-full flex flex-col min-w-0 print:block print:w-full print:static print:p-0 print:m-0 ${
                viewMode === 'editor' ? 'hidden print:block' : ''
              }`}>
                <Preview
                  key={currentDoc.id}
                  content={currentDoc.content}
                  docTitle={currentDoc.title}
                  onToggleTaskItem={handleToggleTaskItem}
                  onScrollRef={(el) => {
                    previewScrollRef.current = el;
                  }}
                  isDark={isDark}
                  fontSize={settings.fontSize}
                  lineHeight={settings.lineHeight}
                  fontFamily={settings.fontFamily}
                  headingTheme={settings.headingTheme}
                  codeBlockTheme={settings.codeBlockTheme}
                  previewEngine={settings.previewEngine}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ステータスバー (Zenモード時は非表示) */}
      {!isZenMode && (
        <StatusBar
          stats={stats}
          cursorLine={cursorLine}
          cursorCol={cursorCol}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          saveStatus={saveStatus}
          lastSavedTime={lastSavedTime}
          filePath={currentDoc.filePath}
          isRemote={currentDoc.isRemote}
          updatedAt={currentDoc.updatedAt}
          encoding={currentDoc.encoding}
          onChangeEncoding={handleChangeEncoding}
          onOpenStatsModal={() => setIsStatsModalOpen(true)}
          onSaveFile={handleSaveCurrentDoc}
          proofreadingIssues={proofreadingIssues}
          isDark={isDark}
        />
      )}

      {/* モーダル群集約コンポーネント */}
      <ModalGroup
        isTableModalOpen={isTableModalOpen}
        setIsTableModalOpen={setIsTableModalOpen}
        isTemplateModalOpen={isTemplateModalOpen}
        setIsTemplateModalOpen={setIsTemplateModalOpen}
        isSettingsModalOpen={isSettingsModalOpen}
        setIsSettingsModalOpen={setIsSettingsModalOpen}
        isAboutModalOpen={isAboutModalOpen}
        setIsAboutModalOpen={setIsAboutModalOpen}
        isHelpGuideModalOpen={isHelpGuideModalOpen}
        setIsHelpGuideModalOpen={setIsHelpGuideModalOpen}
        isShortcutsModalOpen={isShortcutsModalOpen}
        setIsShortcutsModalOpen={setIsShortcutsModalOpen}
        isDiffModalOpen={isDiffModalOpen}
        setIsDiffModalOpen={setIsDiffModalOpen}
        isBatchConvertModalOpen={isBatchConvertModalOpen}
        setIsBatchConvertModalOpen={setIsBatchConvertModalOpen}
        isLogModalOpen={isLogModalOpen}
        setIsLogModalOpen={setIsLogModalOpen}
        isStatsModalOpen={isStatsModalOpen}
        setIsStatsModalOpen={setIsStatsModalOpen}
        currentDoc={currentDoc}
        previousDoc={previousDoc}
        docs={docs}
        openTabIds={openTabIds}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onInsertTable={handleInsertTable}
        onSelectTemplate={handleSelectTemplate}
        stats={stats}
        isDark={isDark}
      />

      {/* フローティングトースト通知 */}
      <Toast toast={toast} onClose={() => setToast(null)} isDark={isDark} />
    </div>
  );
}
