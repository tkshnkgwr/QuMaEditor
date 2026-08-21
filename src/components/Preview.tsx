import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import {
  FileText,
  User,
  UserCheck,
  Calendar,
  Tag,
  Globe,
  Zap,
} from 'lucide-react';
import { parseYamlFrontMatter } from '../utils/yamlUtils';
import { renderMarkdownHtmlNative } from '../utils/tauriNative';
import { HeadingTheme } from '../types';
import { getHeadingColors, createMarkdownComponents } from './MarkdownRenderers';

interface PreviewProps {
  content: string;
  docTitle?: string;
  onToggleTaskItem?: (taskIndex: number) => void;
  onScrollRef?: (el: HTMLDivElement | null) => void;
  isDark?: boolean;
  fontSize?: number;
  lineHeight?: number;
  fontFamily?: string;
  headingTheme?: HeadingTheme;
}

export const Preview: React.FC<PreviewProps> = ({
  content,
  docTitle,
  onToggleTaskItem,
  onScrollRef,
  isDark = true,
  fontSize,
  lineHeight,
  fontFamily,
  headingTheme = 'muted',
}) => {
  const headingColors = getHeadingColors(headingTheme, isDark);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [nativeHtml, setNativeHtml] = useState<string | null>(null);
  const [isNativeUsed, setIsNativeUsed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  const handleCopyCode = (codeText: string, id: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const markdownComponents = useMemo(
    () =>
      createMarkdownComponents({
        headingColors,
        isDark,
        onToggleTaskItem,
        copiedCodeId,
        handleCopyCode,
      }),
    [headingColors, isDark, onToggleTaskItem, copiedCodeId]
  );

  useEffect(() => {
    (window as any).__copyCodeBlock = (btn: HTMLButtonElement) => {
      const wrapper = btn.closest('.code-block-wrapper');
      if (wrapper) {
        const codeEl = wrapper.querySelector('pre code');
        if (codeEl && codeEl.textContent) {
          navigator.clipboard.writeText(codeEl.textContent);
          const originalText = btn.textContent;
          btn.textContent = 'コピー完了 ✓';
          btn.classList.add('bg-emerald-600', 'text-white');
          setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('bg-emerald-600', 'text-white');
          }, 2000);
        }
      }
    };
    return () => {
      delete (window as any).__copyCodeBlock;
    };
  }, []);

  const { body, metadata } = React.useMemo(() => {
    return parseYamlFrontMatter(content);
  }, [content]);

  const hasFrontmatter = Object.keys(metadata).length > 0;

  useEffect(() => {
    let isMounted = true;
    // 超大容量テキストかつ Mermaid ダイアグラムを含まない場合のみ高速ネイティブ HTML レンダラーを適用
    if (body.length > 100000 && !body.includes('```mermaid')) {
      renderMarkdownHtmlNative(body, isDark).then((html) => {
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
  }, [body, isDark]);

  const effectiveFontFamily = useMemo(() => {
    if (fontFamily === 'monospace') {
      return 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
    }
    if (fontFamily === 'sans-serif') {
      return 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    }
    return undefined;
  }, [fontFamily]);

  return (
    <div
      ref={onScrollRef}
      style={{
        fontSize: fontSize ? `${fontSize * zoomLevel}px` : `${16 * zoomLevel}px`,
        lineHeight: lineHeight !== undefined ? lineHeight : 1.6,
        fontFamily: effectiveFontFamily,
      }}
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
      {/* 印刷プレビュー専用ヘッダー (ファイル名・タイトル明示) */}
      {docTitle && (
        <div className="hidden print:block mb-5 pb-2 border-b-2 border-slate-800">
          <div className="flex items-center justify-between text-slate-900">
            <h1 className="text-xl font-bold tracking-tight border-none pb-0 mb-0 mt-0 text-slate-900">{docTitle}</h1>
            <span className="text-xs font-mono text-slate-500">QuMaEditor</span>
          </div>
        </div>
      )}

      {content.trim() === '' ? (
        <div className={`h-full flex flex-col items-center justify-center select-none ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
          <p className="text-sm">プレビュー表示エリア</p>
          <p className="text-xs mt-1">左側のエディタにMarkdownを入力するとここに表示されます</p>
        </div>
      ) : (
        <>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                {metadata.author && (
                  <div className="flex items-center gap-1.5" title="作成者">
                    <User className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                    <span className={isDark ? 'text-slate-500' : 'text-slate-600 font-medium'}>作成者:</span>
                    <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{metadata.author}</span>
                  </div>
                )}

                {metadata.created && (
                  <div className="flex items-center gap-1.5" title="作成日">
                    <Calendar className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    <span className={isDark ? 'text-slate-500' : 'text-slate-600 font-medium'}>作成日:</span>
                    <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{metadata.created}</span>
                  </div>
                )}

                {metadata.updated && (
                  <div className="flex items-center gap-1.5" title="更新日">
                    <Calendar className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    <span className={isDark ? 'text-slate-500' : 'text-slate-600 font-medium'}>更新日:</span>
                    <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{metadata.updated}</span>
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
                      {metadata.tags.map((tag: any, idx: number) => (
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
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
                  const container = e.currentTarget;
                  const checkboxes = Array.from(container.querySelectorAll('input[type="checkbox"]'));
                  const idx = checkboxes.indexOf(target as HTMLInputElement);
                  if (idx !== -1 && onToggleTaskItem) {
                    onToggleTaskItem(idx);
                  }
                }
              }}
            />
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={markdownComponents}
            >
              {body}
            </ReactMarkdown>
          )}
        </>
      )}
    </div>
  );
};
