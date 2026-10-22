import React from 'react';
import { HardDrive, Folder, Archive, Trash2, RotateCcw, Copy, Check } from 'lucide-react';

interface StorageTabProps {
  storageKb: number;
  docCount: number;
  appDataPath: string;
  isCopied: boolean;
  onCopyPath: () => void;
  onExportAllZip: () => void;
  onCleanCache: () => void;
  onResetData: () => void;
  onClose: () => void;
  isDark?: boolean;
}

export const StorageTab: React.FC<StorageTabProps> = ({
  storageKb,
  docCount,
  appDataPath,
  isCopied,
  onCopyPath,
  onExportAllZip,
  onCleanCache,
  onResetData,
  onClose,
  isDark = true,
}) => {
  return (
    <div className="space-y-4">
      {/* 容量情報 */}
      <div
        className={`p-3.5 rounded-xl border space-y-2.5 ${
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
            <HardDrive className="w-3.5 h-3.5" />
            内部データ領域 (LocalStorage / Cache)
          </span>
          <span className={`font-mono text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
            {storageKb} KB / 約 5,000 KB ({docCount} 件)
          </span>
        </div>

        {/* AppData パス表示とコピー */}
        <div
          className={`p-2.5 rounded border text-[11px] font-mono space-y-1 ${
            isDark ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between opacity-75">
            <span className="flex items-center gap-1">
              <Folder className="w-3 h-3 text-amber-500" />
              AppData 格納ディレクトリパス:
            </span>
            <button
              onClick={onCopyPath}
              className={`p-1 rounded hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer ${
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

        {/* アクションボタン (ZIP一括エクスポート & キャッシュ整理) */}
        <div className="pt-1 flex items-center gap-2">
          <button
            onClick={onExportAllZip}
            className={`flex-1 py-1.5 px-2 rounded border text-[11px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              isDark
                ? 'bg-cyan-950/40 hover:bg-cyan-900/60 border-cyan-800/60 text-cyan-300'
                : 'bg-cyan-50 hover:bg-cyan-100 border-cyan-300 text-cyan-800 font-medium'
            }`}
            title="全ドキュメントを単一の ZIP ファイルとしてまとめてバックアップ"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>全ノート一括 ZIP 出力</span>
          </button>

          <button
            onClick={onCleanCache}
            className={`py-1.5 px-3 rounded border text-[11px] transition-colors flex items-center gap-1 cursor-pointer ${
              isDark
                ? 'bg-rose-950/30 hover:bg-rose-900/50 border-rose-800/50 text-rose-300'
                : 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-800'
            }`}
            title="保存済み実ファイル以外の古い一時データを消去"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>キャッシュ整理</span>
          </button>
        </div>
      </div>

      {/* 完全リセット */}
      <div
        className={`p-3.5 rounded-xl border space-y-2 ${
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
            <RotateCcw className="w-3.5 h-3.5" />
            データ完全初期化
          </span>
          <button
            onClick={() => {
              if (window.confirm('本当にすべてのエディタデータと設定を初期状態にリセットしますか？この操作は取り消せません。')) {
                localStorage.clear();
                onResetData();
                onClose();
              }
            }}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-medium transition-colors cursor-pointer"
          >
            全リセット実行
          </button>
        </div>
        <p className="text-[10px] text-slate-400">
          ※ ブラウザ/アプリに保存されているすべてのメモおよび設定を破棄し、初期状態に戻します。
        </p>
      </div>
    </div>
  );
};
