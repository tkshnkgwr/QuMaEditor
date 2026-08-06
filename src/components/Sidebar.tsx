import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Star,
  Tag,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  FilePlus,
  Download,
  Globe,
  Zap,
  FolderOpen,
} from 'lucide-react';
import { MarkdownDoc } from '../types';
import { indexDocumentsNative, searchDocumentsNative, SearchHit, openFolderNative } from '../utils/tauriNative';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  docs: MarkdownDoc[];
  activeDocId: string;
  onSelectDoc: (id: string) => void;
  onNewDoc: () => void;
  onDeleteDoc: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenTemplates: () => void;
  isDark?: boolean;
}

/**
 * 検索キーワードに一致する箇所を黄色く強調表示するヘルパーコンポーネント
 */
const HighlightText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  const trimmedQuery = query.trim().replace(/^#/, '');
  if (!trimmedQuery) {
    return <>{text}</>;
  }

  const parts = text.split(new RegExp(`(${trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === trimmedQuery.toLowerCase() ? (
          <mark key={i} className="bg-amber-300 text-slate-950 font-bold px-0.5 rounded shadow-2xs">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  docs,
  activeDocId,
  onSelectDoc,
  onNewDoc,
  onDeleteDoc,
  onToggleFavorite,
  onOpenTemplates,
  isDark = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'favorites'>('all');
  const [nativeHits, setNativeHits] = useState<SearchHit[] | null>(null);

  // Rust 転置インデックスへのドキュメント群（本文＋タグ情報）登録
  useEffect(() => {
    const searchInputs = docs.map((d) => ({
      id: d.id,
      title: d.title,
      content: `${d.content}\nTags: ${d.tags ? d.tags.map((t) => `#${t}`).join(' ') : ''}`,
    }));
    indexDocumentsNative(searchInputs);
  }, [docs]);

  // Rust ネイティブ全文検索
  useEffect(() => {
    let isMounted = true;
    const q = searchQuery.trim();
    if (q.length > 0) {
      searchDocumentsNative(q).then((hits) => {
        if (isMounted) {
          setNativeHits(hits);
        }
      });
    } else {
      setNativeHits(null);
    }
    return () => {
      isMounted = false;
    };
  }, [searchQuery]);

  if (!isOpen) return null;

  const normalizedQuery = searchQuery.trim().toLowerCase().replace(/^#/, '');

  const filteredDocs = docs.filter((doc) => {
    const matchesTags = (doc.tags || []).some((t) => t.toLowerCase().includes(normalizedQuery));
    const matchesSearch =
      doc.title.toLowerCase().includes(normalizedQuery) ||
      doc.content.toLowerCase().includes(normalizedQuery) ||
      matchesTags;
    const matchesFilter = filterMode === 'all' || (filterMode === 'favorites' && doc.isFavorite);
    return matchesSearch && matchesFilter;
  });

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <aside className={`w-64 md:w-72 border-r flex flex-col h-full shrink-0 select-none z-20 transition-colors print:hidden ${
      isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
    }`}>
      {/* サイドバーヘッダー */}
      <div className={`p-3 border-b flex items-center justify-between gap-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-500" />
          <span className={`font-semibold text-xs tracking-wider uppercase ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>ドキュメント一覧</span>
        </div>
        <button
          onClick={onNewDoc}
          className="bg-cyan-600 hover:bg-cyan-500 text-white p-1.5 rounded transition-all flex items-center gap-1 text-xs font-medium shadow-xs"
          title="新規ドキュメント作成"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>作成</span>
        </button>
      </div>

      {/* 検索入力 (キーワード & #タグ検索対応) */}
      <div className={`p-2.5 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
        <div className="relative">
          <Search className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="キーワードや #タグ 名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full text-xs rounded pl-8 pr-3 py-1.5 focus:outline-none border transition-colors ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-cyan-500/80 placeholder:text-slate-500'
                : 'bg-white border-slate-300 text-slate-800 focus:border-cyan-600 placeholder:text-slate-400'
            }`}
          />
        </div>

        {/* フィルター切り替えタブ */}
        <div className="flex items-center gap-1 mt-2 text-[11px]">
          <button
            onClick={() => setFilterMode('all')}
            className={`flex-1 py-1 rounded font-medium transition-colors ${
              filterMode === 'all'
                ? isDark ? 'bg-slate-800 text-cyan-400' : 'bg-slate-200 text-cyan-700 font-semibold'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            すべて ({docs.length})
          </button>
          <button
            onClick={() => setFilterMode('favorites')}
            className={`flex-1 py-1 rounded font-medium transition-colors flex items-center justify-center gap-1 ${
              filterMode === 'favorites'
                ? isDark ? 'bg-slate-800 text-amber-400' : 'bg-slate-200 text-amber-700 font-semibold'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            お気に入り ({docs.filter((d) => d.isFavorite).length})
          </button>
        </div>
      </div>

      {/* ドキュメントリストまたは Rust 全文検索ヒット結果 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {nativeHits && nativeHits.length > 0 ? (
          <div className="space-y-1.5">
            <div className="px-2 py-1 text-[10px] font-semibold text-cyan-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400 fill-amber-400" /> Rust 全文検索ヒット
              </span>
              <span>{nativeHits.length} 件</span>
            </div>
            {nativeHits.map((hit, idx) => (
              <div
                key={idx}
                onClick={() => onSelectDoc(hit.doc_id)}
                className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                  activeDocId === hit.doc_id
                    ? isDark ? 'bg-slate-800 border-cyan-500/80 text-cyan-300' : 'bg-cyan-50/80 border-cyan-400 text-cyan-900 font-medium'
                    : isDark ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80' : 'bg-white border-slate-200 hover:bg-slate-100'
                }`}
              >
                {/* 対象ファイル名の高コントラスト視認性表示 */}
                <div className={`font-bold text-xs truncate mb-1 flex items-center gap-1.5 ${
                  isDark ? 'text-cyan-300' : 'text-cyan-900'
                }`}>
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    <HighlightText text={hit.doc_title || '無題'} query={searchQuery} />
                  </span>
                </div>
                {/* 該当行とキーワードハイライト */}
                <div className={`text-[11px] font-mono leading-relaxed pl-1 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  <span className={`font-semibold mr-1 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>L{hit.line_number}:</span>
                  <HighlightText text={hit.line_text} query={searchQuery} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className={`p-6 text-center text-xs select-none ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            該当するドキュメントは見つかりません
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isActive = doc.id === activeDocId;
            return (
              <div
                key={doc.id}
                onClick={() => onSelectDoc(doc.id)}
                className={`group relative p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                  isActive
                    ? isDark
                      ? 'bg-slate-900 border-cyan-500/80 text-slate-100 shadow-xs'
                      : 'bg-white border-cyan-600 text-slate-900 shadow-xs font-medium'
                    : isDark
                    ? 'border-transparent text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                    : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0 font-medium">
                    {doc.isRemote ? (
                      <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    ) : (
                      <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-400' : isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    )}
                    <span className="truncate">
                      <HighlightText text={doc.title || '無題のドキュメント'} query={searchQuery} />
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {doc.filePath && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (doc.filePath) {
                            await openFolderNative(doc.filePath);
                          }
                        }}
                        className="p-1 rounded hover:bg-emerald-500/20 text-slate-500 hover:text-emerald-400 transition-colors"
                        title={`保存先フォルダをエクスプローラーで開く:\n${doc.filePath}`}
                      >
                        <FolderOpen className="w-3 h-3 text-emerald-400" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(doc.id);
                      }}
                      className={`p-1 rounded hover:bg-slate-800 transition-colors ${doc.isFavorite ? 'text-amber-400' : 'text-slate-500'}`}
                      title={doc.isFavorite ? 'お気に入り解除' : 'お気に入りに追加'}
                    >
                      <Star className={`w-3 h-3 ${doc.isFavorite ? 'fill-amber-400' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDoc(doc.id);
                      }}
                      className="p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                      title="LocalStorage から削除 (下書き破棄)"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* 本文プレビュー抜粋 & キーワードハイライト */}
                <p className={`text-[11px] truncate mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                  <HighlightText
                    text={doc.content.replace(/^---[\s\S]*?---\s*/, '').trim() || '空のドキュメント'}
                    query={searchQuery}
                  />
                </p>

                {/* メタ情報 (日時・保存種別バッジ・タグ) */}
                <div className={`flex items-center justify-between text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 opacity-70" />
                      {formatDate(doc.updatedAt || doc.createdAt)}
                    </span>
                    {/* 保存種別バッジ */}
                    {doc.filePath ? (
                      <span className={`px-1.5 py-0.2 text-[9px] rounded font-medium border ${
                        isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`} title={`実ファイル: ${doc.filePath}`}>
                        📁 PCファイル
                      </span>
                    ) : doc.isRemote ? (
                      <span className={`px-1.5 py-0.2 text-[9px] rounded font-medium border ${
                        isDark ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-800'
                      }`} title="リモート取得ファイル">
                        🌐 リモート
                      </span>
                    ) : (
                      <span className={`px-1.5 py-0.2 text-[9px] rounded font-medium border ${
                        isDark ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-800'
                      }`} title="LocalStorage アプリ内保存のみ">
                        📦 LocalStorage
                      </span>
                    )}
                  </div>

                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex items-center gap-1 overflow-hidden max-w-[120px]">
                      <Tag className="w-3 h-3 text-cyan-500 shrink-0" />
                      <span className="truncate text-cyan-500 font-semibold">
                        {doc.tags.map((t) => `#${t}`).join(' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* フッター */}
      <div className={`p-2.5 border-t text-[11px] flex items-center justify-between ${isDark ? 'border-slate-800/80 text-slate-500' : 'border-slate-200 text-slate-500'}`}>
        <button
          onClick={onOpenTemplates}
          className={`flex items-center gap-1.5 transition-colors ${isDark ? 'hover:text-cyan-400' : 'hover:text-cyan-700'}`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
          <span>テンプレート集</span>
        </button>
        <span className="font-mono text-[10px]">{docs.length} 件</span>
      </div>
    </aside>
  );
};
