import React from 'react';
import { Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, ExternalLink, Clock } from 'lucide-react';
import { MermaidRenderer } from './MermaidRenderer';
import { HeadingTheme } from '../types';

export function getHeadingColors(theme: HeadingTheme = 'muted', isDark: boolean = true) {
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

export function parseLiForTask(
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

interface CreateMarkdownComponentsOptions {
  headingColors: ReturnType<typeof getHeadingColors>;
  isDark: boolean;
  onToggleTaskItem?: (taskIndex: number) => void;
  copiedCodeId: string | null;
  handleCopyCode: (codeText: string, id: string) => void;
}

/**
 * ReactMarkdown 用のカスタム HTML 要素レンダラーマップを生成する
 */
export function createMarkdownComponents({
  headingColors,
  isDark,
  onToggleTaskItem,
  copiedCodeId,
  handleCopyCode,
}: CreateMarkdownComponentsOptions): Components {
  return {
    h1: ({ children }) => (
      <h1 className={`text-2xl font-bold pb-2 mb-4 border-b mt-6 first:mt-0 tracking-tight flex items-center gap-2 ${headingColors.h1}`}>
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className={`text-xl font-semibold pb-1.5 mb-3 border-b mt-5 tracking-tight ${headingColors.h2}`}>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className={`text-lg mb-2 mt-4 ${headingColors.h3}`}>{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className={`text-base mb-2 mt-3.5 ${headingColors.h4}`}>{children}</h4>
    ),
    h5: ({ children }) => (
      <h5 className={`text-sm mb-1.5 mt-3 ${headingColors.h5}`}>{children}</h5>
    ),
    h6: ({ children }) => (
      <h6 className={`text-xs mb-1 mt-2.5 ${headingColors.h6}`}>{children}</h6>
    ),
    p: ({ children }) => (
      <p className={`mb-4 leading-relaxed text-sm font-sans ${isDark ? 'text-slate-200' : 'text-slate-800 font-normal'}`}>
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul
        className={`list-disc list-outside pl-6 my-2 space-y-1 text-sm leading-relaxed [&>li>p]:inline [&>li>p]:my-0 [&_ul]:list-[circle] [&_ul_ul]:list-[square] [&_ul]:my-1 [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:pl-5 ${
          isDark ? 'text-slate-200' : 'text-slate-800'
        }`}
      >
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol
        className={`list-decimal list-outside pl-6 my-2 space-y-1 text-sm leading-relaxed [&>li>p]:inline [&>li>p]:my-0 [&_ol]:list-[lower-alpha] [&_ol_ol]:list-[lower-roman] [&_ol]:my-1 [&_ol]:pl-5 [&_ul]:my-1 [&_ul]:pl-5 ${
          isDark ? 'text-slate-200' : 'text-slate-800'
        }`}
      >
        {children}
      </ol>
    ),
    li: ({ children, className, node }: any) => {
      const { isTask, state, cleanedChildren } = parseLiForTask(children, className, node);

      if (isTask) {
        return (
          <li className="list-none flex items-start gap-2.5 text-sm my-1.5 font-sans group task-list-item">
            <div
              onClick={() => {
                if (node && typeof node.position?.start?.line === 'number') {
                  onToggleTaskItem?.(node.position.start.line);
                }
              }}
              className={`mt-0.5 shrink-0 w-4 h-4 rounded border transition-all duration-150 flex items-center justify-center select-none cursor-pointer hover:scale-105 task-checkbox ${
                state === 'checked'
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs task-checkbox-checked'
                  : state === 'in-progress'
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 ring-2 ring-cyan-500/20 task-checkbox-in-progress'
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
                ? isDark ? 'line-through text-slate-500 task-text-checked' : 'line-through text-slate-400 task-text-checked'
                : state === 'in-progress'
                ? isDark ? 'text-cyan-200 font-medium' : 'text-cyan-900 font-semibold'
                : isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>
              {cleanedChildren}
              {state === 'in-progress' && (
                <span className={`ml-2 text-[10px] px-1.5 py-0.2 rounded font-mono inline-flex items-center gap-1 print:hidden ${
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
      return <li className={`my-0.5 leading-relaxed font-sans ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{children}</li>;
    },
    input: (props) => {
      if (props.type === 'checkbox') {
        return null;
      }
      return <input {...props} />;
    },
    blockquote: ({ children }) => (
      <blockquote className={`border-l-4 pl-4 py-2 my-4 rounded-r italic text-sm ${
        isDark ? 'border-cyan-500/80 bg-slate-950/60 text-slate-300' : 'border-cyan-600 bg-cyan-50/60 text-slate-800'
      }`}>
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div className={`overflow-x-auto my-5 rounded-lg border shadow-xs print:overflow-visible print:border-none print:shadow-none print:my-3 print:block ${
        isDark ? 'border-slate-800' : 'border-slate-300 bg-white'
      }`}>
        <table className="w-full text-xs border-collapse print:table print:w-full">{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className={`font-semibold border-b ${
        isDark ? 'bg-slate-950 text-cyan-400 border-slate-800' : 'bg-slate-100 text-slate-900 border-slate-300 font-bold'
      }`}>
        {children}
      </thead>
    ),
    tbody: ({ children }) => (
      <tbody className={`divide-y ${
        isDark ? 'divide-slate-800/60 bg-slate-900/40' : 'divide-slate-200 bg-white text-slate-800'
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
    code: ({ inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const codeString = String(children).replace(/\n$/, '');
      const codeId = React.useId();

      if (!inline && (language === 'mermaid' || className?.includes('language-mermaid'))) {
        return <MermaidRenderer chart={codeString} isDark={isDark} />;
      }

      if (!inline && (match || className?.includes('language-'))) {
        return (
          <div className={`relative my-4 rounded-lg border overflow-hidden text-xs shadow-xs ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'
          }`}>
            <div className={`flex items-center justify-between px-3 py-1.5 border-b font-mono text-[11px] ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-200/80 border-slate-300 text-slate-800 font-medium'
            }`}>
              <span className="font-semibold text-cyan-400 lowercase">{language || 'code'}</span>
              <button
                onClick={() => handleCopyCode(codeString, codeId)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all select-none ${
                  copiedCodeId === codeId
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : isDark
                    ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    : 'hover:bg-slate-300 text-slate-700 hover:text-slate-900'
                }`}
                title="コードをクリップボードにコピー"
              >
                {copiedCodeId === codeId ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>コピー完了</span>
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
              style={isDark ? vscDarkPlus : prism}
              language={language}
              PreTag="div"
              customStyle={{
                margin: 0,
                padding: '1rem',
                fontSize: '0.8125rem',
                backgroundColor: 'transparent',
                lineHeight: '1.6',
              }}
              {...props}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        );
      }

      return (
        <code className={`px-1.5 py-0.5 rounded text-xs font-mono font-medium ${
          isDark
            ? 'bg-slate-800/90 text-cyan-300 border border-slate-700/60'
            : 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
        }`} {...props}>
          {children}
        </code>
      );
    },
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-0.5 underline underline-offset-2 transition-colors ${
          isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-700 hover:text-blue-900 font-semibold'
        }`}
      >
        <span>{children}</span>
        <ExternalLink className="w-3 h-3 inline-block ml-0.5 opacity-60" />
      </a>
    ),
    hr: () => (
      <hr className={`my-6 border-0 h-px ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />
    ),
  };
}
