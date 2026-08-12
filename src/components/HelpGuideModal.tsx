import React from 'react';
import { X, BookOpen, Edit3, ZoomIn, FolderOpen, Tag, Database, HardDrive, Lock, RefreshCw, FileText, Sparkles } from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ isOpen, onClose, isDark = true }) => {
  if (!isOpen) return null;

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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-cyan-600 flex items-center justify-center text-white shadow-md">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`font-semibold text-sm leading-none ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                簡単使い方ガイド (Quick Guide)
              </h2>
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                QuMaEditor の基本的な操作と保存の仕組み
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
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* アプリの概要・特徴 */}
          <div className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border-cyan-500/30' : 'bg-gradient-to-r from-cyan-50 via-white to-amber-50 border-cyan-200 shadow-xs'
          }`}>
            <div className={`font-bold text-xs flex items-center gap-1.5 mb-1.5 ${
              isDark ? 'text-cyan-300' : 'text-cyan-800'
            }`}>
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              QuMaEditor（キュマエディタ）とは？
            </div>
            <p className={`text-[11px] leading-relaxed mb-2.5 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              このアプリは<strong>リアルタイムにプレビューを見ながら快適に執筆・編集できるMarkdownエディタ</strong>です。
            </p>
            <div className={`grid grid-cols-2 gap-1.5 text-[10px] ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <div className="flex items-center gap-1">
                <span className="text-cyan-400 font-bold">✓</span> リアルタイム分割＆同期スクロール
              </div>
              <div className="flex items-center gap-1">
                <span className="text-emerald-400 font-bold">✓</span> 自動保護保存 (LocalStorage)
              </div>
              <div className="flex items-center gap-1">
                <span className="text-amber-400 font-bold">✓</span> Zen集中執筆モード対応
              </div>
              <div className="flex items-center gap-1">
                <span className="text-purple-400 font-bold">✓</span> 超高速インデックス全文検索
              </div>
            </div>
          </div>

          {/* 基本操作ガイドステップ */}
          <div>
            <h3
              className={`font-semibold mb-2.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider ${
                isDark ? 'text-amber-400' : 'text-amber-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              基本操作ステップ
            </h3>
            <div className="space-y-2">
              <div
                className={`p-3 rounded-lg border ${
                  isDark ? 'bg-slate-800/50 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className={`font-medium flex items-center gap-1.5 mb-1 ${isDark ? 'text-slate-200' : 'text-slate-900 font-semibold'}`}>
                  <Edit3 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  1. テキスト入力と装飾フォーマット
                </div>
                <p className={`text-[11px] pl-5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  左側エディタで Markdown テキストを入力します。上部ツールバーのボタンで選択範囲を太字（<kbd className="px-1 py-0.2 rounded bg-slate-800 font-mono text-[10px] text-cyan-300">Ctrl+B</kbd>）や斜体に装飾したり、カーソル行の行頭に見出し（H1~H3）を挿入できます。
                </p>
              </div>

              <div
                className={`p-3 rounded-lg border ${
                  isDark ? 'bg-slate-800/50 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className={`font-medium flex items-center gap-1.5 mb-1 ${isDark ? 'text-slate-200' : 'text-slate-900 font-semibold'}`}>
                  <ZoomIn className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  2. プレビュー表示 ＆ ズーム拡大縮小
                </div>
                <p className={`text-[11px] pl-5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  右側プレビューで GFM（Markdown）描画結果を確認できます。プレビュー上で <kbd className="px-1 py-0.2 rounded bg-slate-800 font-mono text-[10px] text-emerald-300">Ctrl + ホイール</kbd> を操作すると文字サイズを 50%〜300% に拡大縮小できます。
                </p>
              </div>

              <div
                className={`p-3 rounded-lg border ${
                  isDark ? 'bg-slate-800/50 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className={`font-medium flex items-center gap-1.5 mb-1 ${isDark ? 'text-slate-200' : 'text-slate-900 font-semibold'}`}>
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  3. 保存とエクスプローラーでのフォルダオープン
                </div>
                <p className={`text-[11px] pl-5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  入力内容は 3 秒ごとに LocalStorage に自動保護保存されます。<kbd className="px-1 py-0.2 rounded bg-slate-800 font-mono text-[10px] text-amber-300">Ctrl + S</kbd> で PC 上の実ファイルへ上書き保存でき、保存後は最上部の <span className="text-emerald-400 font-medium font-mono">📁 フォルダを開く</span> ボタンから保存先フォルダを直接開けます。
                </p>
              </div>

              <div
                className={`p-3 rounded-lg border ${
                  isDark ? 'bg-slate-800/50 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className={`font-medium flex items-center gap-1.5 mb-1 ${isDark ? 'text-slate-200' : 'text-slate-900 font-semibold'}`}>
                  <Tag className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  4. タグ管理と超高速全文検索
                </div>
                <p className={`text-[11px] pl-5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  エディタ上部の YAML Front Matter ヘッダーからタグ（<span className="text-purple-300 font-mono">#ガイド</span> 等）を自在に追加可能。左サイドバーの検索欄からキーワードやタグ名で超高速絞り込み検索ができます。
                </p>
              </div>
            </div>
          </div>

          {/* LocalStorage 保護保存の仕組み解説 */}
          <div>
            <h3
              className={`font-semibold mb-2.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider ${
                isDark ? 'text-emerald-400' : 'text-emerald-700'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              LocalStorage 保護保存の仕組み
            </h3>

            {/* 「LocalStorageとは」 */}
            <div className={`p-3 rounded-lg border mb-2 ${
              isDark ? 'bg-slate-800/50 border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`font-medium flex items-center gap-1.5 mb-1.5 ${
                isDark ? 'text-slate-200' : 'text-slate-900 font-semibold'
              }`}>
                <HardDrive className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                LocalStorage とは？
              </div>
              <p className={`text-[11px] pl-5 leading-relaxed ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                本アプリ（QuMaEditor）が内部に保持する「安全な自動保存領域」です。
                PCを再起動してもデータが消えず、外部通信なしでローカルに完結した状態で保護されます。
                QuMaEditor はキー入力のたびに自動でここに書き込むため、<strong>突然の電源断やアプリ終了でもデータが安全</strong>です。
              </p>
            </div>

            {/* 「なぜ安全なのか」 */}
            <div className={`p-3 rounded-lg border mb-2 ${
              isDark ? 'bg-slate-800/50 border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`font-medium flex items-center gap-1.5 mb-1.5 ${
                isDark ? 'text-slate-200' : 'text-slate-900 font-semibold'
              }`}>
                <Lock className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                なぜ安全なのか？ — 「二重保護」の仕組み
              </div>
              <div className={`text-[11px] pl-5 leading-relaxed space-y-1.5 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                <div className="flex items-start gap-2">
                  <span className={`shrink-0 font-bold mt-0.5 ${
                    isDark ? 'text-cyan-400' : 'text-cyan-700'
                  }`}>①</span>
                  <span><strong className={isDark ? 'text-slate-300' : 'text-slate-800'}>自動保存 (LocalStorage)</strong>…キー入力後 3 秒以内にアプリ内部へ自動保存。未保存でも安全。</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className={`shrink-0 font-bold mt-0.5 ${
                    isDark ? 'text-emerald-400' : 'text-emerald-700'
                  }`}>②</span>
                  <span><strong className={isDark ? 'text-slate-300' : 'text-slate-800'}>手動保存 (PC実ファイル)</strong>…Ctrl+S で PC 上の実際の「.md」ファイルに上書き保存。他アプリでも開ける永続データ。</span>
                </div>
              </div>
            </div>

            {/* 「実ファイル保存との違い」 */}
            <div className={`p-3 rounded-lg border ${
              isDark ? 'bg-slate-800/50 border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`font-medium flex items-center gap-1.5 mb-2 ${
                isDark ? 'text-slate-200' : 'text-slate-900 font-semibold'
              }`}>
                <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                LocalStorage 保存 vs 実ファイル保存 比較
              </div>
              <div className={`overflow-x-auto text-[10px] ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className={isDark ? 'bg-slate-900/60' : 'bg-slate-100'}>
                      <th className={`text-left px-2 py-1 border ${
                        isDark ? 'border-slate-700' : 'border-slate-300'
                      }`}>項目</th>
                      <th className={`text-center px-2 py-1 border text-sky-400 ${
                        isDark ? 'border-slate-700 text-sky-400' : 'border-slate-300 text-sky-700'
                      }`}>
                        <FileText className="w-3 h-3 inline mr-1" />
                        LocalStorage保存
                      </th>
                      <th className={`text-center px-2 py-1 border ${
                        isDark ? 'border-slate-700 text-emerald-400' : 'border-slate-300 text-emerald-700'
                      }`}>
                        <HardDrive className="w-3 h-3 inline mr-1" />
                        実ファイル保存
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['保存タイミング', '自動 (3秒待機)', 'Ctrl+S 手動'],
                      ['クラッシュ安全性', '★★★ 最高', '★★ リスクあり'],
                      ['他アプリから開く', '✕ 不可', '○ 可能'],
                      ['データ容量', '~5MBまで', '無制限'],
                    ].map(([label, local, file], i) => (
                      <tr key={i} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-100/60'}>
                        <td className={`px-2 py-1 font-medium border ${
                          isDark ? 'border-slate-700' : 'border-slate-300'
                        }`}>{label}</td>
                        <td className={`px-2 py-1 text-center border ${
                          isDark ? 'border-slate-700 text-sky-300' : 'border-slate-300 text-sky-700'
                        }`}>{local}</td>
                        <td className={`px-2 py-1 text-center border ${
                          isDark ? 'border-slate-700 text-emerald-300' : 'border-slate-300 text-emerald-700'
                        }`}>{file}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* モーダルフッター */}
        <div
          className={`px-5 py-3 border-t flex justify-end ${
            isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
          }`}
        >
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
