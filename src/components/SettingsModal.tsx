import React, { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon, Sliders, Sparkles, HardDrive } from 'lucide-react';
import { appDataDir, appLocalDataDir } from '@tauri-apps/api/path';
import { save } from '@tauri-apps/plugin-dialog';
import { EditorSettings } from '../types';
import { exportNotesToZipNative } from '../utils/tauriNative';
import { GeneralTab } from './settings/GeneralTab';
import { AiTab } from './settings/AiTab';
import { StorageTab } from './settings/StorageTab';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EditorSettings;
  onUpdateSettings: (newSettings: Partial<EditorSettings>) => void;
  onResetData: () => void;
  isDark?: boolean;
}

type SettingsTab = 'general' | 'ai' | 'storage';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetData,
  isDark = true,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [appDataPath, setAppDataPath] = useState<string>('読み込み中...');
  const [storageKb, setStorageKb] = useState<number>(0);
  const [docCount, setDocCount] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    // LocalStorage 容量およびドキュメント数の計測
    try {
      let totalBytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || '';
          totalBytes += (key.length + val.length) * 2;
        }
      }
      setStorageKb(parseFloat((totalBytes / 1024).toFixed(1)));

      const docsRaw = localStorage.getItem('markdown_editor_docs_v1');
      if (docsRaw) {
        const parsed = JSON.parse(docsRaw);
        if (Array.isArray(parsed)) {
          setDocCount(parsed.length);
        }
      }
    } catch (e) {
      console.warn('Storage calculation error:', e);
    }

    // Tauri AppData パスの取得
    const fetchPath = async () => {
      try {
        const dir = await appDataDir().catch(() => appLocalDataDir());
        setAppDataPath(dir);
      } catch {
        setAppDataPath('ブラウザ内 LocalStorage 領域 (Web Mode)');
      }
    };
    fetchPath();
  }, [isOpen]);

  const handleCopyPath = () => {
    if (!appDataPath) return;
    navigator.clipboard.writeText(appDataPath);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // 一時キャッシュクリア（LocalStorage の軽量クリーンアップ）
  const handleCleanCache = () => {
    try {
      const docsRaw = localStorage.getItem('markdown_editor_docs_v1');
      if (docsRaw) {
        const parsed = JSON.parse(docsRaw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((d: any) => d.filePath || d.isFavorite);
          localStorage.setItem('markdown_editor_docs_v1', JSON.stringify(cleaned));
          alert(`キャッシュと未保存一時データをクリアしました。\n(実ファイルパスを持つ ${cleaned.length} 件のドキュメントを保持中)`);
          onResetData();
          return;
        }
      }
      localStorage.clear();
      onResetData();
    } catch (e) {
      console.error('Cache cleanup error:', e);
    }
  };

  // 全ノート一括 ZIP エクスポート (Rust Deflate 高速圧縮)
  const handleExportAllZip = async () => {
    try {
      const docsRaw = localStorage.getItem('markdown_editor_docs_v1');
      if (!docsRaw) {
        alert('エクスポート対象のドキュメントが存在しません。');
        return;
      }
      const docs = JSON.parse(docsRaw);
      if (!Array.isArray(docs) || docs.length === 0) {
        alert('エクスポート対象のドキュメントが存在しません。');
        return;
      }

      const defaultName = `QuMaEditor_Backup_${new Date().toISOString().slice(0, 10)}.zip`;
      const savePath = await save({
        filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
        defaultPath: defaultName,
      });

      if (!savePath) return;

      const entries = docs.map((doc: any, index: number) => {
        const safeTitle = (doc.title || `doc_${index + 1}`).replace(/[\\/:*?"<>|]/g, '_');
        return {
          file_path_in_zip: `${safeTitle}.md`,
          content_text: doc.content || '',
          content_bytes: null,
        };
      });

      const bytes = await exportNotesToZipNative(savePath, entries);
      if (bytes !== null) {
        alert(`全 ${entries.length} 件のノートを ZIP アーカイブへ一括エクスポートしました！\n出力先: ${savePath}\nサイズ: ${(bytes / 1024).toFixed(1)} KB`);
      } else {
        alert('ZIP エクスポートに失敗しました。');
      }
    } catch (err) {
      console.error('ZIP エクスポートエラー:', err);
      alert(`ZIP エクスポート中にエラーが発生しました: ${err}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 backdrop-blur-xs flex items-center justify-center p-4 select-none transition-colors ${
        isDark ? 'bg-black/60' : 'bg-slate-900/30'
      }`}
    >
      <div
        className={`w-full max-w-xl p-5 rounded-xl border shadow-2xl transition-colors max-h-[92vh] flex flex-col ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* ヘッダー */}
        <div
          className={`flex items-center justify-between pb-3 border-b shrink-0 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold text-sm text-cyan-500">
            <SettingsIcon className="w-4 h-4" />
            <span>環境設定</span>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* タブバー */}
        <div
          className={`flex items-center gap-1 pt-3 pb-2 border-b shrink-0 text-xs font-medium ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'general'
                ? isDark
                  ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/60'
                  : 'bg-cyan-50 text-cyan-700 border border-cyan-300'
                : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>基本・外観</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'ai'
                ? isDark
                  ? 'bg-purple-950/60 text-purple-300 border border-purple-800/60'
                  : 'bg-purple-50 text-purple-700 border border-purple-300'
                : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI 要約 (Gemini)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('storage')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'storage'
                ? isDark
                  ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/60'
                  : 'bg-cyan-50 text-cyan-700 border border-cyan-300'
                : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>ストレージ & 管理</span>
          </button>
        </div>

        {/* タブコンテンツ */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 text-xs pr-1">
          {activeTab === 'general' && (
            <GeneralTab
              settings={settings}
              onUpdateSettings={onUpdateSettings}
              isDark={isDark}
            />
          )}

          {activeTab === 'ai' && (
            <AiTab
              settings={settings}
              onUpdateSettings={onUpdateSettings}
              isDark={isDark}
            />
          )}

          {activeTab === 'storage' && (
            <StorageTab
              storageKb={storageKb}
              docCount={docCount}
              appDataPath={appDataPath}
              isCopied={isCopied}
              onCopyPath={handleCopyPath}
              onExportAllZip={handleExportAllZip}
              onCleanCache={handleCleanCache}
              onResetData={onResetData}
              onClose={onClose}
              isDark={isDark}
            />
          )}
        </div>

        {/* フッター */}
        <div
          className={`pt-3 border-t flex justify-end shrink-0 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
