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
  loadStoredDocs,
  saveStoredDocs,
  loadActiveDocId,
  saveActiveDocId,
  loadOpenTabIds,
  saveOpenTabIds,
  loadSettings,
  saveSettings,
  DEFAULT_SETTINGS
} from './utils/storage';
import { calculateTextStats, insertFormatting, toggleTaskInMarkdown } from './utils/markdownUtils';
import { decodeFileContent, prepareEncodedBlob } from './utils/encodingUtils';
import { parseYamlFrontMatter, buildFullMarkdownWithFrontMatter } from './utils/yamlUtils';
import { generatePdfNative, parseMarkdownNative } from './utils/tauriNative';
import { openNativeFileDialog, saveNativeFile, openNativeFileFromPath } from './utils/fileSystem';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { TabBar } from './components/TabBar';
import { Toolbar } from './components/Toolbar';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { StatusBar } from './components/StatusBar';
import { Minimize2, Eye } from 'lucide-react';
import { TableModal } from './components/TableModal';
import { TemplateModal } from './components/TemplateModal';
import { SettingsModal } from './components/SettingsModal';
import { AboutModal } from './components/AboutModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { DiffModal } from './components/DiffModal';
import { BatchConvertModal } from './components/BatchConvertModal';

import { LogModal } from './components/LogModal';
import { logger } from './utils/logger';

