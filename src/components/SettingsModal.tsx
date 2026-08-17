import React, { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon, RotateCcw, HardDrive, Trash2, Copy, Check, Folder, Send } from 'lucide-react';
import { appDataDir, appLocalDataDir } from '@tauri-apps/api/path';
import { checkSendToMenuNative, registerSendToMenuNative } from '../utils/tauriNative';
import { EditorSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EditorSettings;
  onUpdateSettings: (newSettings: Partial<EditorSettings>) => void;
  onResetData: () => void;
  isDark?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetData,
  isDark = true,
}) => {
  const [appDataPath, setAppDataPath] = useState<string>('読み込み中...');
  const [storageKb, setStorageKb] = useState<number>(0);
  const [docCount, setDocCount] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSendToRegistered, setIsSendToRegistered] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    // SendTo 登録状態のチェック
    checkSendToMenuNative().then((res) => setIsSendToRegistered(res));

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
      } catch (e) {
        setAppDataPath('ブラウザ内 LocalStorage 領域 (Web Mode)');
      }
    };
    fetchPath();
  }, [isOpen]);

  const handleToggleSendTo = async (enable: boolean) => {
    const success = await registerSendToMenuNative(enable);
    if (success || !enable) {
      setIsSendToRegistered(enable);
    }
  };

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
          // 実ファイルパス付きまたはお気に入りを保護
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

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 backdrop-blur-xs flex items-center justify-center p-4 select-none transition-colors ${
      isDark ? 'bg-black/60' : 'bg-slate-900/30'
    }`}>
      <div
        className={`w-full max-w-md p-5 rounded-xl border shadow-2xl transition-colors max-h-[90vh] overflow-y-auto ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div
          className={`flex items-center justify-between pb-3 border-b ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold text-sm text-cyan-500">
            <SettingsIcon className="w-4 h-4" />
            <span>エディタ & ストレージ設定</span>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded transition-colors ${
              isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs">
          {/* フォントサイズ */}
          <div className="flex items-center justify-between">
            <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>基本フォントサイズ</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={12}
                max={24}
                value={settings.fontSize}
                onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value) })}
                className="w-28 accent-cyan-500 cursor-pointer"
              />
              <span className="w-8 font-mono text-cyan-500 text-right font-semibold">{settings.fontSize}px</span>
            </div>
          </div>

          {/* 既定の作成者名 */}
          <div className="flex items-center justify-between">
            <div>
              <div className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>既定の作成者名 (Author)</div>
              <div className="text-[10px] text-slate-400 font-sans">Front Matter 出力時のデフォルト名</div>
            </div>
            <input
              type="text"
              value={settings.defaultAuthor || ''}
              placeholder="例: 山田 太郎"
              onChange={(e) => onUpdateSettings({ defaultAuthor: e.target.value })}
              className={`w-36 px-2.5 py-1 rounded border text-xs outline-none transition-colors ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
              }`}
            />
          </div>

          {/* 行番号 */}
          <div className="flex items-center justify-between">
            <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>行番号の表示</span>
            <input
              type="checkbox"
              checked={settings.lineNumbers}
              onChange={(e) => onUpdateSettings({ lineNumbers: e.target.checked })}
              className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* 自動折り返し */}
          <div className="flex items-center justify-between">
            <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>右端で自動折り返し</span>
            <input
              type="checkbox"
              checked={settings.wordWrap}
              onChange={(e) => onUpdateSettings({ wordWrap: e.target.checked })}
              className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* 連動スクロール */}
          <div className="flex items-center justify-between">
            <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>分割スクロール同期</span>
            <input
              type="checkbox"
              checked={settings.syncScroll}
              onChange={(e) => onUpdateSettings({ syncScroll: e.target.checked })}
              className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* 表示テーマ */}
          <div className="flex items-center justify-between">
            <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>表示テーマ</span>
            <select
              value={settings.theme}
              onChange={(e) => onUpdateSettings({ theme: e.target.value as any })}
              className={`border rounded px-2 py-1 outline-none text-xs ${
                isDark
                  ? 'bg-slate-950 border-slate-700 text-slate-200 focus:border-cyan-500'
                  : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-cyan-600 font-medium'
              }`}
            >
              <option value="dark">🌙 ダークモード</option>
              <option value="light">☀️ ライトモード</option>
              <option value="system">💻 システムに合わせる</option>
            </select>
          </div>

          {/* 見出しカラーテーマ */}
          <div className="flex items-center justify-between">
            <div>
              <div className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>見出しカラーテーマ</div>
              <div className="text-[10px] text-slate-400 font-sans">プレビューの見出し (H1〜H6) 配色</div>
            </div>
            <select
              value={settings.headingTheme || 'muted'}
              onChange={(e) => onUpdateSettings({ headingTheme: e.target.value as any })}
              className={`border rounded px-2 py-1 outline-none text-xs ${
                isDark
                  ? 'bg-slate-950 border-slate-700 text-slate-200 focus:border-cyan-500'
                  : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-cyan-600 font-medium'
              }`}
            >
              <option value="muted">💎 落ち着いた色 (標準)</option>
              <option value="vivid">🌟 少し派手な色 (鮮やか)</option>
              <option value="high_contrast">⚡ ハイコントラスト (高視認性)</option>
              <option value="monochrome">⚪ モノトーン (シンプル)</option>
            </select>
          </div>

          {/* 自動保存の待機時間 */}
          <div className="flex items-center justify-between">
            <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>自動保存の待機時間</span>
            <select
              value={Math.max(1000, Math.min(10000, settings.autoSaveIntervalMs || 3000))}
              onChange={(e) => onUpdateSettings({ autoSaveIntervalMs: parseInt(e.target.value) })}
              className={`border rounded px-2 py-1 outline-none text-xs ${
                isDark
                  ? 'bg-slate-950 border-slate-700 text-slate-200 focus:border-cyan-500'
                  : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-cyan-600 font-medium'
              }`}
            >
              <option value={1000}>1.0秒 (最小)</option>
              <option value={2000}>2.0秒</option>
              <option value={3000}>3.0秒 (標準)</option>
              <option value={5000}>5.0秒</option>
              <option value={10000}>10.0秒 (最大)</option>
            </select>
          </div>

          {/* Windows エクスプローラーの「送る (SendTo)」連携 */}
          <div className="flex items-center justify-between">
            <span className={`font-medium flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <Send className="w-3.5 h-3.5 text-cyan-400" />
              Windows「送る (SendTo)」メニューに登録
            </span>
            <input
              type="checkbox"
              checked={isSendToRegistered}
              onChange={(e) => handleToggleSendTo(e.target.checked)}
              className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
              title="エクスプローラーの『送る』メニューに QuMaEditor を追加/解除"
            />
          </div>

          {/* 内部ストレージ (LocalStorage / AppData) 情報セクション */}
          <div className={`pt-3 border-t space-y-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                <HardDrive className="w-3.5 h-3.5" />
                内部データ領域 (LocalStorage / Cache)
              </span>
              <span className={`font-mono text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                {storageKb} KB / 約 5,000 KB ({docCount} 件)
              </span>
            </div>

            {/* パス表示とコピー */}
            <div className={`p-2.5 rounded border text-[11px] font-mono space-y-1 ${
              isDark ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center justify-between opacity-75">
                <span className="flex items-center gap-1">
                  <Folder className="w-3 h-3 text-amber-500" />
                  AppData 格納ディレクトリパス:
                </span>
                <button
                  onClick={handleCopyPath}
                  className={`p-1 rounded hover:bg-slate-800 transition-colors flex items-center gap-1 ${
                    isCopied ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="パスをコピー"
                >
                  {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopied ? 'コピー完了' : 'コピー'}</span>
                </button>
              </div>
              <div className="break-all select-all font-mono text-[10px] text-cyan-400/90 leading-tight">
                {appDataPath}
              </div>
            </div>

            {/* キャッシュクリアボタン */}
            <div className="pt-1">
              <button
                onClick={() => {
                  if (confirm('肥大化した一時キャッシュ・未保存データを削除してメモリをクリアしますか？\n(実ファイルパス付きのドキュメントは保持されます)')) {
                    handleCleanCache();
                  }
                }}
                className={`py-1.5 px-2 rounded border text-[11px] transition-colors flex items-center justify-center gap-1.5 ${
                  isDark
                    ? 'bg-amber-950/40 hover:bg-amber-900/60 border-amber-800/60 text-amber-300'
                    : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800 font-medium'
                }`}
                title="一時データをクリアして内部領域を軽量再作成"
              >
                <Trash2 className="w-3 h-3" />
                一時キャッシュを整理
              </button>
            </div>

            {/* キャッシュ整理の機能説明 */}
            <div className={`text-[10px] leading-relaxed p-2 rounded border ${
              isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              💡 <strong>「一時キャッシュを整理」の動作説明</strong><br />
              PC 上の実ファイルに保存済みのドキュメントについて、LocalStorage 内の重複テキストデータを安全にクリアして空き容量を確保します。<br />
              <span className="text-emerald-500 font-semibold">※ PC 上の実際の `.md` ファイルは一切削除されず安全に保持されます。</span>
            </div>
          </div>
        </div>

        <div className={`flex items-center justify-between pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            onClick={() => {
              if (confirm('ローカルストレージのすべてのデータを完全初期化しサンプル状態にリセットしますか？')) {
                onResetData();
                onClose();
              }
            }}
            className={`py-1.5 px-3 rounded border text-[11px] transition-colors flex items-center gap-1.5 ${
              isDark
                ? 'bg-rose-950/40 hover:bg-rose-900/60 border-rose-800/60 text-rose-300'
                : 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-800 font-medium'
            }`}
            title="すべてのドキュメントデータを初期化"
          >
            <RotateCcw className="w-3 h-3" />
            設定・データを完全初期化
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-md transition-colors"
          >
            完了
          </button>
        </div>
      </div>
    </div>
  );
};

