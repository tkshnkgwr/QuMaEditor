import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MarkdownDoc,
  ViewMode,
  EditorSettings,
  TextStats,
  SupportedEncoding,
  ThemeMode,
} from './types';
import {
  saveStoredDocs,
  loadSettings,
  saveSettings,
} from './utils/storage';
import { calculateTextStats, insertFormatting } from './utils/markdownUtils';
import { decodeFileContent } from './utils/encodingUtils';
import { parseYamlFrontMatter } from './utils/yamlUtils';
import { parseMarkdownNative } from './utils/tauriNative';
import { openNativeFileFromPath } from './utils/fileSystem';
import { commands } from './bindings';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { TabBar } from './components/TabBar';
import { Toolbar } from './components/Toolbar';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { StatusBar } from './components/StatusBar';
import { Minimize2, Upload } from 'lucide-react';
import { TableModal } from './components/TableModal';
import { TemplateModal } from './components/TemplateModal';
import { SettingsModal } from './components/SettingsModal';
import { AboutModal } from './components/AboutModal';
import { HelpGuideModal } from './components/HelpGuideModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { DiffModal } from './components/DiffModal';
import { BatchConvertModal } from './components/BatchConvertModal';
import { LogModal } from './components/LogModal';
import { logger } from './utils/logger';

