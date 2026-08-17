import React, { useEffect, useState, useRef } from 'react';
import mermaid from 'mermaid';
import {
  Network,
  Copy,
  Check,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
} from 'lucide-react';

interface MermaidRendererProps {
  chart: string;
  isDark?: boolean;
}

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({ chart, isDark = true }) => {
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(3.0); // デフォルト 300% でどんな図も快適可読
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const renderContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const uniqueId = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'default',
        securityLevel: 'loose',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
        darkMode: isDark,
        themeVariables: {
          fontSize: '15px',
        },
      });

      const trimmedChart = chart.trim();
      if (!trimmedChart) {
        setSvgHtml('');
        setError(null);
        return;
      }

      mermaid
        .render(uniqueId, trimmedChart)
        .then(({ svg }) => {
          if (isMounted) {
            setSvgHtml(svg);
            setError(null);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setError(err?.message || 'Mermaid 構文の解析エラー');
            setSvgHtml('');
          }
        });
    } catch (err: any) {
      if (isMounted) {
        setError(err?.message || 'Mermaid 初期化エラー');
        setSvgHtml('');
      }
    }

    return () => {
      isMounted = false;
      const tempElement = document.getElementById(uniqueId);
      if (tempElement) {
        tempElement.remove();
      }
    };
  }, [chart, isDark]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(chart);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 6.0));
  const handleZoomOut = () => setZoom((prev) => Math.max(Number((prev - 0.25).toFixed(2)), 0.5));
  const handleZoomReset = () => {
    // 300% と 100% をトグル
    setZoom((prev) => (prev === 3.0 ? 1.0 : 3.0));
  };

  return (
    <>
      <div
        className={`relative my-5 rounded-xl border overflow-hidden text-xs shadow-xs transition-colors ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300 shadow-sm'
        }`}
      >
        {/* ツールバー */}
        <div
          className={`flex items-center justify-between px-3.5 py-2 border-b select-none font-sans text-xs ${
            isDark
              ? 'bg-slate-900/90 border-slate-800 text-slate-300'
              : 'bg-slate-100/90 border-slate-300 text-slate-800 font-medium'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            <Network className="w-4 h-4 text-cyan-400" />
            <span className={isDark ? 'text-cyan-300' : 'text-cyan-900'}>Mermaid ダイアグラム</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* ズームコントローラー */}
            <div className="flex items-center gap-1 mr-2 px-1.5 py-0.5 rounded border border-slate-700/50 bg-slate-800/40 text-[11px]">
              <button
                onClick={handleZoomOut}
                className={`p-1 rounded hover:bg-slate-700/60 transition-colors cursor-pointer ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
                title="縮小 (-25%)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleZoomReset}
                className={`px-1.5 py-0.5 font-mono text-[10px] font-bold rounded hover:bg-slate-700/60 transition-colors cursor-pointer ${
                  isDark ? 'text-cyan-300' : 'text-cyan-800'
                }`}
                title="クリックで 300% ↔ 100% 切替"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                className={`p-1 rounded hover:bg-slate-700/60 transition-colors cursor-pointer ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
                title="拡大 (+25%)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 最大化モーダルボタン */}
            <button
              onClick={() => setIsFullscreen(true)}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 shadow-2xs'
              }`}
              title="大画面で拡大表示"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* コピーボタン */}
            <button
              onClick={handleCopyCode}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 shadow-2xs'
              }`}
              title="Mermaid 構文コードをコピー"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-bold">コピー完了</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>コード</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ダイアグラム表示エリア (横スクロール対応 & 確実なズーム適用) */}
        <div className="p-6 overflow-x-auto overflow-y-auto flex justify-center items-center min-h-[140px]">
          {error ? (
            <div className="w-full space-y-2">
              <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-lg text-xs font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>構文エラー（編集中）: {error}</span>
              </div>
              <pre className={`p-3 rounded-lg font-mono text-[11px] overflow-x-auto ${
                isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-700'
              }`}>
                {chart}
              </pre>
            </div>
          ) : svgHtml ? (
            <div
              ref={renderContainerRef}
              style={{
                zoom: zoom,
                WebkitTransformOrigin: 'center center',
              }}
              className="mermaid-svg-container flex justify-center select-none font-sans [&>svg]:max-w-none transition-all duration-100"
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          ) : (
            <div className="text-slate-500 text-xs animate-pulse font-mono">
              Mermaid 図をレンダリング中...
            </div>
          )}
        </div>
      </div>

      {/* 最大化フルスクリーンモーダル */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div
            className={`relative w-full max-w-6xl h-[88vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            {/* モーダルヘッダー */}
            <div
              className={`flex items-center justify-between px-5 py-3.5 border-b select-none ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100/90 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <Network className="w-5 h-5 text-cyan-400" />
                <span>Mermaid ダイアグラム (拡大ビュー)</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 rounded border border-slate-700/60 bg-slate-800/40 text-xs">
                  <button
                    onClick={handleZoomOut}
                    className="p-1 rounded hover:bg-slate-700/60 transition-colors cursor-pointer"
                    title="縮小"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleZoomReset}
                    className="px-2 font-mono text-xs font-bold text-cyan-300 cursor-pointer"
                    title="クリックで 300% ↔ 100% 切替"
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                  <button
                    onClick={handleZoomIn}
                    className="p-1 rounded hover:bg-slate-700/60 transition-colors cursor-pointer"
                    title="拡大"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => setIsFullscreen(false)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600'
                  }`}
                  title="閉じる"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* モーダル本体 (自由スクロール & 巨大表示) */}
            <div className="flex-1 overflow-auto p-8 flex justify-center items-center">
              <div
                style={{
                  zoom: zoom * 1.1,
                }}
                className="mermaid-svg-container flex justify-center select-none [&>svg]:max-w-none transition-all duration-100"
                dangerouslySetInnerHTML={{ __html: svgHtml }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