export default function App() {
  // ドキュメント一覧の状態
  const [docs, setDocs] = useState<MarkdownDoc[]>(loadStoredDocs);
  const [activeDocId, setActiveDocId] = useState<string>(loadActiveDocId);
  const [previousDocId, setPreviousDocId] = useState<string | undefined>(undefined);
  const [openTabIds, setOpenTabIds] = useState<string[]>(() => loadOpenTabIds(docs));
  const [settings, setSettings] = useState<EditorSettings>(loadSettings);


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
      // 古いブラウザ用の互換性
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // 適用する実際のテーマモード
  const effectiveTheme: 'dark' | 'light' =
    settings.theme === 'system' ? systemTheme : settings.theme || 'dark';
  const isDark = effectiveTheme === 'dark';

  const handleChangeTheme = (newTheme: ThemeMode) => {
    handleUpdateSettings({ theme: newTheme });
  };

  // アクティブな表示状態
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // UPDATE 2026-08-04: 自動保存ステータスに編集中 ('editing') を追加
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // カーソル位置・統計情報
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);

  // モーダルダイアログ & Zenモードの状態
  const [isZenMode, setIsZenMode] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isBatchConvertModalOpen, setIsBatchConvertModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);


  // 参照 (Refs)
  const previewScrollRef = useRef<HTMLDivElement | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 現在アクティブなドキュメントの取得
  const currentDoc = docs.find((d) => d.id === activeDocId) || docs[0] || {
    id: 'default',
    title: '無題のドキュメント',
    content: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // テキスト統計情報
  const stats: TextStats = calculateTextStats(currentDoc.content);

  // UPDATE 2026-08-04: リモートファイルの場合は自動保存をスキップし、ローカルファイルのみ最長10秒のキー入力停止後に自動保存する制御とログ記録
  const updateDocContent = (newContent: string) => {
    // メモリ内テキスト状態を即時更新
    setDocs((prevDocs) =>
      prevDocs.map((doc) =>
        doc.id === currentDoc.id
          ? { ...doc, content: newContent, updatedAt: new Date().toISOString() }
          : doc
      )
    );

    // タイピング継続中のため既存の自動保存タイマーを即時キャンセル＆リセット
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // キー入力中（打鍵中）は「編集中」ステータスにし、一切の保存処理を実行しない
    setSaveStatus('editing');

    // キー入力が完全にストップして指定時間（最小2000ms、デフォルト3000ms）経過後に保存を実行
    const delayMs = Math.max(2000, Math.min(10000, settings.autoSaveIntervalMs || 3000));

    autoSaveTimeoutRef.current = setTimeout(async () => {
      // リモートファイルの場合: 仕様に基づき自動保存を行わない
      if (currentDoc.isRemote) {
        setSaveStatus('unsaved');
        logger.info(
          `[自動保存スキップ] リモートファイル "${currentDoc.title}" (ID: ${currentDoc.id}) はリモート仕様に基づき自動保存されません。`,
          `URL: ${currentDoc.remoteUrl || 'N/A'}`
        );
        return;
      }

      // 入力完全停止後の保存実行
      setSaveStatus('saving');

      // 実ファイルパスが存在する場合は実ファイルにもバックグラウンド直上書き
      if (currentDoc.filePath) {
        await saveNativeFile(currentDoc, { forceSaveAs: false });
      }

      setDocs((latestDocs) => {
        saveStoredDocs(latestDocs);
        return latestDocs;
      });
      setSaveStatus('saved');
      const timeStr = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTime(timeStr);
      logger.info(
        `[自動保存完了] 打鍵停止後、"${currentDoc.title}" を自動保存しました (${timeStr})`,
        currentDoc.filePath ? `ファイルパス: ${currentDoc.filePath}` : `ドキュメントID: ${currentDoc.id}`
      );
    }, delayMs);
  };

  // UPDATE 2026-08-04: プレビュー側からのタスク変更機能の中止
  // Why: ユーザー指示に基づき、プレビュー側での操作によるMarkdown書き換え・トグル動作を無効化し表示専用に戻すため。
  /* handleToggleTaskItem は中止されました */

  // タイトルの更新
  const handleUpdateTitle = (newTitle: string) => {
    setDocs((prevDocs) => {
      const updated = prevDocs.map((doc) =>
        doc.id === currentDoc.id
          ? { ...doc, title: newTitle, updatedAt: new Date().toISOString() }
          : doc
      );
      saveStoredDocs(updated);
      return updated;
    });
    setSaveStatus('saved');
  };

  // タブの選択
  const handleSelectTab = (id: string) => {
    if (id !== activeDocId) {
      setPreviousDocId(activeDocId);
    }
    setActiveDocId(id);
    saveActiveDocId(id);
    if (!openTabIds.includes(id)) {
      setOpenTabIds((prev) => {
        const next = [...prev, id];
        saveOpenTabIds(next);
        return next;
      });
    }
  };


  // タブを閉じる
  const handleCloseTab = (idToClose: string) => {
    const nextOpen = openTabIds.filter((id) => id !== idToClose);

    // すべてのタブが閉じられた場合、新規作成
    if (nextOpen.length === 0) {
      const newDoc: MarkdownDoc = {
        id: `doc-${Date.now()}`,
        title: '新規ドキュメント',
        content: '# 新規ドキュメント\n\nここから記述を開始してください。',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isFavorite: false,
      };
      const updatedDocs = [newDoc, ...docs];
      setDocs(updatedDocs);
      saveStoredDocs(updatedDocs);
      setActiveDocId(newDoc.id);
      saveActiveDocId(newDoc.id);
      setOpenTabIds([newDoc.id]);
      saveOpenTabIds([newDoc.id]);
      return;
    }

    setOpenTabIds(nextOpen);
    saveOpenTabIds(nextOpen);

    // 閉じたタブがアクティブだった場合、隣のタブをアクティブ化
    if (activeDocId === idToClose) {
      const currentIndex = openTabIds.indexOf(idToClose);
      const nextActiveIndex = Math.max(0, currentIndex - 1);
      const nextActiveId = nextOpen[nextActiveIndex] || nextOpen[0];
      setActiveDocId(nextActiveId);
      saveActiveDocId(nextActiveId);
    }
  };

  // 他のタブをすべて閉じる
  const handleCloseOtherTabs = (keepId: string) => {
    const nextOpen = [keepId];
    setOpenTabIds(nextOpen);
    saveOpenTabIds(nextOpen);
    setActiveDocId(keepId);
    saveActiveDocId(keepId);
  };

  // ドキュメントの選択
  const handleSelectDoc = (id: string) => {
    handleSelectTab(id);
  };

  // 新規ドキュメントの作成
  const handleNewDoc = () => {
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

    const updated = [newDoc, ...docs];
    setDocs(updated);
    saveStoredDocs(updated);
    setActiveDocId(newDoc.id);
    saveActiveDocId(newDoc.id);
    setOpenTabIds((prev) => {
      const next = prev.includes(newDoc.id) ? prev : [...prev, newDoc.id];
      saveOpenTabIds(next);
      return next;
    });
  };

  // PC/ファイルサーバーのローカルファイルを開く (Tauri ネイティブダイアログ優先)
  const handleOpenLocalFile = async () => {
    // まず Tauri ネイティブダイアログでのファイルオープンを試行
    const nativeResult = await openNativeFileDialog();
    if (nativeResult) {
      const { doc: openedDoc } = nativeResult;
      setDocs((prevDocs) => {
        // すでに同じパスが開かれているかチェック
        const existing = prevDocs.find((d) => d.filePath === openedDoc.filePath && d.filePath);
        if (existing) {
          setActiveDocId(existing.id);
          saveActiveDocId(existing.id);
          setOpenTabIds((prev) => (prev.includes(existing.id) ? prev : [...prev, existing.id]));
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
      logger.info(
        `[ファイルオープン成功] ファイルを開きました: "${openedDoc.title}"`,
        `パス: ${openedDoc.filePath}`
      );
      return;
    }

    // Web ブラウザ環境等のフォールバック
    fileInputRef.current?.click();
  };

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

      // YAML Front Matter の解釈
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

      setDocs((prevDocs) => {
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
    };
    reader.readAsArrayBuffer(file);
    // 同じファイル名を再選択できるように値をリセット
    e.target.value = '';
  };

  // 実ファイルへの保存（直上書き保存 または 名前を付けて保存）
  const handleSaveCurrentDoc = async (options: { forceSaveAs?: boolean } = {}) => {
    setSaveStatus('saving');

    // Tauri ネイティブ保存の試行
    const res = await saveNativeFile(currentDoc, options);

    if (res.success && res.filePath) {
      const updatedDocPath = res.filePath;
      const fileNameWithExt = updatedDocPath.split(/[/\\]/).pop() || currentDoc.title;
      const newTitle = res.isSaveAs ? (fileNameWithExt.replace(/\.[^/.]+$/, '') || currentDoc.title) : currentDoc.title;

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

      setSaveStatus('saved');
      const timeStr = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTime(timeStr);

      logger.info(
        res.isSaveAs
          ? `[名前を付けて保存完了] "${newTitle}" をファイル保存しました (${timeStr})`
          : `[上書き保存完了] 元ファイル "${newTitle}" へ直上書き保存しました (${timeStr})`,
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
  };

  // ドキュメントのタグ変更 (Yama YAML Front Matter用)
  const handleUpdateTags = (newTags: string[]) => {
    setDocs((prevDocs) => {
      const updated = prevDocs.map((doc) =>
        doc.id === currentDoc.id
          ? { ...doc, tags: newTags, updatedAt: new Date().toISOString() }
          : doc
      );
      saveStoredDocs(updated);
      return updated;
    });
    setSaveStatus('saved');
  };

  // ドキュメントの文字コード変更
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

  // ドキュメントの複製
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
    const updated = [dupDoc, ...docs];
    setDocs(updated);
    saveStoredDocs(updated);
    setActiveDocId(dupDoc.id);
    saveActiveDocId(dupDoc.id);
    setOpenTabIds((prev) => {
      const next = prev.includes(dupDoc.id) ? prev : [...prev, dupDoc.id];
      saveOpenTabIds(next);
      return next;
    });
  };

  // ドキュメントの削除
  const handleDeleteDoc = (id: string) => {
    if (docs.length <= 1) return;
    const filtered = docs.filter((d) => d.id !== id);
    setDocs(filtered);
    saveStoredDocs(filtered);

    // タブからも削除
    const nextOpen = openTabIds.filter((tabId) => tabId !== id);
    const validNextOpen = nextOpen.length > 0 ? nextOpen : [filtered[0].id];
    setOpenTabIds(validNextOpen);
    saveOpenTabIds(validNextOpen);

    if (activeDocId === id) {
      const nextActiveId = validNextOpen[0] || filtered[0].id;
      setActiveDocId(nextActiveId);
      saveActiveDocId(nextActiveId);
    }
  };

  // お気に入り切替
  const handleToggleFavorite = (id: string) => {
    setDocs((prev) => {
      const updated = prev.map((d) => (d.id === id ? { ...d, isFavorite: !d.isFavorite } : d));
      saveStoredDocs(updated);
      return updated;
    });
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
    const updated = [tplDoc, ...docs];
    setDocs(updated);
    saveStoredDocs(updated);
    setActiveDocId(tplDoc.id);
    saveActiveDocId(tplDoc.id);
  };

  // Markdown (.md) ファイルの出力 (YAML Front Matter付与、文字コード＆改行コード変換適用)
  const handleExportMarkdown = () => {
    const encoding = currentDoc.encoding || 'UTF-8';
    const fullMarkdownText = buildFullMarkdownWithFrontMatter(currentDoc);
    const blob = prepareEncodedBlob(fullMarkdownText, encoding);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentDoc.title || 'document'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // HTML ファイルの出力 (Rust parseMarkdownNative による完全変換)
  const handleExportHtml = async () => {
    try {
      const { body } = parseYamlFrontMatter(currentDoc.content);
      const parsedBodyHtml = (await parseMarkdownNative(body)) || body;

      const htmlContent = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${currentDoc.title || '無題のドキュメント'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Meiryo", "Yu Gothic", sans-serif;
      line-height: 1.7;
      max-width: 860px;
      margin: 40px auto;
      padding: 0 24px;
      color: #1e293b;
      background-color: #ffffff;
    }
    h1, h2, h3, h4 { color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px; }
    h1 { font-size: 2em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.25em; color: #0284c7; }
    p { margin: 16px 0; }
    code { background: #f1f5f9; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.9em; border: 1px solid #e2e8f0; }
    pre { background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    pre code { background: transparent; color: inherit; border: none; padding: 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 0.9em; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; }
    th { bg-color: #f8fafc; background: #f1f5f9; font-weight: bold; color: #0f172a; }
    tr:nth-child(even) { background: #f8fafc; }
    blockquote { border-left: 4px solid #0284c7; margin: 20px 0; padding: 8px 16px; color: #475569; background: #f0f9ff; border-radius: 0 4px 4px 0; }
    ul, ol { padding-left: 24px; }
    li { margin: 6px 0; }
    a { color: #0284c7; text-decoration: underline; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 32px 0; }
  </style>
</head>
<body>
  <h1>${currentDoc.title || '無題のドキュメント'}</h1>
  ${parsedBodyHtml}
</body>
</html>`;
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentDoc.title || 'document'}.html`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('HTML export failed:', err);
      alert('HTMLのエクスポート中にエラーが発生しました。');
    }
  };

  // PDF直接生成状態
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // プレビュー画面から印刷 / PDF出力
  const triggerPreviewPrint = () => {
    // 表示モードが「エディタのみ」の場合は一時的に分割表示にし、プレビュー画面から確実にPDFを作成
    if (viewMode === 'editor') {
      setViewMode('split');
      setTimeout(() => {
        window.print();
      }, 100);
    } else {
      window.print();
    }
  };

  // 印刷 / PDF保存 (プレビュー表示から直接作成)
  const handlePrint = () => {
    triggerPreviewPrint();
  };

  // ワンクリック・ダイレクト PDF ファイル直接出力・保存 (印刷ダイアログ非経由)
  const handleExportPdfDirect = async () => {
    setIsExportingPdf(true);
    try {
      // プレビュー表示エリアのパース済み HTML とスタイルを取り出してスタンドアロン HTML/PDF ドキュメントを作成
      const previewEl = previewScrollRef.current || document.querySelector('.preview-markdown');
      const innerHtml = previewEl ? previewEl.innerHTML : '';
      
      // 完全な A4 印刷スタイリングを含む HTML 構造をパッケージ化
      const standaloneHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${currentDoc.title || 'ドキュメント'}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: "Meiryo", "Yu Gothic", "Segoe UI", sans-serif; font-size: 11pt; line-height: 1.6; color: #0f172a; background: #ffffff; padding: 0; margin: 0; }
    h1, h2, h3 { color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background: #f1f5f9; font-weight: bold; }
    pre { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 12px; font-family: monospace; white-space: pre-wrap; word-break: break-all; }
    code { background: #f1f5f9; color: #0369a1; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
    blockquote { border-left: 4px solid #0284c7; background: #f0f9ff; margin: 16px 0; padding: 8px 16px; color: #334155; }
    .no-print { display: none !important; }
  </style>
</head>
<body>
  ${innerHtml}
</body>
</html>`;

      // 直接ファイルダウンロード保存 (印刷ダイアログ非起動)
      const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentDoc.title || 'document'}_preview.html`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Direct PDF export failed:', err);
      alert('PDFの直接保存中にエラーが発生しました。');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // フォーマット補助
  const handleFormat = (type: any) => {
    // ドキュメントに書式を追加
    const res = insertFormatting(currentDoc.content, currentDoc.content.length, currentDoc.content.length, type);
    updateDocContent(res.newText);
  };

  // 表組 (テーブル) の挿入
  const handleInsertTable = (tableMd: string) => {
    const newContent = currentDoc.content + '\n\n' + tableMd + '\n\n';
    updateDocContent(newContent);
  };

  // 現在日時の挿入
  const handleInsertDate = () => {
    const dateStr = `\n\n**日時**: ${new Date().toLocaleString('ja-JP')}\n\n`;
    updateDocContent(currentDoc.content + dateStr);
  };

  // ドロップされたファイル全体のスマート判定ハンドラー (画像 ➔ インライン挿入 / テキスト ➔ タブで開く)
  const handleDroppedFile = async (file: File) => {
    // 画像ファイルの場合
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const imageName = file.name.replace(/\.[^/.]+$/, '');
        const imageMd = `\n\n![${imageName}](${dataUrl})\n\n`;
        updateDocContent(currentDoc.content + imageMd);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Markdown / テキストファイルの場合
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      if (!arrayBuffer) return;

      const uint8Array = new Uint8Array(arrayBuffer);
      const { text, encoding } = decodeFileContent(uint8Array);
      const defaultTitle = file.name.replace(/\.[^/.]+$/, '') || '無題のドキュメント';
      const { body, metadata } = parseYamlFrontMatter(text);
      const nativePath = (file as any).path || undefined;

      const openedDoc: MarkdownDoc = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: metadata.title || defaultTitle,
        content: body,
        encoding: (metadata.encoding as SupportedEncoding) || encoding,
        createdAt: metadata.created || new Date().toISOString(),
        updatedAt: metadata.updated || new Date().toISOString(),
        tags: metadata.tags || [],
        filePath: nativePath,
        isFavorite: false,
      };

      setDocs((prevDocs) => {
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
    };
    reader.readAsArrayBuffer(file);
  };

  // Tauri ネイティブ全画面ドラッグ＆ドロップの待機
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    const setupFileDrop = async () => {
      try {
        const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
        const appWindow = getCurrentWebviewWindow();
        unlisten = await appWindow.onDragDropEvent(async (event) => {
          if (event.payload.type === 'drop') {
            const paths = event.payload.paths;
            for (const filePath of paths) {
              if (/\.(md|markdown|txt|mdown|mkd)$/i.test(filePath) || !/\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(filePath)) {
                const res = await openNativeFileFromPath(filePath);
                if (res) {
                  const { doc: openedDoc } = res;
                  setDocs((prevDocs) => {
                    const existing = prevDocs.find((d) => d.filePath === openedDoc.filePath && d.filePath);
                    if (existing) {
                      setActiveDocId(existing.id);
                      saveActiveDocId(existing.id);
                      setOpenTabIds((prev) => (prev.includes(existing.id) ? prev : [...prev, existing.id]));
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
                }
              }
            }
          }
        });
      } catch (e) {
        console.log('DragDropEvent listener not active in Web mode');
      }
    };

    setupFileDrop();
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // スクロール同期処理
  const handleScrollSync = useCallback(
    (scrollTop: number, scrollHeight: number, clientHeight: number) => {
      if (!settings.syncScroll || !previewScrollRef.current) return;
      const scrollRatio = scrollTop / (scrollHeight - clientHeight || 1);
      const targetScrollTop = scrollRatio * (previewScrollRef.current.scrollHeight - previewScrollRef.current.clientHeight);
      previewScrollRef.current.scrollTop = targetScrollTop;
    },
    [settings.syncScroll]
  );

  // 設定の更新
  const handleUpdateSettings = (newSettings: Partial<EditorSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveSettings(updated);
  };

  // データを初期サンプルにリセット
  const handleResetData = () => {
    localStorage.clear();
    const freshDocs = loadStoredDocs();
    setDocs(freshDocs);
    setActiveDocId(freshDocs[0].id);
    setSettings(DEFAULT_SETTINGS);
  };

  // コマンドライン引数（二重起動時およびエクスプローラー「送る」）からのファイルオープンイベント待機
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    const setupListener = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event');
        unlisten = await listen<string>('open-file-from-cli', async (event) => {
          const targetPath = event.payload;
          if (!targetPath) return;

          const res = await openNativeFileFromPath(targetPath);
          if (res) {
            const { doc: openedDoc } = res;
            setDocs((prevDocs) => {
              const existing = prevDocs.find((d) => d.filePath === openedDoc.filePath && d.filePath);
              if (existing) {
                setActiveDocId(existing.id);
                saveActiveDocId(existing.id);
                setOpenTabIds((prev) => (prev.includes(existing.id) ? prev : [...prev, existing.id]));
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
            logger.info(
              `[CLI/送るファイルオープン] 外部からファイルを開きました: "${openedDoc.title}"`,
              `パス: ${openedDoc.filePath}`
            );
          }
        });
      } catch (e) {
        console.log('Tauri event listen not available:', e);
      }
    };

    setupListener();
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // グローバルキーボードショートカットのリスナー
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1 キーでショートカットヘルプを表示
      if (e.key === 'F1') {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
        return;
      }

      // EscキーでZenモードを解除
      if (e.key === 'Escape' && isZenMode) {
        e.preventDefault();
        setIsZenMode(false);
        return;
      }

      const isMod = e.ctrlKey || e.metaKey;

      if (isMod) {
        // Ctrl/Cmd + Shift + Z : Zen集中執筆モード切り替え
        if (e.key.toLowerCase() === 'z' && e.shiftKey) {
          e.preventDefault();
          setIsZenMode((prev) => !prev);
        }
        // Ctrl/Cmd + N : 新規ドキュメント
        else if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          handleNewDoc();
        }
        // Ctrl/Cmd + W : 現在のタブを閉じる
        else if (e.key.toLowerCase() === 'w') {
          e.preventDefault();
          handleCloseTab(activeDocId);
        }
        // Ctrl/Cmd + O : ファイルを開く
        else if (e.key.toLowerCase() === 'o') {
          e.preventDefault();
          handleOpenLocalFile();
        }
        // Ctrl/Cmd + S : 手動直上書き保存
        else if (e.key.toLowerCase() === 's' && !e.shiftKey) {
          e.preventDefault();
          handleSaveCurrentDoc({ forceSaveAs: false });
        }
        // Ctrl/Cmd + Shift + S : 名前を付けて保存
        else if (e.key.toLowerCase() === 's' && e.shiftKey) {
          e.preventDefault();
          handleSaveCurrentDoc({ forceSaveAs: true });
        }
        // Ctrl/Cmd + Shift + D : 差分比較モーダルを開く
        else if (e.key.toLowerCase() === 'd' && e.shiftKey) {
          e.preventDefault();
          setIsDiffModalOpen(true);
        }
        // Ctrl/Cmd + Shift + L : 動作ログ表示モーダルを開く
        else if (e.key.toLowerCase() === 'l' && e.shiftKey) {
          e.preventDefault();
          setIsLogModalOpen((prev) => !prev);
        }
        // Ctrl/Cmd + P : 印刷 / PDF
        else if (e.key.toLowerCase() === 'p') {
          e.preventDefault();
          handlePrint();
        }

      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [docs, activeDocId, openTabIds, isZenMode, handleNewDoc, handleOpenLocalFile, handleExportMarkdown]);

  return (
    <div
      className={`flex flex-col h-screen w-screen overflow-hidden font-sans transition-colors ${
        isDark ? 'dark bg-slate-950 text-slate-100' : 'light bg-slate-50 text-slate-900'
      }`}
      style={{ colorScheme: isDark ? 'dark' : 'light' }}
    >
      {/* ローカル/ネットワークファイルを開くための非表示ファイル入力 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept=".md,.markdown,.txt,.text,text/plain"
        className="hidden"
      />

      {/* タイトルバー (Zenモード時は非表示) */}
      {!isZenMode && (
        <TitleBar
          currentDoc={currentDoc}
          onUpdateTitle={handleUpdateTitle}
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
          onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
          onOpenDiffModal={() => setIsDiffModalOpen(true)}
          onOpenBatchConvert={() => setIsBatchConvertModalOpen(true)}
          onOpenLogModal={() => setIsLogModalOpen(true)}
          isZenMode={isZenMode}
          onToggleZenMode={() => setIsZenMode(!isZenMode)}
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
                  doc={currentDoc}
                  onUpdateTags={handleUpdateTags}
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
        currentDoc={currentDoc}
        isDark={isDark}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetData={handleResetData}
        isDark={isDark}
      />

      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
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
        previousDoc={docs.find((d) => d.id === previousDocId)}
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

      {/* PDF生成中ローディング表示 */}
      {isExportingPdf && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-xs select-none">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 p-6 rounded-xl shadow-2xl flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold">PDFファイルを直接生成中...</p>
            <p className="text-xs text-slate-400">ダイアログなしでそのままブラウザにダウンロードされます</p>
          </div>
        </div>
      )}
    </div>
  );
}

