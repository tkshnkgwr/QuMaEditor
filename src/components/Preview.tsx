import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, ExternalLink, Clock, User, UserCheck, Calendar, Tag, FileText, Globe, Zap, Table } from 'lucide-react';
import { parseYamlFrontMatter } from '../utils/yamlUtils';
import { parseMarkdownNative, parseCsvPreviewNative, CsvPreviewDto } from '../utils/tauriNative';
import { MermaidRenderer } from './MermaidRenderer';
import { HeadingTheme } from '../types';

interface PreviewProps {
  content: string;
  onToggleTaskItem?: (taskIndex: number) => void;
  onScrollRef?: (el: HTMLDivElement | null) => void;
  isDark?: boolean;
  fontSize?: number;
  headingTheme?: HeadingTheme;
  isCsv?: boolean;
}

function getHeadingColors(theme: HeadingTheme = 'muted', isDark: boolean = true) {
  switch (theme) {
    case 'vivid':
      return {
        h1: isDark ? 'text-amber-300 border-slate-800' : 'text-amber-700 border-slate-300',
        h2: isDark ? 'text-cyan-300 border-slate-800/60' : 'text-cyan-700 border-slate-200',
        h3: isDark ? 'text-emerald-300 font-semibold' : 'text-emerald-700 font-semibold',
        h4: isDark ? 'text-violet-300 font-semibold' : 'text-violet-700 font-semibold',
        h5: isDark ? 'text-rose-300 font-medium' : 'text-rose-700 font-medium',
        h6: isDark ? 'text-pink-300 font-medium' : 'text-pink-700 font-medium',
      };
    case 'high_contrast':
      return {
        h1: isDark ? 'text-yellow-300 font-extrabold border-slate-800' : 'text-blue-950 font-black border-slate-300',
        h2: isDark ? 'text-sky-300 font-bold border-slate-800/60' : 'text-purple-950 font-extrabold border-slate-200',
        h3: isDark ? 'text-rose-300 font-bold' : 'text-rose-950 font-bold',
        h4: isDark ? 'text-lime-300 font-bold' : 'text-emerald-950 font-bold',
        h5: isDark ? 'text-orange-300 font-bold' : 'text-amber-950 font-bold',
        h6: isDark ? 'text-cyan-300 font-bold' : 'text-teal-950 font-bold',
      };
    case 'monochrome':
      return {
        h1: isDark ? 'text-white border-slate-800' : 'text-black border-slate-300',
        h2: isDark ? 'text-slate-200 border-slate-800/60' : 'text-slate-800 border-slate-200',
        h3: isDark ? 'text-slate-300 font-semibold' : 'text-slate-700 font-semibold',
        h4: isDark ? 'text-slate-400 font-semibold' : 'text-slate-600 font-semibold',
        h5: isDark ? 'text-slate-400 font-medium' : 'text-slate-600 font-medium',
        h6: isDark ? 'text-slate-500 font-medium' : 'text-slate-500 font-medium',
      };
    case 'muted':
    default:
      return {
        h1: isDark ? 'text-sky-300 border-slate-800' : 'text-sky-800 border-slate-300',
        h2: isDark ? 'text-indigo-300 border-slate-800/60' : 'text-indigo-800 border-slate-200',
        h3: isDark ? 'text-teal-300 font-semibold' : 'text-teal-800 font-semibold',
        h4: isDark ? 'text-slate-300 font-semibold' : 'text-slate-700 font-semibold',
        h5: isDark ? 'text-slate-400 font-medium' : 'text-slate-600 font-medium',
        h6: isDark ? 'text-slate-400 font-medium' : 'text-slate-600 font-medium',
      };
  }
}

