import React from 'react';
import { Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, prism, dracula, nord, okaidia, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { refractor } from 'refractor/all';
import { Copy, Check, ExternalLink, Clock } from 'lucide-react';
import { MermaidRenderer } from './MermaidRenderer';
import { HeadingTheme, CodeBlockTheme } from '../types';

/**
 * 選択された配色テーマとダークモード設定に応じた Prism スタイルを取得する
 */
export function getCodeBlockStyle(theme: CodeBlockTheme = 'vscDarkPlus', isDark: boolean = true) {
  if (!isDark) {
    return prism;
  }
  switch (theme) {
    case 'dracula':
      return dracula;
    case 'nord':
      return nord;
    case 'okaidia':
      return okaidia;
    case 'oneDark':
      return oneDark;
    case 'prism':
      return prism;
    case 'vscDarkPlus':
    default:
      return vscDarkPlus;
  }
}

// PowerShell (powershell / pwsh / ps1 / ps / posh) のシンタックスハイライト定義を強化
// - パラメータ名 (-Path, -Force, -Recurse 等) の属性カラーリング
// - 比較演算子 (-eq, -gt, -like 等) のキーワードカラーリング
// - 特殊変数 ($_, $env:PATH, $? 等) の変数カラーリング
// - 数値リテラル (100, 3.14 等) の数値カラーリング
try {
  const oldPs: any = refractor.languages?.powershell;
  if (oldPs) {
    (refractor.languages as any).powershell = {
      comment: oldPs.comment,
      string: oldPs.string,
      namespace: oldPs.namespace,
      boolean: oldPs.boolean,
      variable: /\$(?:[\w:]+|\?|\$|_|\^|\{[^}]+\})/,
      function: oldPs.function,
      keyword: oldPs.keyword,
      operator: {
        pattern: /(^|\s)(?:-(?:b?(?:and|x?or)|as|(?:Not)?(?:Contains|In|Like|Match)|eq|ge|gt|is(?:Not)?|Join|le|lt|ne|not|Replace|sh[lr])\b|[!=]=?|[-+*\/%]=|\+\+|--|[+*\/%]|-(?!\w))/i,
        lookbehind: true,
        alias: 'keyword',
      },
      parameter: {
        pattern: /(^|\s)-[a-zA-Z][\w-]*(?::\S+)?/,
        lookbehind: true,
        alias: 'attr-name',
      },
      number: /\b\d+(?:\.\d+)?\b/,
      punctuation: oldPs.punctuation,
    };
  }
} catch {
  // フォールバック
}

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
  codeBlockTheme?: CodeBlockTheme;
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
  codeBlockTheme = 'vscDarkPlus',
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
              onClick={(e) => {
                const container = e.currentTarget.closest('.preview-markdown');
                if (container) {
                  const checkboxes = Array.from(container.querySelectorAll('.task-checkbox'));
                  const idx = checkboxes.indexOf(e.currentTarget as HTMLElement);
                  if (idx !== -1) {
                    onToggleTaskItem?.(idx);
                    return;
                  }
                }
                if (node && typeof node.position?.start?.line === 'number') {
                  onToggleTaskItem?.(Math.max(0, node.position.start.line - 1));
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
    pre: ({ children }) => <>{children}</>,
    code: ({ inline, className, children, ...props }: any) => {
      const match = /language-([a-zA-Z0-9#+-]+)/.exec(className || '');
      const rawLanguage = match ? match[1] : '';
      const codeString = String(children).replace(/\n$/, '');
      const codeId = React.useId();

      const cleanLang = rawLanguage.toLowerCase().trim();

      if (!inline && (cleanLang === 'mermaid' || className?.toLowerCase().includes('language-mermaid'))) {
        return <MermaidRenderer chart={codeString} isDark={isDark} />;
      }

      // コードブロック判定: 言語指定があるか、クラス名にlanguage-があるか、複数行であるか
      const isCodeBlock = Boolean(!inline && (cleanLang || className?.toLowerCase().includes('language-') || codeString.includes('\n')));

      if (isCodeBlock) {
        const langMap: Record<string, string> = {
          // JavaScript / TypeScript / Web
          js: 'javascript',
          javascript: 'javascript',
          mjs: 'javascript',
          cjs: 'javascript',
          jsx: 'jsx',
          ts: 'typescript',
          typescript: 'typescript',
          mts: 'typescript',
          cts: 'typescript',
          tsx: 'tsx',
          html: 'html',
          htm: 'html',
          xml: 'xml',
          svg: 'xml',
          css: 'css',
          scss: 'scss',
          sass: 'sass',
          less: 'less',
          json: 'json',
          jsonc: 'json',
          json5: 'json',
          vue: 'html',
          svelte: 'html',
          graphql: 'graphql',
          gql: 'graphql',

          // Python / Ruby / PHP / Perl / Lua
          py: 'python',
          python: 'python',
          py3: 'python',
          pyw: 'python',
          rb: 'ruby',
          ruby: 'ruby',
          php: 'php',
          pl: 'perl',
          perl: 'perl',
          pm: 'perl',
          lua: 'lua',
          r: 'r',

          // Systems / Compiled Languages
          rs: 'rust',
          rust: 'rust',
          go: 'go',
          golang: 'go',
          c: 'c',
          h: 'c',
          cpp: 'cpp',
          'c++': 'cpp',
          cc: 'cpp',
          cxx: 'cpp',
          hpp: 'cpp',
          cs: 'csharp',
          csharp: 'csharp',
          'c#': 'csharp',
          java: 'java',
          kt: 'kotlin',
          kotlin: 'kotlin',
          kts: 'kotlin',
          swift: 'swift',
          dart: 'dart',
          scala: 'scala',

          // Shell / Scripts / Config
          sh: 'bash',
          shell: 'bash',
          bash: 'bash',
          zsh: 'bash',
          powershell: 'powershell',
          pwsh: 'powershell',
          ps: 'powershell',
          posh: 'powershell',
          ps1: 'powershell',
          bat: 'batch',
          cmd: 'batch',
          batch: 'batch',
          yml: 'yaml',
          yaml: 'yaml',
          toml: 'toml',
          ini: 'ini',
          properties: 'ini',
          conf: 'ini',
          cfg: 'ini',
          env: 'bash',
          dockerfile: 'docker',
          docker: 'docker',

          // Data / Query / Docs / Other
          sql: 'sql',
          mysql: 'sql',
          pgsql: 'sql',
          postgres: 'sql',
          sqlite: 'sql',
          md: 'markdown',
          markdown: 'markdown',
          mdx: 'markdown',
          diff: 'diff',
          patch: 'diff',
          latex: 'latex',
          tex: 'latex',
          text: 'text',
          txt: 'text',
          plain: 'text',
        };
        const prismLang = langMap[cleanLang] || cleanLang || 'text';
        const displayBadge = cleanLang || 'code';

        // テーマ別ヘッダー・枠線の微調整
        const themeHeaderBorder = (() => {
          if (!isDark) return 'bg-slate-200/80 border-slate-300 text-slate-800';
          switch (codeBlockTheme) {
            case 'dracula':
              return 'bg-[#21222c] border-[#44475a] text-purple-300';
            case 'nord':
              return 'bg-[#242933] border-[#3b4252] text-cyan-300';
            case 'okaidia':
              return 'bg-[#272822] border-[#3e3d32] text-amber-300';
            case 'oneDark':
              return 'bg-[#21252b] border-[#282c34] text-sky-300';
            case 'vscDarkPlus':
            default:
              return 'bg-slate-900 border-slate-800 text-slate-400';
          }
        })();

        return (
          <div className={`relative my-4 rounded-lg border overflow-hidden text-xs shadow-xs ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'
          }`}>
            <div className={`flex items-center justify-between px-3 py-1.5 border-b font-mono text-[11px] ${themeHeaderBorder}`}>
              <span className="font-semibold lowercase tracking-wide">{displayBadge}</span>
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
              style={getCodeBlockStyle(codeBlockTheme, isDark)}
              language={prismLang}
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
