import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

interface ShortcutCategory {
  category: string;
  items: {
    keys: string[];
    description: string;
  }[];
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose, isDark = true }) => {
  if (!isOpen) return null;

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcutCategories: ShortcutCategory[] = [
    {
      category: 'ファイル & ドキュメント操作',
      items: [
        { keys: [modKey, 'N'], description: '新規ドキュメント作成' },
        { keys: [modKey, 'W'], description: 'アクティブなタブを閉じる' },
        { keys: [modKey, 'O'], description: 'ローカルファイルを開く (.md / .txt)' },
        { keys: [modKey, 'S'], description: '元ファイルへ直上書き保存' },
        { keys: [modKey, 'Shift', 'S'], description: '名前を付けて保存 (ローカルファイル保存)' },
        { keys: [modKey, 'P'], description: 'ドキュメント印刷 / PDF保存' },
      ],
    },
    {
      category: 'テキスト装飾・フォーマット',
      items: [
        { keys: [modKey, 'B'], description: '太字 (ボールド) 変換' },
        { keys: [modKey, 'I'], description: '斜体 (イタリック) 変換' },
        { keys: [modKey, 'U'], description: '下線 (アンダーライン) 変換' },
        { keys: [modKey, 'K'], description: 'ハイパーリンクの挿入' },
        { keys: ['Tab'], description: 'スペース2文字インデント' },
        { keys: ['Enter'], description: 'リスト・タスクの自動継続' },
      ],
    },
    {
      category: '表示 & ヘルプ',
      items: [
        { keys: [modKey, 'E'], description: '編集のみ ↔ プレビューのみ表示切り替え' },
        { keys: [modKey, 'Shift', 'Z'], description: 'Zen集中執筆モードの切り替え' },
        { keys: [modKey, 'Shift', 'D'], description: 'リアルタイムタブ差分比較 (Diff)' },
        { keys: [modKey, 'Shift', 'L'], description: 'システム動作ログ一覧の表示 (最大100件)' },
        { keys: [modKey, 'B (サイドバー)'], description: 'サイドバーの開閉' },
        { keys: ['F1'], description: 'キーボードショートカット一覧の表示' },
        { keys: ['Esc'], description: 'Zenモード解除 / モーダル閉じる' },
      ],
    },
  ];

  return (
    <div className={`fixed inset-0 z-50 backdrop-blur-xs flex items-center justify-center p-4 select-none transition-colors ${
      isDark ? 'bg-black/60' : 'bg-slate-900/30'
    }`}>
      <div
        className={`rounded-xl border shadow-2xl w-full max-w-lg overflow-hidden transition-colors ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* モーダルヘッダー */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between ${
            isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`font-semibold text-sm leading-none ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                キーボードショートカット一覧
              </h2>
              <span className={`text-[11px] font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-700 font-semibold'}`}>
                Keyboard Shortcuts
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* モーダルコンテンツ */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto text-xs">
          {shortcutCategories.map((cat, idx) => (
            <div key={idx} className="space-y-2">
              <h3
                className={`font-semibold flex items-center gap-1.5 text-[11px] uppercase tracking-wider ${
                  isDark ? 'text-cyan-400' : 'text-cyan-700'
                }`}
              >
                <Command className="w-3.5 h-3.5" />
                {cat.category}
              </h3>
              <div className="space-y-1.5">
                {cat.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className={`p-2.5 rounded-lg border flex items-center justify-between ${
                      isDark ? 'bg-slate-950/60 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800 font-medium'
                    }`}
                  >
                    <span className="text-xs">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, kIdx) => (
                        <React.Fragment key={kIdx}>
                          <kbd
                            className={`px-2 py-1 rounded text-[11px] font-mono shadow-xs border ${
                              isDark
                                ? 'bg-slate-800 border-slate-700 text-cyan-300'
                                : 'bg-white border-slate-300 text-cyan-800 font-bold'
                            }`}
                          >
                            {key}
                          </kbd>
                          {kIdx < item.keys.length - 1 && (
                            <span className={isDark ? 'text-slate-500 text-[10px]' : 'text-slate-400 text-[10px]'}>+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* モーダルフッター */}
        <div
          className={`px-5 py-3 border-t flex items-center justify-between ${
            isDark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}
        >
          <span className="text-[11px]">
            ヒント:{' '}
            <kbd
              className={`px-1.5 py-0.5 rounded border font-mono ${
                isDark ? 'bg-slate-800 text-cyan-300 border-slate-700' : 'bg-white text-cyan-800 border-slate-300 font-bold'
              }`}
            >
              F1
            </kbd>{' '}
            キーでいつでも開くことができます
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