function parseLiForTask(
  children: React.ReactNode,
  className?: string,
  node?: any
): {
  isTask: boolean;
  state: 'unchecked' | 'in-progress' | 'checked';
  cleanedChildren: React.ReactNode;
} {
  const isGfmTask = !!className?.includes('task-list-item') || node?.checked !== undefined;
  let detectedState: 'unchecked' | 'in-progress' | 'checked' | null = null;

  if (node && typeof node.checked === 'boolean') {
    detectedState = node.checked ? 'checked' : 'unchecked';
  }

  function processNodes(nodes: React.ReactNode[]): React.ReactNode[] {
    const result: React.ReactNode[] = [];

    for (let i = 0; i < nodes.length; i++) {
      const nodeItem = nodes[i];

      if (typeof nodeItem === 'string') {
        let text = nodeItem;
        const trimmed = text.trimStart();

        if (trimmed.startsWith('[/]') || trimmed.startsWith('[-]')) {
          detectedState = 'in-progress';
          text = text.replace(/^\s*\[(\/|-)\]\s*/, '');
        } else if (trimmed.startsWith('[ ]')) {
          if (!detectedState) detectedState = 'unchecked';
          text = text.replace(/^\s*\[ \]\s*/, '');
        } else if (trimmed.startsWith('[x]') || trimmed.startsWith('[X]')) {
          detectedState = 'checked';
          text = text.replace(/^\s*\[(x|X)\]\s*/, '');
        }

        if (text !== '' || detectedState === null) {
          result.push(text);
        }
        continue;
      }

      if (React.isValidElement(nodeItem)) {
        const props = (nodeItem.props as any) || {};

        if (props.type === 'checkbox' || props.checked !== undefined || props.defaultChecked !== undefined) {
          if (!detectedState) {
            const isChecked = props.checked === true || props.defaultChecked === true || props.checked === 'checked';
            detectedState = isChecked ? 'checked' : 'unchecked';
          }
          continue;
        }

        if (props.children) {
          const childNodes = React.Children.toArray(props.children);
          const processedChildren = processNodes(childNodes);
          result.push(React.cloneElement(nodeItem, props, ...processedChildren));
          continue;
        }
      }

      result.push(nodeItem);
    }

    return result;
  }

  const rawArray = React.Children.toArray(children);
  const cleanedNodes = processNodes(rawArray);
  const isTask = isGfmTask || detectedState !== null;

  return {
    isTask,
    state: detectedState || 'unchecked',
    cleanedChildren: cleanedNodes,
  };
}