// リファクタリング用に分離したカスタムフック
import { useModalState } from './hooks/useModalState';
import { useDocumentManager } from './hooks/useDocumentManager';
import { useFileOperations } from './hooks/useFileOperations';

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
    handleUpdateUpdatedBy,
    handleUpdateTags,
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

  const handleChangeTheme = (newTheme: ThemeMode) => {
    handleUpdateSettings({ theme: newTheme });
  };

  // 表示レイアウト＆サイドバー幅
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
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
  const [saveStatus, setSaveStatus] = useState<import('./types').SaveStatus>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // カーソル位置
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);

  // 参照 (Refs)
  const previewScrollRef = useRef<HTMLDivElement | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editorTextareaRef = useRef<HTMLTextAreaElement | null>(null);

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
  });

  // テキスト統計情報
  const stats: TextStats = calculateTextStats(currentDoc.content);

  // 前回のドキュメント情報（差分比較用）
  const previousDoc = docs.find((d) => d.id === previousDocId);

  // テキスト内容の更新＆自動保存タイマー
  const updateDocContent = (newContent: string) => {
    const nowISO = new Date().toISOString();
    const updaterName = settings.defaultAuthor?.trim() || currentDoc.updatedBy || currentDoc.author || 'Unknown';

    setDocs((prevDocs) =>
      prevDocs.map((doc) =>
        doc.id === currentDoc.id
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
      if (currentDoc.isRemote) {
        setSaveStatus('unsaved');
        logger.info(
          `[自動保存スキップ] リモートファイル "${currentDoc.title}" (ID: ${currentDoc.id}) はリモート仕様に基づき自動保存されません。`
        );
        return;
      }

      setSaveStatus('saving');
      let savedToFile = false;
      if (currentDoc.filePath) {
        const { saveNativeFile } = await import('./utils/fileSystem');
        const res = await saveNativeFile(currentDoc, { forceSaveAs: false, defaultAuthor: settings.defaultAuthor });
        if (res.success) {
          savedToFile = true;
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

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setIsShortcutsModalOpen(true);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'Z' || e.key === 'z')) {
        e.preventDefault();
        toggleZenMode();
        return;
      }
      if (isZenMode && e.key === 'Escape') {
        e.preventDefault();
        setIsZenMode(false);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSaveCurrentDoc({ forceSaveAs: e.shiftKey });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        handleOpenLocalFile();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        handleNewDoc();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        handlePrint();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZenMode, handleSaveCurrentDoc, handleOpenLocalFile, handleNewDoc, handlePrint, toggleZenMode, setIsZenMode, setIsShortcutsModalOpen]);

  // 起動時のファイルオープンイベントリスナー
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    const setupListener = async () => {
      try {
        unlisten = await listen<string>('open-file', async (event) => {
          const filePath = event.payload;
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
        });
      } catch (e) {
        console.log('Tauri listen error:', e);
      }
    };

    setupListener();
    return () => {
      if (unlisten) unlisten();
    };
  }, [handleAddOpenedDoc]);

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
              const { readFile } = await import('@tauri-apps/plugin-fs');
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
    [handleAddOpenedDoc]
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

  // スクロール連動
  const handleScrollSync = useCallback((percentage: number) => {
    if (previewScrollRef.current) {
      const el = previewScrollRef.current;
      const maxScroll = el.scrollHeight - el.clientHeight;
      el.scrollTop = maxScroll * percentage;
    }
  }, []);

  // 画像/ファイルのドロップ処理（複数ファイル・画像/テキスト自動判別対応）
  const handleDroppedFiles = async (files: File[]) => {
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
            author: metadata.author || settings.defaultAuthor || 'Unknown',
            updatedBy: metadata.updatedBy || metadata.author || settings.defaultAuthor || 'Unknown',
            content: body,
            encoding: (metadata.encoding as SupportedEncoding) || 'UTF-8',
            createdAt: metadata.created || new Date().toISOString(),
            updatedAt: metadata.updated || new Date().toISOString(),
            tags: metadata.tags || [],
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
  };

  const handleDroppedFile = (file: File) => {
    handleDroppedFiles([file]);
  };

  // ツールバー各種フォーマット挿入
  const handleFormat = (type: string, value?: string) => {
    const textarea = editorTextareaRef.current;
    const { newText, newCursorStart, newCursorEnd } = insertFormatting(
      currentDoc.content,
      textarea?.selectionStart || 0,
      textarea?.selectionEnd || 0,
      type,
      value
    );

    updateDocContent(newText);

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(newCursorStart, newCursorEnd);
      }
    }, 0);
  };

  // 日付挿入
  const handleInsertDate = () => {
    const dateStr = new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    });
    handleFormat('text', dateStr);
  };

  // テーブル挿入
  const handleInsertTable = (markdownTable: string) => {
    handleFormat('text', `\n${markdownTable}\n`);
    setIsTableModalOpen(false);
  };

  const handleAppDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    setIsAppDraggingOver(true);
  };

  const handleAppDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsAppDraggingOver(false);
    }
  };

  const handleAppDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAppDraggingOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleDroppedFiles(Array.from(files));
    }
  };

  return (
    <div
      className={`relative h-screen w-screen flex flex-col overflow-hidden font-sans ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
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
          onUpdateAuthor={(newAuthor) => {
            setDocs((prevDocs) =>
              prevDocs.map((doc) =>
                doc.id === currentDoc.id
                  ? { ...doc, author: newAuthor, updatedAt: new Date().toISOString() }
                  : doc
              )
            );
            saveStoredDocs(docs);
          }}
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
          isZenMode={isZenMode}
          onToggleZenMode={toggleZenMode}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          theme={settings.theme || 'dark'}
          onChangeTheme={handleChangeTheme}
          isDark={isDark}
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
            onSelectDoc={handleSelectDoc}
            onNewDoc={handleNewDoc}
            onDeleteDoc={handleDeleteDoc}
            onToggleFavorite={handleToggleFavorite}
            onOpenTemplates={() => setIsTemplateModalOpen(true)}
            isDark={isDark}
            width={sidebarWidth}
            onWidthChange={handleSidebarWidthChange}
          />
        )}

        {/* コンテンツエリア (TabBar + ツールバー + 分割ビュー) */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
          {/* マルチタブバー (Zenモード時は非表示) */}
          {!isZenMode && (
            <TabBar
              docs={docs}
              openTabIds={openTabIds}
              activeDocId={activeDocId}
              saveStatus={saveStatus}
              onSelectTab={handleSelectTab}
              onCloseTab={handleCloseTab}
              onCloseOtherTabs={handleCloseOtherTabs}
              onNewDoc={handleNewDoc}
              onOpenDiffModal={() => setIsDiffModalOpen(true)}
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
          <div className={`flex-1 flex min-h-0 overflow-hidden relative print:block print:w-full print:static print:p-0 print:m-0 ${
            isZenMode && viewMode === 'editor' ? 'max-w-5xl mx-auto w-full px-2 sm:px-6 py-2' : ''
          }`}>
            {/* エディタパネル */}
            {(viewMode === 'split' || viewMode === 'editor') && (
              <div className={`flex-1 h-full flex flex-col min-w-0 print:hidden ${
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
                  onTextareaRef={(el) => { editorTextareaRef.current = el; }}
                  isDark={isDark}
                />
              </div>
            )}

            {/* プレビューパネル */}
            {(viewMode === 'split' || viewMode === 'preview') && (
              <div className="flex-1 h-full flex flex-col min-w-0 print:block print:w-full print:static print:p-0 print:m-0">
                <Preview
                  content={currentDoc.content}
                  onScrollRef={(el) => {
                    previewScrollRef.current = el;
                  }}
                  isDark={isDark}
                  fontSize={settings.fontSize}
                />
              </div>
            )}
          </div>
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
          updatedAt={currentDoc.updatedAt}
          encoding={currentDoc.encoding || 'UTF-8'}
          onChangeEncoding={handleChangeEncoding}
          isDark={isDark}
        />
      )}

      {/* モーダル群 */}
      <TableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        onInsertTable={handleInsertTable}
      />

      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
        isDark={isDark}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetData={() => {
          localStorage.clear();
          window.location.reload();
        }}
        isDark={isDark}
      />

      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        isDark={isDark}
      />

      <HelpGuideModal
        isOpen={isHelpGuideModalOpen}
        onClose={() => setIsHelpGuideModalOpen(false)}
        isDark={isDark}
      />

      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        isDark={isDark}
      />

      <DiffModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        activeDoc={currentDoc}
        previousDoc={previousDoc}
        allDocs={docs}
        openTabIds={openTabIds}
        isDark={isDark}
      />

      <BatchConvertModal
        isOpen={isBatchConvertModalOpen}
        onClose={() => setIsBatchConvertModalOpen(false)}
        isDark={isDark}
      />

      <LogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        isDark={isDark}
      />
    </div>
  );
}
