import React from 'react';
import { EditorSettings } from '../../types';

interface GeneralTabProps {
  settings: EditorSettings;
  onUpdateSettings: (newSettings: Partial<EditorSettings>) => void;
  isDark?: boolean;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({
  settings,
  onUpdateSettings,
  isDark = true,
}) => {
  return (
    <div className="space-y-3.5">
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

      {/* フォントファミリー */}
      <div className="flex items-center justify-between">
        <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>エディタフォント</span>
        <select
          value={settings.fontFamily || 'monospace'}
          onChange={(e) => onUpdateSettings({ fontFamily: e.target.value as any })}
          className={`border rounded px-2 py-1 outline-none text-xs ${
            isDark
              ? 'bg-slate-950 border-slate-700 text-slate-200 focus:border-cyan-500'
              : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-cyan-600 font-medium'
          }`}
        >
          <option value="monospace">等幅 (Monospace / JetBrains Mono)</option>
          <option value="sans-serif">ゴシック (Sans-serif / Inter / メイリオ)</option>
          <option value="serif">明朝 (Serif / Noto Serif)</option>
        </select>
      </div>

      {/* 行間 (Line Height) */}
      <div className="flex items-center justify-between">
        <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>行間 (Line Height)</span>
        <select
          value={settings.lineHeight || 1.625}
          onChange={(e) => onUpdateSettings({ lineHeight: parseFloat(e.target.value) })}
          className={`border rounded px-2 py-1 outline-none text-xs ${
            isDark
              ? 'bg-slate-950 border-slate-700 text-slate-200 focus:border-cyan-500'
              : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-cyan-600 font-medium'
          }`}
        >
          <option value="1.4">1.4 (コンパクト)</option>
          <option value="1.625">1.625 (標準)</option>
          <option value="1.8">1.8 (ゆったり)</option>
          <option value="2.0">2.0 (広め)</option>
        </select>
      </div>

      {/* タブ幅 */}
      <div className="flex items-center justify-between">
        <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>タブ幅 (Tab Size)</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onUpdateSettings({ tabSize: 2 })}
            className={`px-2.5 py-0.5 rounded border text-xs font-mono font-bold transition-colors cursor-pointer ${
              (settings.tabSize || 2) === 2
                ? isDark
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-cyan-600 text-white border-cyan-600'
                : isDark
                  ? 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            2
          </button>
          <button
            type="button"
            onClick={() => onUpdateSettings({ tabSize: 4 })}
            className={`px-2.5 py-0.5 rounded border text-xs font-mono font-bold transition-colors cursor-pointer ${
              (settings.tabSize || 2) === 4
                ? isDark
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-cyan-600 text-white border-cyan-600'
                : isDark
                  ? 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            4
          </button>
        </div>
      </div>

      {/* 自動折り返し */}
      <div className="flex items-center justify-between">
        <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>右端での自動折り返し</span>
        <input
          type="checkbox"
          checked={settings.wordWrap}
          onChange={(e) => onUpdateSettings({ wordWrap: e.target.checked })}
          className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
        />
      </div>

      {/* 行番号表示 */}
      <div className="flex items-center justify-between">
        <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>行番号を表示</span>
        <input
          type="checkbox"
          checked={settings.lineNumbers}
          onChange={(e) => onUpdateSettings({ lineNumbers: e.target.checked })}
          className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
        />
      </div>

      {/* スクロール同期 */}
      <div className="flex items-center justify-between">
        <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>スクロール連動同期</span>
        <input
          type="checkbox"
          checked={settings.syncScroll}
          onChange={(e) => onUpdateSettings({ syncScroll: e.target.checked })}
          className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
        />
      </div>

      {/* タイプライタースクロール */}
      <div className="flex items-center justify-between">
        <div>
          <div className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>タイプライタースクロール</div>
          <div className="text-[10px] text-slate-400 font-sans">入力カーソル行を画面中央付近に自動維持</div>
        </div>
        <input
          type="checkbox"
          checked={settings.typewriterScroll === true}
          onChange={(e) => onUpdateSettings({ typewriterScroll: e.target.checked })}
          className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
        />
      </div>

      {/* スマートペースト */}
      <div className="flex items-center justify-between">
        <div>
          <div className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>スマートペースト (URL自動リンク化)</div>
          <div className="text-[10px] text-slate-400 font-sans">テキスト選択中にURL貼り付け時、[選択テキスト](URL) に自動変換</div>
        </div>
        <input
          type="checkbox"
          checked={settings.smartPaste !== false}
          onChange={(e) => onUpdateSettings({ smartPaste: e.target.checked })}
          className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
        />
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

      {/* コードブロック配色テーマ */}
      <div className="flex items-center justify-between">
        <div>
          <div className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>コードブロック配色テーマ</div>
          <div className="text-[10px] text-slate-400 font-sans">シンタックスハイライトのカラーテーマ</div>
        </div>
        <select
          value={settings.codeBlockTheme || 'vscDarkPlus'}
          onChange={(e) => onUpdateSettings({ codeBlockTheme: e.target.value as any })}
          className={`border rounded px-2 py-1 outline-none text-xs ${
            isDark
              ? 'bg-slate-950 border-slate-700 text-slate-200 focus:border-cyan-500'
              : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-cyan-600 font-medium'
          }`}
        >
          <option value="vscDarkPlus">💻 VS Code Dark+ (標準)</option>
          <option value="dracula">🧛 Dracula (紫アクセント)</option>
          <option value="nord">❄️ Nord (北欧アイスブルー)</option>
          <option value="okaidia">🎨 Monokai / Okaidia (高コントラスト)</option>
          <option value="oneDark">🪐 One Dark (Atom風)</option>
          <option value="prism">☀️ Prism / Cool (シンプル)</option>
        </select>
      </div>

      {/* 既定の作成者名 */}
      <div className="flex items-center justify-between">
        <div>
          <div className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>既定の作成者名 (author)</div>
          <div className="text-[10px] text-slate-400 font-sans">Front Matter 出力時のデフォルト名</div>
        </div>
        <input
          type="text"
          value={settings.defaultAuthor || ''}
          onChange={(e) => onUpdateSettings({ defaultAuthor: e.target.value })}
          placeholder="未設定"
          className={`border rounded px-2 py-1 outline-none text-xs w-32 ${
            isDark
              ? 'bg-slate-950 border-slate-700 text-slate-200 focus:border-cyan-500'
              : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-cyan-600 font-medium'
          }`}
        />
      </div>

      {/* Markdown プレビュー描画エンジン */}
      <div className="flex items-center justify-between">
        <div>
          <div className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>プレビュー描画エンジン</div>
          <div className="text-[10px] text-slate-400 font-sans">Rust ネイティブまたは React 描画エンジン</div>
        </div>
        <select
          value={settings.previewEngine || 'rust'}
          onChange={(e) => onUpdateSettings({ previewEngine: e.target.value as any })}
          className={`border rounded px-2 py-1 outline-none text-xs ${
            isDark
              ? 'bg-slate-950 border-slate-700 text-slate-200 focus:border-cyan-500'
              : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-cyan-600 font-medium'
          }`}
        >
          <option value="rust">🦀 Rust ネイティブ (pulldown-cmark / 爆速)</option>
          <option value="react">⚛️ React (react-markdown / 互換性重視)</option>
        </select>
      </div>

      {/* カラーテーマ */}
      <div className="flex items-center justify-between">
        <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>カラーテーマ</span>
        <select
          value={settings.theme}
          onChange={(e) => onUpdateSettings({ theme: e.target.value as any })}
          className={`border rounded px-2 py-1 outline-none text-xs ${
            isDark
              ? 'bg-slate-950 border-slate-700 text-slate-200 focus:border-cyan-500'
              : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-cyan-600 font-medium'
          }`}
        >
          <option value="dark">🌙 ダーク (Dark)</option>
          <option value="light">☀️ ライト (Light)</option>
          <option value="system">💻 システムに合わせる</option>
        </select>
      </div>
    </div>
  );
};
