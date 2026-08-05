import React, { useRef, useState, useEffect } from 'react';
import { FileText, X, Plus, Star, GitCompare } from 'lucide-react';
import { MarkdownDoc, SaveStatus } from '../types';

// UPDATE 2026-08-04: saveStatus の型を SaveStatus に統一し編集中状態に対応
interface TabBarProps {
  docs: MarkdownDoc[];
  openTabIds: string[];
  activeDocId: string;
  saveStatus: SaveStatus;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onCloseOtherTabs: (id: string) => void;
  onNewDoc: () => void;
  onOpenDiffModal?: () => void;
  isDark?: boolean;
}

export const TabBar: React.FC<TabBarProps> = ({
  docs,
  openTabIds,
  activeDocId,
  saveStatus,
  onSelectTab,
  onCloseTab,
  onCloseOtherTabs,
  onNewDoc,
  onOpenDiffModal,
  isDark = true,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  // マウスホイールでの横スクロールサポート
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  // 右クリックコンテキストメニュー外クリック検知
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ id, x: e.clientX, y: e.clientY });
  };

  // アクティブなタブが画面外の場合、スクロール位置を調整
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeTabEl = scrollContainerRef.current.querySelector(`[data-tab-id="${activeDocId}"]`);
      if (activeTabEl) {
        activeTabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [activeDocId]);

  const docMap = new Map(docs.map((d) => [d.id, d]));

  return (
    <div
      className={`h-9 border-b select-none flex items-center justify-between z-20 shrink-0 text-xs transition-colors print:hidden ${
        isDark
          ? 'bg-slate-950/90 border-slate-800 text-slate-300'
          : 'bg-slate-200/90 border-slate-300 text-slate-700'
      }`}
    >
      {/* タブスクロールエリア */}
      <div
        ref={scrollContainerRef}
        onWheel={handleWheel}
        className="flex-1 flex items-center overflow-x-auto h-full pl-1 pr-2 gap-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {openTabIds.map((id) => {
          const doc = docMap.get(id);
          if (!doc) return null;
          const isActive = id === activeDocId;
          const isUnsaved = isActive && saveStatus === 'unsaved';

          return (
            <div
              key={id}
              data-tab-id={id}
              onClick={() => onSelectTab(id)}
              onMouseDown={(e) => {
                // ホイールクリック (中クリック) でタブを閉じる
                if (e.button === 1) {
                  e.preventDefault();
                  onCloseTab(id);
                }
              }}
              onContextMenu={(e) => handleContextMenu(e, id)}
              className={`group relative h-7 max-w-[200px] min-w-[120px] px-2.5 rounded-t-md cursor-pointer flex items-center justify-between gap-1.5 transition-all text-xs font-sans shrink-0 border-t border-x ${
                isActive
                  ? isDark
                    ? 'bg-slate-900 text-slate-100 border-slate-700/80 border-t-cyan-400 font-medium shadow-sm'
                    : 'bg-white text-slate-900 border-slate-300 border-t-cyan-600 font-semibold shadow-sm'
                  : isDark
                    ? 'bg-slate-950/40 text-slate-400 border-transparent hover:bg-slate-900/60 hover:text-slate-200'
                    : 'bg-slate-200/50 text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900'
              }`}
              title={doc.title || '無題のドキュメント'}
            >
              {/* アイコンとタイトル */}
              <div className="flex items-center gap-1.5 truncate min-w-0">
                {doc.isFavorite ? (
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                ) : (
                  <FileText className={`w-3 h-3 shrink-0 ${isActive ? 'text-cyan-500' : 'opacity-60'}`} />
                )}
                <span className="truncate text-[11px]">{doc.title || '無題のドキュメント'}</span>
              </div>

              {/* 閉じるボタン または 未保存インジケータ */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(id);
                }}
                className={`p-0.5 rounded transition-all opacity-80 hover:opacity-100 shrink-0 ${
                  isDark ? 'hover:bg-slate-800 hover:text-rose-400' : 'hover:bg-slate-200 hover:text-rose-600'
                }`}
                title="タブを閉じる"
              >
                {isUnsaved ? (
                  <div className="w-2 h-2 rounded-full bg-amber-400 group-hover:hidden my-1 mx-1" />
                ) : null}
                <X className={`w-3 h-3 ${isUnsaved ? 'hidden group-hover:block' : ''}`} />
              </button>
            </div>
          );
        })}

        {/* 新規タブ追加ボタン */}
        <button
          onClick={onNewDoc}
          className={`p-1 rounded transition-colors shrink-0 ml-1 ${
            isDark
              ? 'hover:bg-slate-800 text-slate-400 hover:text-cyan-400'
              : 'hover:bg-slate-300 text-slate-600 hover:text-cyan-700'
          }`}
          title="新規ドキュメントを開く (Ctrl+N)"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 右側アクション: 差分比較ボタン */}
      {onOpenDiffModal && (
        <div className="pr-2 flex items-center shrink-0">
          <button
            onClick={onOpenDiffModal}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              isDark
                ? 'bg-slate-900 border border-slate-800 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300'
                : 'bg-white border border-slate-300 hover:bg-slate-100 text-cyan-700 hover:text-cyan-800 shadow-2xs'
            }`}
            title="直近・別のタブとリアルタイムテキスト差分を比較 (Ctrl+Shift+D)"
          >
            <GitCompare className="w-3.5 h-3.5 text-cyan-500" />
            <span className="hidden sm:inline">差分比較</span>
          </button>
        </div>
      )}

      {/* 右クリックコンテキストメニュー */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className={`fixed rounded-md shadow-2xl border py-1 z-50 text-xs w-48 ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          {onOpenDiffModal && (
            <button
              onClick={() => {
                onOpenDiffModal();
                setContextMenu(null);
              }}
              className={`w-full px-3 py-1.5 text-left flex items-center justify-between border-b ${
                isDark ? 'hover:bg-slate-800 border-slate-800 text-cyan-400' : 'hover:bg-slate-100 border-slate-200 text-cyan-700'
              }`}
            >
              <span>タブ差分を比較...</span>
              <GitCompare className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => {
              onCloseTab(contextMenu.id);
              setContextMenu(null);
            }}
            className={`w-full px-3 py-1.5 text-left flex items-center justify-between ${
              isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
            }`}
          >
            <span>タブを閉じる</span>
            <X className="w-3 h-3 opacity-60" />
          </button>
          <button
            onClick={() => {
              onCloseOtherTabs(contextMenu.id);
              setContextMenu(null);
            }}
            className={`w-full px-3 py-1.5 text-left ${
              isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
            }`}
          >
            他のタブをすべて閉じる
          </button>
        </div>
      )}
    </div>
  );
};

