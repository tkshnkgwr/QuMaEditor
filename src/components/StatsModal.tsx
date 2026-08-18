import React, { useMemo } from 'react';
import {
  X,
  BarChart3,
  FileText,
  Clock,
  ListTodo,
  Heading,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { MarkdownDoc, TextStats } from '../types';

/**
 * ドキュメント詳細統計ダッシュボードモーダルの Props
 */
interface StatsModalProps {
  /** モーダル表示フラグ */
  isOpen: boolean;
  /** モーダル閉じるハンドラー */
  onClose: () => void;
  /** 対象 Markdown ドキュメント */
  doc: MarkdownDoc;
  /** 基本テキスト統計情報 */
  stats: TextStats;
  /** ダークモード適用フラグ */
  isDark?: boolean;
}

/**
 * ドキュメント詳細統計ダッシュボードモーダルコンポーネント
 * 文字数・単語数・行数・読了予想時間・タスク進捗率・見出し構造内訳・Markdown要素数を可視化します。
 */

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  doc,
  stats,
  isDark = true,
}) => {
  if (!isOpen) return null;

  const content = doc.content || '';

  // 詳細集計計算
  const detailedAnalysis = useMemo(() => {
    const lines = content.split('\n');
    let emptyLines = 0;
    let paragraphs = 0;
    let inParagraph = false;

    // 見出しカウント (H1〜H6)
    const headings = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
    let codeBlocks = 0;
    let inCodeBlock = false;
    let tables = 0;
    let inTable = false;

    // タスクカウント
    let tasksTotal = 0;
    let tasksCompleted = 0;
    let tasksInProgress = 0;
    let tasksUnchecked = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed === '') {
        emptyLines++;
        if (inParagraph) {
          paragraphs++;
          inParagraph = false;
        }
        if (inTable) {
          tables++;
          inTable = false;
        }
        continue;
      }

      // コードブロック
      if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
        if (!inCodeBlock) {
          codeBlocks++;
          inCodeBlock = true;
        } else {
          inCodeBlock = false;
        }
        continue;
      }

      if (inCodeBlock) continue;

      // テーブル
      if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
        if (!inTable) inTable = true;
      } else if (inTable) {
        tables++;
        inTable = false;
      }

      // 見出し
      if (trimmed.startsWith('#')) {
        const hMatch = trimmed.match(/^(#{1,6})\s/);
        if (hMatch) {
          const level = hMatch[1].length;
          if (level === 1) headings.h1++;
          else if (level === 2) headings.h2++;
          else if (level === 3) headings.h3++;
          else if (level === 4) headings.h4++;
          else if (level === 5) headings.h5++;
          else if (level === 6) headings.h6++;
          continue;
        }
      }

      // タスク項目
      if (/^\s*-\s*\[[ xX\/\-]\]/.test(line)) {
        tasksTotal++;
        if (/^\s*-\s*\[[xX]\]/.test(line)) {
          tasksCompleted++;
        } else if (/^\s*-\s*\[[\/\-]\]/.test(line)) {
          tasksInProgress++;
        } else {
          tasksUnchecked++;
        }
        continue;
      }

      inParagraph = true;
    }

    if (inParagraph) paragraphs++;
    if (inTable) tables++;

    // リンクと画像カウント
    const imageMatches = content.match(/!\[.*?\]\(.*?\)/g);
    const linkMatches = content.match(/(?<!!)\[.*?\]\(.*?\)/g);
    const images = imageMatches ? imageMatches.length : 0;
    const links = linkMatches ? linkMatches.length : 0;

    const totalHeadings =
      headings.h1 + headings.h2 + headings.h3 + headings.h4 + headings.h5 + headings.h6;

    // 読了時間（分）
    const readingTimeNormal = Math.max(1, Math.ceil(stats.charactersNoSpace / 400));
    const readingTimeSpeech = Math.max(1, Math.ceil(stats.charactersNoSpace / 300));

    // タスク進捗率
    const taskCompletionRate =
      tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

    return {
      emptyLines,
      paragraphs,
      headings,
      totalHeadings,
      codeBlocks,
      tables,
      tasksTotal,
      tasksCompleted,
      tasksInProgress,
      tasksUnchecked,
      taskCompletionRate,
      images,
      links,
      readingTimeNormal,
      readingTimeSpeech,
    };
  }, [content, stats.charactersNoSpace]);

  return (
    <div
      className={`fixed inset-0 z-50 backdrop-blur-xs flex items-center justify-center p-4 select-none transition-colors ${
        isDark ? 'bg-black/60' : 'bg-slate-900/30'
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl rounded-xl border shadow-2xl overflow-hidden transition-colors max-h-[90vh] flex flex-col ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* モーダルヘッダー */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`font-semibold text-sm leading-none ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                ドキュメント詳細統計ダッシュボード
              </h2>
              <span className={`text-[11px] font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-700 font-semibold'}`}>
                Document Statistics & Analytics
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

        {/* モーダルコンテンツ（スクロール可能） */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs flex-1">
          {/* 主要 4 大メトリクスカード */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-medium text-[11px]">総文字数</span>
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-cyan-400">
                {stats.characters.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                空白除く: {stats.charactersNoSpace.toLocaleString()}
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-medium text-[11px]">総単語数</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-amber-400">
                {stats.words.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                段落数: {detailedAnalysis.paragraphs.toLocaleString()}
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-medium text-[11px]">総行数</span>
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-emerald-400">
                {stats.lines.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                空行数: {detailedAnalysis.emptyLines.toLocaleString()}
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-medium text-[11px]">読了目安</span>
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-indigo-400">
                約 {detailedAnalysis.readingTimeNormal} <span className="text-xs font-normal">分</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                音読: 約 {detailedAnalysis.readingTimeSpeech} 分
              </div>
            </div>
          </div>

          {/* タスク完了進捗バー (タスクがある場合) */}
          {detailedAnalysis.tasksTotal > 0 && (
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-semibold text-xs text-emerald-400">
                  <ListTodo className="w-4 h-4" />
                  <span>タスク完了進捗</span>
                </div>
                <div className="font-mono font-bold text-sm text-emerald-400">
                  {detailedAnalysis.taskCompletionRate}% ({detailedAnalysis.tasksCompleted} / {detailedAnalysis.tasksTotal})
                </div>
              </div>
              {/* プログレスバー */}
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${(detailedAnalysis.tasksCompleted / detailedAnalysis.tasksTotal) * 100}%` }}
                  title={`完了: ${detailedAnalysis.tasksCompleted}`}
                />
                <div
                  className="bg-cyan-500 h-full transition-all duration-500"
                  style={{ width: `${(detailedAnalysis.tasksInProgress / detailedAnalysis.tasksTotal) * 100}%` }}
                  title={`進行中: ${detailedAnalysis.tasksInProgress}`}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                <span>✅ 完了: <strong>{detailedAnalysis.tasksCompleted}</strong></span>
                <span>⏳ 進行中: <strong>{detailedAnalysis.tasksInProgress}</strong></span>
                <span>⬜ 未着手: <strong>{detailedAnalysis.tasksUnchecked}</strong></span>
              </div>
            </div>
          )}

          {/* 2カラム構成: 見出し構造内訳 & Markdown 構成要素 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 見出し構造 */}
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
                <span className="font-semibold flex items-center gap-1.5 text-cyan-400">
                  <Heading className="w-4 h-4" />
                  見出し構造内訳 (計 {detailedAnalysis.totalHeadings})
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                <div className="flex justify-between p-1.5 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400"># H1:</span>
                  <strong className="text-slate-200">{detailedAnalysis.headings.h1}</strong>
                </div>
                <div className="flex justify-between p-1.5 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400">## H2:</span>
                  <strong className="text-slate-200">{detailedAnalysis.headings.h2}</strong>
                </div>
                <div className="flex justify-between p-1.5 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400">### H3:</span>
                  <strong className="text-slate-200">{detailedAnalysis.headings.h3}</strong>
                </div>
                <div className="flex justify-between p-1.5 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400">#### H4:</span>
                  <strong className="text-slate-200">{detailedAnalysis.headings.h4}</strong>
                </div>
                <div className="flex justify-between p-1.5 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400">##### H5:</span>
                  <strong className="text-slate-200">{detailedAnalysis.headings.h5}</strong>
                </div>
                <div className="flex justify-between p-1.5 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400">###### H6:</span>
                  <strong className="text-slate-200">{detailedAnalysis.headings.h6}</strong>
                </div>
              </div>
            </div>

            {/* Markdown 構成要素 */}
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
                <span className="font-semibold flex items-center gap-1.5 text-purple-400">
                  <BookOpen className="w-4 h-4" />
                  Markdown 構成要素
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center justify-between p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Code className="w-3.5 h-3.5 text-amber-400" />
                    コードブロック
                  </span>
                  <strong className="font-mono text-amber-300">{detailedAnalysis.codeBlocks}</strong>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <TableIcon className="w-3.5 h-3.5 text-purple-400" />
                    表組み (テーブル)
                  </span>
                  <strong className="font-mono text-purple-300">{detailedAnalysis.tables}</strong>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
                    リンク
                  </span>
                  <strong className="font-mono text-blue-300">{detailedAnalysis.links}</strong>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                    画像
                  </span>
                  <strong className="font-mono text-emerald-300">{detailedAnalysis.images}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* モーダルフッター */}
        <div
          className={`px-5 py-3 border-t flex items-center justify-between shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}
        >
          <div className="text-[11px] truncate max-w-sm">
            対象: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{doc.title}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
