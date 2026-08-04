import React from 'react';
import { X, Settings as SettingsIcon, RotateCcw } from 'lucide-react';
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
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 backdrop-blur-xs flex items-center justify-center p-4 select-none transition-colors ${
      isDark ? 'bg-black/60' : 'bg-slate-900/30'
    }`}>
      <div
        className={`w-full max-w-md p-5 rounded-xl border shadow-2xl transition-colors ${
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
            <span>エディタ設定</span>
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

          {/* ローカルストレージデータのリセット */}
          <div className={`pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <button
              onClick={() => {
                if (confirm('ローカルストレージのデータを初期状態にリセットしますか？')) {
                  onResetData();
                  onClose();
                }
              }}
              className={`w-full py-2 px-3 rounded border text-xs transition-colors flex items-center justify-center gap-2 ${
                isDark
                  ? 'bg-rose-950/60 hover:bg-rose-900/80 border-rose-800/80 text-rose-300'
                  : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-800 font-medium'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              データを初期サンプルにリセット
            </button>
          </div>
        </div>

        <div className={`flex items-center justify-end pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
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
