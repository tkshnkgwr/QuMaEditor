import React, { useState, useEffect } from 'react';
import { X, GitCompare, ArrowLeftRight, FileText, Plus, Minus, Check, Zap } from 'lucide-react';
import { MarkdownDoc } from '../types';
import { computeDetailedDiffNative, DetailedDiffResult, DetailedDiffLine } from '../utils/tauriNative';

interface DiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDoc: MarkdownDoc;
  previousDoc?: MarkdownDoc;
  allDocs: MarkdownDoc[];
  openTabIds: string[];
  isDark?: boolean;
}

export const DiffModal: React.FC<DiffModalProps> = ({
  isOpen,
  onClose,
  activeDoc,
  previousDoc,
  allDocs,
  openTabIds,
  isDark = true,
}) => {
  const [compareDocId, setCompareDocId] = useState<string>(() => {
    if (previousDoc && previousDoc.id !== activeDoc.id) {
      return previousDoc.id;
    }
    const otherOpen = openTabIds.find((id) => id !== activeDoc.id);
    if (otherOpen) return otherOpen;
    const otherAny = allDocs.find((d) => d.id !== activeDoc.id);
    return otherAny ? otherAny.id : activeDoc.id;
  });

  const [detailedDiff, setDetailedDiff] = useState<DetailedDiffResult | null>(null);

  const compareDoc = allDocs.find((d) => d.id === compareDocId) || previousDoc || activeDoc;

  // Rust ネイティブ (similar クレート) での超高速 Detailed Text Diff
  useEffect(() => {
    let isMounted = true;
    if (isOpen && compareDoc && activeDoc && compareDoc.id !== activeDoc.id) {
      computeDetailedDiffNative(compareDoc.content, activeDoc.content).then((res) => {
        if (isMounted && res) {
          setDetailedDiff(res);
        }
      });
    } else if (compareDoc && activeDoc && compareDoc.id === activeDoc.id) {
      setDetailedDiff(null);
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, compareDocId, compareDoc?.content, activeDoc.content]);

  if (!isOpen) return null;

  const addedLines = detailedDiff?.added_lines ?? 0;
  const removedLines = detailedDiff?.removed_lines ?? 0;
  const diffLines: DetailedDiffLine[] = detailedDiff?.lines ?? [];

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none transition-colors ${
      isDark ? 'bg-black/60' : 'bg-slate-900/30'
    }`}>
      <div
        className={`w-full max-w-5xl h-[85vh] rounded-xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* モーダルヘッダー */}
        <div
          className={`p-4 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-wide flex items-center gap-2">
                ドキュメント差分比較 (Diff)
                <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                  <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                  Rust similar ネイティブ爆速計算
                </span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                リアルタイム（未保存の最新内容）で2つのタブ/ドキュメントの差分を確認できます
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-100' : 'hover:bg-slate-200 text-slate-600'
            }`}
            title="閉じる (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 比較セレクター & コントロールバー */}
        <div
          className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs ${
            isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-slate-100/80'
          }`}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border bg-rose-500/10 text-rose-500 border-rose-500/20 font-medium">
              <FileText className="w-3.5 h-3.5" />
              <span>比較元 (Old):</span>
              <select
                value={compareDocId}
                onChange={(e) => setCompareDocId(e.target.value)}
                className={`bg-transparent outline-none font-semibold cursor-pointer max-w-[180px] truncate ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                {allDocs.map((d) => (
                  <option
                    key={d.id}
                    value={d.id}
                    className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-800'}
                  >
                    {d.title || '無題'} {d.id === previousDoc?.id ? '(直前タブ)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <ArrowLeftRight className="w-4 h-4 text-cyan-500 shrink-0" />

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-medium">
              <FileText className="w-3.5 h-3.5" />
              <span>現在タブ (New):</span>
              <span className={`font-semibold max-w-[180px] truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {activeDoc.title || '無題'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
              <Plus className="w-3 h-3" /> +{addedLines} 行追加
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/20">
              <Minus className="w-3 h-3" /> -{removedLines} 行削除
            </span>
          </div>
        </div>

        {/* 差分コンテンツ表示エリア */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed">
          {compareDoc.id === activeDoc.id ? (
            <div className={`h-full flex flex-col items-center justify-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <Check className="w-8 h-8 text-cyan-500 mb-2" />
              <p className="text-sm font-medium">同じドキュメントが選択されています</p>
              <p className="text-xs mt-1">上の「比較元 (Old)」から比較したい別のタブを選択してください。</p>
            </div>
          ) : (
            <div className={`rounded-lg border overflow-hidden ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
              {diffLines.map((line, index) => {
                let bgColor = isDark ? 'hover:bg-slate-900/50' : 'hover:bg-slate-100';
                let textColor = isDark ? 'text-slate-300' : 'text-slate-700';
                let prefix = ' ';
                let prefixColor = isDark ? 'text-slate-600' : 'text-slate-400';

                if (line.tag === 'insert') {
                  bgColor = isDark ? 'bg-emerald-950/40 hover:bg-emerald-900/50' : 'bg-emerald-50 hover:bg-emerald-100/80';
                  textColor = isDark ? 'text-emerald-300' : 'text-emerald-800';
                  prefix = '+';
                  prefixColor = 'text-emerald-500 font-bold';
                } else if (line.tag === 'delete') {
                  bgColor = isDark ? 'bg-rose-950/40 hover:bg-rose-900/50' : 'bg-rose-50 hover:bg-rose-100/80';
                  textColor = isDark ? 'text-rose-300' : 'text-rose-800';
                  prefix = '-';
                  prefixColor = 'text-rose-500 font-bold';
                }

                return (
                  <div
                    key={index}
                    className={`flex items-start px-2 py-0.5 transition-colors whitespace-pre-wrap break-words border-b font-mono ${
                      isDark ? 'border-slate-800/30' : 'border-slate-200/50'
                    } ${bgColor} ${textColor}`}
                  >
                    {/* 行番号表示 (Old / New) */}
                    <span className={`w-9 shrink-0 select-none text-right pr-2 text-[11px] ${
                      isDark ? 'text-slate-600' : 'text-slate-400'
                    }`}>
                      {line.old_line_no ?? ''}
                    </span>
                    <span className={`w-9 shrink-0 select-none text-right pr-2 text-[11px] border-r ${
                      isDark ? 'text-slate-600 border-slate-800' : 'text-slate-400 border-slate-200'
                    }`}>
                      {line.new_line_no ?? ''}
                    </span>

                    {/* 差分プレフィックス (+ / - / space) */}
                    <span className={`w-6 shrink-0 select-none text-center ${prefixColor}`}>{prefix}</span>

                    {/* 行コンテンツまたはインライン差分 */}
                    <span className="flex-1">
                      {line.inline_changes && line.inline_changes.length > 0 ? (
                        line.inline_changes.map((ic, icIdx) => {
                          if (ic.tag === 'insert') {
                            return (
                              <mark
                                key={icIdx}
                                className="bg-emerald-500/30 text-emerald-200 px-0.5 rounded-xs"
                              >
                                {ic.text}
                              </mark>
                            );
                          } else if (ic.tag === 'delete') {
                            return (
                              <mark
                                key={icIdx}
                                className="bg-rose-500/30 text-rose-200 px-0.5 line-through rounded-xs"
                              >
                                {ic.text}
                              </mark>
                            );
                          }
                          return <span key={icIdx}>{ic.text}</span>;
                        })
                      ) : (
                        line.content || ' '
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* フッター */}
        <div
          className={`px-4 py-2.5 border-t flex items-center justify-end shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