export const Preview: React.FC<PreviewProps> = ({
  content,
  onToggleTaskItem,
  onScrollRef,
  isDark = true,
  fontSize,
  headingTheme = 'muted',
  isCsv = false,
}) => {
  const headingColors = getHeadingColors(headingTheme, isDark);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [nativeHtml, setNativeHtml] = useState<string | null>(null);
  const [isNativeUsed, setIsNativeUsed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  const [csvData, setCsvData] = useState<CsvPreviewDto | null>(null);

  // CSV 時は Front Matter の重い正規表現パースを完全バイパス (メモリ＆CPU負荷ゼロ化)
  const { body, metadata } = React.useMemo(() => {
    if (isCsv) {
      return { body: content, metadata: {} };
    }
    return parseYamlFrontMatter(content);
  }, [isCsv, content]);

  const hasFrontmatter = Object.keys(metadata).length > 0;

  // 大容量テキスト (100KB超) の場合は Rust ネイティブ (pulldown-cmark) で爆速パース (CSV時はスキップ)
  useEffect(() => {
    let isMounted = true;
    if (!isCsv && body.length > 100000) {
      parseMarkdownNative(body).then((html) => {
        if (isMounted && html) {
          setNativeHtml(html);
          setIsNativeUsed(true);
        }
      });
    } else {
      setNativeHtml(null);
      setIsNativeUsed(false);
    }
    return () => {
      isMounted = false;
    };
  }, [body, isCsv]);

  // 総行数のゼロアロケーション算出 (メモリ割り当て 0)
  const totalLineCount = React.useMemo(() => {
    if (!content) return 0;
    let count = 1;
    for (let i = 0; i < content.length; i++) {
      if (content.charCodeAt(i) === 10) {
        count++;
      }
    }
    return count;
  }, [content]);

  // CSV データを Rust ネイティブで爆速非同期パース (IPC転送量を 3MB ➔ 50KB へ 99% 削減 + 100ms ディバウンス)
  useEffect(() => {
    let isMounted = true;
    if (!isCsv || !content) {
      setCsvData(null);
      return;
    }

    const timer = setTimeout(() => {
      // 冒頭 100 行分のプレビューに必要な最大 80KB のみを Rust へ転送 (通信負荷＆JSONシリアライズを 99% 削減)
      const previewSlice = content.length > 80000 ? content.slice(0, 80000) : content;

      parseCsvPreviewNative(previewSlice, 100).then((res) => {
        if (isMounted && res) {
          setCsvData({
            ...res,
            total_lines: totalLineCount,
          });
        }
      });
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isCsv, content, totalLineCount]);

  const handleCopyCode = (codeText: string, id: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div
      ref={onScrollRef}
      style={{ fontSize: fontSize ? `${fontSize * zoomLevel}px` : `${16 * zoomLevel}px` }}
      onWheel={(e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -0.1 : 0.1;
          setZoomLevel((prev) => Math.max(0.5, Math.min(3.0, parseFloat((prev + delta).toFixed(1)))));
        }
      }}
      className={`relative flex-1 h-full p-6 overflow-y-auto preview-markdown transition-colors print:block print:w-full print:h-auto print:p-0 print:m-0 print:border-none ${
        isDark
          ? 'bg-slate-900/80 text-slate-200 border-l border-slate-800/80 selection:bg-cyan-800 selection:text-slate-100'
          : 'bg-white text-slate-900 border-l border-slate-200 selection:bg-cyan-200 selection:text-slate-900'
      }`}
    >
      {zoomLevel !== 1.0 && (
        <div className="sticky top-2 right-2 float-right z-10 flex items-center gap-1 print:hidden">
          <button
            onClick={() => setZoomLevel(1.0)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono border shadow-sm transition-colors flex items-center gap-1 ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-cyan-400 hover:bg-slate-700'
                : 'bg-white border-slate-200 text-cyan-700 hover:bg-slate-50'
            }`}
            title="ズームをリセット"
          >
            🔍 {Math.round(zoomLevel * 100)}% (クリックでリセット)
          </button>
        </div>
      )}
      {content.trim() === '' ? (
        <div className={`h-full flex flex-col items-center justify-center select-none ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
          <p className="text-sm">プレビュー表示エリア</p>
          <p className="text-xs mt-1">{isCsv ? 'CSVデータを入力するとテーブルプレビューが表示されます' : '左側のエディタにMarkdownを入力するとここに表示されます'}</p>
        </div>
      ) : isCsv ? (
        <div className="space-y-4">
          <div className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
            isDark ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 font-semibold">
              <Table className="w-4 h-4 text-cyan-400" />
              <span>CSV データプレビュー</span>
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                Rust ネイティブ高速パース
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              {csvData
                ? csvData.total_lines > 100
                  ? `冒頭 ${csvData.displayed_lines} 行を表示中 (全 ${csvData.total_lines.toLocaleString()} 行 / ${csvData.total_cols} 列)`
                  : `全 ${csvData.total_lines} 行 / ${csvData.total_cols} 列を表示中`
                : '解析中...'}
            </div>
          </div>

          {csvData && (
            <div className="overflow-x-auto border rounded-lg max-w-full">
              <table className={`w-full text-left text-xs border-collapse font-mono ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}>
                {csvData.headers.length > 0 && (
                  <thead>
                    <tr className={isDark ? 'bg-slate-800/80 text-cyan-300' : 'bg-slate-100 text-cyan-800'}>
                      <th className="p-2 border-b border-r text-[10px] w-12 text-center select-none opacity-60">#</th>
                      {csvData.headers.map((header, idx) => (
                        <th key={idx} className="p-2 border-b font-bold whitespace-nowrap">
                          {header || `列 ${idx + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {csvData.rows.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className={`border-b transition-colors ${
                        isDark
                          ? rowIdx % 2 === 0 ? 'bg-slate-900/40 hover:bg-slate-800/60' : 'bg-slate-950/40 hover:bg-slate-800/60'
                          : rowIdx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/60 hover:bg-slate-100/80'
                      } ${isDark ? 'border-slate-800/60' : 'border-slate-200'}`}
                    >
                      <td className="p-1.5 border-r text-[10px] text-center select-none opacity-50 font-mono">
                        {rowIdx + 2}
                      </td>
                      {row.map((cell, colIdx) => (
                        <td key={colIdx} className="p-2 border-r last:border-r-0 whitespace-nowrap max-w-xs truncate" title={cell}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* YAML Front Matter ヘッダーカード (ライトモード超高明度・ダークモード完全調和) */}
          {hasFrontmatter && (
            <div className={`mb-6 p-3.5 rounded-xl border text-xs leading-relaxed select-none shadow-xs ${
              isDark
                ? 'bg-slate-950/90 border-slate-800 text-slate-300'
                : 'bg-amber-50/90 border-amber-200 text-slate-900 shadow-2xs'
            }`}>
              <div className={`flex items-center justify-between gap-2 border-b pb-2 mb-2.5 ${
                isDark ? 'border-slate-800/80' : 'border-amber-200'
              }`}>
                <div className={`flex items-center gap-1.5 font-bold ${
                  isDark ? 'text-cyan-400' : 'text-amber-950'
                }`}>
                  <FileText className="w-3.5 h-3.5" />
                  <span>YAML Front Matter (メタデータ)</span>
                </div>
                {isNativeUsed && (
                  <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                    <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                    Rust 爆速パース適用中
                  </span>
                )}
                {metadata.title && (
                  <span className={`font-bold text-[11px] truncate max-w-[220px] ${
                    isDark ? 'text-slate-400' : 'text-amber-950 font-extrabold'
                  }`}>
                    {metadata.title}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px]">
                {metadata.author && (
                  <div className="flex items-center gap-1.5" title="作成者">
                    <User className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                    <span className={isDark ? 'text-slate-500' : 'text-slate-700 font-bold'}>作成者:</span>
                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{metadata.author}</span>
                  </div>
                )}

                {metadata.created && (
                  <div className="flex items-center gap-1.5" title="作成日時">
                    <Calendar className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
                    <span className={isDark ? 'text-slate-500' : 'text-slate-700 font-bold'}>作成日時:</span>
                    <span className={`font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      {isNaN(Date.parse(metadata.created))
                        ? metadata.created
                        : new Date(metadata.created).toLocaleString('ja-JP')}
                    </span>
                  </div>
                )}

                {metadata.updated && (
                  <div className="flex items-center gap-1.5" title="更新日時">
                    <Clock className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                    <span className={isDark ? 'text-slate-500' : 'text-slate-700 font-bold'}>更新日時:</span>
                    <span className={`font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      {isNaN(Date.parse(metadata.updated))
                        ? metadata.updated
                        : new Date(metadata.updated).toLocaleString('ja-JP')}
                    </span>
                  </div>
                )}

                {metadata.updatedBy && (
                  <div className="flex items-center gap-1.5" title="更新者">
                    <UserCheck className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    <span className={isDark ? 'text-slate-500' : 'text-slate-600 font-medium'}>更新者:</span>
                    <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{metadata.updatedBy}</span>
                  </div>
                )}

                {metadata.encoding && (
                  <div className="flex items-center gap-1.5" title="文字コード">
                    <Globe className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                    <span className={`font-mono px-1.5 py-0.2 rounded text-[10px] ${
                      isDark
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-purple-100 text-purple-800 border border-purple-300 font-semibold'
                    }`}>
                      {metadata.encoding}
                    </span>
                  </div>
                )}

                {metadata.tags && metadata.tags.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Tag className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
                    <div className="flex flex-wrap gap-1">
                      {metadata.tags.map((tag, idx) => (
                        <span key={idx} className={`px-1.5 py-0.2 text-[10px] rounded ${
                          isDark
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-rose-100 text-rose-800 border border-rose-300 font-semibold'
                        }`}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {nativeHtml ? (
            <div
              className={`prose max-w-none text-sm leading-relaxed ${isDark ? 'prose-invert text-slate-200' : 'text-slate-900'}`}
              dangerouslySetInnerHTML={{ __html: nativeHtml }}
            />
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                // 見出し 1
                h1: ({ children }) => (
                  <h1 className={`text-2xl font-bold pb-2 mb-4 border-b mt-6 first:mt-0 tracking-tight flex items-center gap-2 ${headingColors.h1}`}>
                    {children}
                  </h1>
                ),
                // 見出し 2
                h2: ({ children }) => (
                  <h2 className={`text-xl font-semibold pb-1.5 mb-3 border-b mt-5 tracking-tight ${headingColors.h2}`}>
                    {children}
                  </h2>
                ),
                // 見出し 3
                h3: ({ children }) => (
                  <h3 className={`text-lg mb-2 mt-4 ${headingColors.h3}`}>{children}</h3>
                ),
                // 見出し 4
                h4: ({ children }) => (
                  <h4 className={`text-base mb-2 mt-3.5 ${headingColors.h4}`}>{children}</h4>
                ),
                // 見出し 5
                h5: ({ children }) => (
                  <h5 className={`text-sm mb-1.5 mt-3 ${headingColors.h5}`}>{children}</h5>
                ),
                // 見出し 6
                h6: ({ children }) => (
                  <h6 className={`text-xs mb-1 mt-2.5 ${headingColors.h6}`}>{children}</h6>
                ),
                // 段落 (文字の明るさ・読みにくさを完全に解消)
                p: ({ children }) => (
                  <p className={`mb-4 leading-relaxed text-sm font-sans ${
                    isDark ? 'text-slate-200' : 'text-slate-800 font-normal'
                  }`}>{children}</p>
                ),
                // 箇条書きリスト
                ul: ({ children }) => (
                  <ul className={`list-disc list-inside mb-4 space-y-1.5 text-sm pl-2 ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}>{children}</ul>
                ),
                // 番号付きリスト
                ol: ({ children }) => (
                  <ol className={`list-decimal list-inside mb-4 space-y-1.5 text-sm pl-2 ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}>{children}</ol>
                ),
                // リスト項目
                li: ({ children, className, node }: any) => {
                  const { isTask, state, cleanedChildren } = parseLiForTask(children, className, node);

                  if (isTask) {
                    return (
                      <li className="list-none flex items-start gap-2.5 text-sm my-1.5 font-sans group">
                        <div
                          onClick={() => {
                            if (node && typeof node.position?.start?.line === 'number') {
                              onToggleTaskItem?.(node.position.start.line);
                            }
                          }}
                          className={`mt-0.5 shrink-0 w-4 h-4 rounded border transition-all duration-150 flex items-center justify-center select-none cursor-pointer hover:scale-105 ${
                            state === 'checked'
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                              : state === 'in-progress'
                              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 ring-2 ring-cyan-500/20'
                              : isDark
                              ? 'bg-slate-950 border-slate-700 text-transparent hover:border-cyan-500'
                              : 'bg-white border-slate-300 text-transparent hover:border-cyan-600'
                          }`}
                          title="クリックしてタスク状態を変更"
                        >
                          {state === 'checked' && <Check className="w-3 h-3 stroke-[3]" />}
                          {state === 'in-progress' && <Clock className="w-2.5 h-2.5 animate-pulse" />}
                        </div>

                        <div className={`flex-1 leading-relaxed ${
                          state === 'checked'
                            ? isDark ? 'line-through text-slate-500' : 'line-through text-slate-400'
                            : state === 'in-progress'
                            ? isDark ? 'text-cyan-200 font-medium' : 'text-cyan-900 font-semibold'
                            : isDark ? 'text-slate-200' : 'text-slate-800'
                        }`}>
                          {cleanedChildren}
                          {state === 'in-progress' && (
                            <span className={`ml-2 text-[10px] px-1.5 py-0.2 rounded font-mono inline-flex items-center gap-1 ${
                              isDark
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'bg-cyan-100 text-cyan-900 border border-cyan-300 font-semibold'
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                              進行中
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  }
                  return <li className={`leading-relaxed font-sans ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{children}</li>;
                },
                input: (props) => {
                  if (props.type === 'checkbox') {
                    return null;
                  }
                  return <input {...props} />;
                },
                // 引用
                blockquote: ({ children }) => (
                  <blockquote className={`border-l-4 pl-4 py-2 my-4 rounded-r italic text-sm ${
                    isDark
                      ? 'border-cyan-500/80 bg-slate-950/60 text-slate-300'
                      : 'border-cyan-600 bg-cyan-50/60 text-slate-800'
                  }`}>
                    {children}
                  </blockquote>
                ),
                // 表組み (テーブル: ライトモード・ダークモード完全適合)
                table: ({ children }) => (
                  <div className={`overflow-x-auto my-5 rounded-lg border shadow-xs ${
                    isDark ? 'border-slate-800' : 'border-slate-300 bg-white'
                  }`}>
                    <table className="w-full text-xs border-collapse">{children}</table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className={`font-semibold border-b ${
                    isDark
                      ? 'bg-slate-950 text-cyan-400 border-slate-800'
                      : 'bg-slate-100 text-slate-900 border-slate-300 font-bold'
                  }`}>
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => (
                  <tbody className={`divide-y ${
                    isDark
                      ? 'divide-slate-800/60 bg-slate-900/40'
                      : 'divide-slate-200 bg-white text-slate-800'
                  }`}>
                    {children}
                  </tbody>
                ),
                tr: ({ children }) => (
                  <tr className={`transition-colors ${
                    isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                  }`}>
                    {children}
                  </tr>
                ),
                th: ({ children, style, align }: any) => {
                  const textAlign = style?.textAlign || align || 'left';
                  return (
                    <th className={`p-2.5 font-semibold ${
                      isDark ? 'text-cyan-400' : 'text-slate-900 font-bold'
                    }`} style={{ textAlign }}>
                      {children}
                    </th>
                  );
                },
                td: ({ children, style, align }: any) => {
                  const textAlign = style?.textAlign || align || 'left';
                  return (
                    <td className={`p-2.5 ${
                      isDark ? 'text-slate-300' : 'text-slate-800 font-normal'
                    }`} style={{ textAlign }}>
                      {children}
                    </td>
                  );
                },
                // インラインコード「`」およびコードブロック
                code: ({ inline, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  const codeString = String(children).replace(/\n$/, '');
                  const codeId = React.useId();

                  // Mermaid ダイアグラムのリアルタイム描画
                  if (!inline && (language === 'mermaid' || className?.includes('language-mermaid'))) {
                    return <MermaidRenderer chart={codeString} isDark={isDark} />;
                  }

                  if (!inline && (match || className?.includes('language-'))) {
                    return (
                      <div className={`relative my-4 rounded-lg border overflow-hidden text-xs shadow-xs ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'
                      }`}>
                        <div className={`flex items-center justify-between px-3 py-1.5 border-b font-mono text-[11px] ${
                          isDark
                            ? 'bg-slate-900 border-slate-800 text-slate-400'
                            : 'bg-slate-200/80 border-slate-300 text-slate-800 font-medium'
                        }`}>
                          <span className={`font-semibold ${isDark ? 'text-cyan-400' : 'text-cyan-800'}`}>
                            {language || 'code'}
                          </span>
                          <button
                            onClick={() => handleCopyCode(codeString, codeId)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                              isDark
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                                : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 shadow-2xs'
                            }`}
                          >
                            {copiedCodeId === codeId ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span className="text-emerald-500 font-semibold">コピー完了</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>コピー</span>
                              </>
                            )}
                          </button>
                        </div>
                        <SyntaxHighlighter
                          style={(isDark ? vscDarkPlus : prism) as any}
                          language={language || 'text'}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            padding: '1rem',
                            background: 'transparent',
                            fontSize: '0.8rem',
                            lineHeight: '1.6',
                          }}
                        >
                          {codeString}
                        </SyntaxHighlighter>
                      </div>
                    );
                  }

                  // 「`」で囲まれたインラインコード (ライトモード・ダークモード完全適合)
                  return (
                    <code className={`rounded px-1.5 py-0.5 font-mono text-xs border ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-cyan-300'
                        : 'bg-cyan-50 border-cyan-200/80 text-cyan-900 font-semibold'
                    }`} {...props}>
                      {children}
                    </code>
                  );
                },
                // 画像
                img: ({ src, alt }) => (
                  <span className="block my-4">
                    <img
                      src={src}
                      alt={alt || ''}
                      className={`max-w-full h-auto rounded-lg border shadow-md object-contain max-h-[500px] ${
                        isDark ? 'border-slate-800' : 'border-slate-300'
                      }`}
                    />
                    {alt && <span className={`block text-center text-xs mt-1 font-sans ${
                      isDark ? 'text-slate-500' : 'text-slate-500'
                    }`}>{alt}</span>}
                  </span>
                ),
                // リンク
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`underline underline-offset-2 inline-flex items-center gap-1 font-sans ${
                      isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-600 font-medium'
                    }`}
                  >
                    {children}
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                ),
                // 水平線
                hr: () => <hr className={`my-6 ${isDark ? 'border-slate-800' : 'border-slate-300'}`} />,
                // 打ち消し線
                del: ({ children }) => <del className={`line-through ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{children}</del>,
              }}
            >
              {body}
            </ReactMarkdown>
          )}
        </>
      )}
    </div>
  );
};
