import React, { useState, useEffect } from 'react';
import {
  History,
  X,
  RotateCcw,
  Trash2,
  Camera,
  Calendar,
  FileText,
  Clock,
  Check,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { DocumentSnapshot, MarkdownDoc } from '../types';
import {
  getSnapshotsForDoc,
  saveSnapshot,
  deleteSnapshot,
  clearSnapshotsForDoc,
} from '../utils/snapshotManager';

export interface RevisionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDoc: MarkdownDoc | null;
  onRestoreContent: (newContent: string) => void;
  isDark?: boolean;
}

export const RevisionHistoryModal: React.FC<RevisionHistoryModalProps> = ({
  isOpen,
  onClose,
  currentDoc,
  onRestoreContent,
  isDark = true,
}) => {
  const [snapshots, setSnapshots] = useState<DocumentSnapshot[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  const loadSnapshots = () => {
    if (!currentDoc?.id) return;
    const list = getSnapshotsForDoc(currentDoc.id);
    setSnapshots(list);
    if (list.length > 0 && (!selectedSnapshotId || !list.some((s) => s.id === selectedSnapshotId))) {
      setSelectedSnapshotId(list[0].id);
    }
  };

  useEffect(() => {
    if (isOpen && currentDoc?.id) {
      loadSnapshots();
      setRestoreSuccess(null);
    }
  }, [isOpen, currentDoc?.id]);

  if (!isOpen || !currentDoc) return null;

  const selectedSnapshot = snapshots.find((s) => s.id === selectedSnapshotId) || null;

  const handleTakeManualSnapshot = () => {
    const created = saveSnapshot(currentDoc, 'manual');
    if (created) {
      loadSnapshots();
      setSelectedSnapshotId(created.id);
    }
  };

  const handleDeleteSnapshot = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSnapshot(id);
    const updated = snapshots.filter((s) => s.id !== id);
    setSnapshots(updated);
    if (selectedSnapshotId === id) {
      setSelectedSnapshotId(updated[0]?.id || null);
    }
  };

  const handleRestore = () => {
    if (!selectedSnapshot) return;
    // 復元前に現在の状態も自動スナップショットとして安全保存
    saveSnapshot(currentDoc, 'auto');
    onRestoreContent(selectedSnapshot.content);
    setRestoreSuccess('このリビジョンに復元しました（復元前の状態もバックアップ済み）');
    setTimeout(() => {
      setRestoreSuccess(null);
      onClose();
    }, 1500);
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const getTriggerBadge = (trigger: DocumentSnapshot['trigger']) => {
    switch (trigger) {
      case 'save':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            💾 保存時
          </span>
        );
      case 'manual':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            📸 手動
          </span>
        );
      case 'auto':
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-500/10 text-slate-400 border border-slate-500/20">
            ⏰ 自動
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div
        className={`w-full max-w-4xl h-[640px] rounded-2xl flex flex-col border shadow-2xl overflow-hidden transition-colors ${
          isDark
            ? 'bg-slate-950 border-slate-800 text-slate-100 shadow-cyan-950/20'
            : 'bg-white border-slate-300 text-slate-900 shadow-slate-400/30'
        }`}
      >
        {/* ヘッダー */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-100/90 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                ローカルバックアップ ＆ リビジョン履歴
                <span className="text-xs font-normal opacity-60">({snapshots.length} 件の履歴)</span>
              </h2>
              <p className="text-[11px] opacity-70 truncate max-w-md">{currentDoc.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTakeManualSnapshot}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
              }`}
              title="現在の状態を手動スナップショットとして即座に記録"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>今すぐ記録</span>
            </button>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 復元成功メッセージトースト */}
        {restoreSuccess && (
          <div className="px-5 py-2.5 bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4" />
            <span>{restoreSuccess}</span>
          </div>
        )}

        {/* メインエリア (2ペイン分割) */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左ペイン: スナップショット一覧 */}
          <div
            className={`w-80 border-r flex flex-col overflow-y-auto shrink-0 ${
              isDark ? 'border-slate-800/80 bg-slate-900/30' : 'border-slate-200 bg-slate-50/50'
            }`}
          >
            {snapshots.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs opacity-50 space-y-2">
                <Clock className="w-8 h-8 opacity-40" />
                <p>保存されたリビジョンはありません</p>
                <p className="text-[10px]">編集・保存時に自動で履歴が蓄積されます</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {snapshots.map((snap) => {
                  const isSelected = snap.id === selectedSnapshotId;
                  const charDiff = snap.charCount - currentDoc.content.length;
                  const diffText =
                    charDiff === 0
                      ? '現在の本文と同一'
                      : charDiff > 0
                      ? `+${charDiff} 文字`
                      : `${charDiff} 文字`;

                  return (
                    <div
                      key={snap.id}
                      onClick={() => setSelectedSnapshotId(snap.id)}
                      className={`p-2.5 rounded-xl cursor-pointer border transition-all text-xs group relative ${
                        isSelected
                          ? isDark
                            ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200 shadow-xs'
                            : 'bg-cyan-50 border-cyan-300 text-cyan-900 shadow-xs'
                          : isDark
                          ? 'border-transparent hover:bg-slate-800/60 text-slate-300'
                          : 'border-transparent hover:bg-slate-200/60 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-mono text-[11px] font-semibold">
                          {formatDate(snap.timestamp)}
                        </span>
                        {getTriggerBadge(snap.trigger)}
                      </div>

                      <div className="flex items-center justify-between text-[11px] opacity-70">
                        <span>{snap.charCount.toLocaleString()} 文字 / {snap.lineCount} 行</span>
                        <span
                          className={`font-mono text-[10px] ${
                            charDiff > 0 ? 'text-emerald-400' : charDiff < 0 ? 'text-rose-400' : 'opacity-60'
                          }`}
                        >
                          {diffText}
                        </span>
                      </div>

                      {/* 削除ボタン */}
                      <button
                        onClick={(e) => handleDeleteSnapshot(e, snap.id)}
                        className="absolute right-2 top-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer"
                        title="このスナップショットを削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 右ペイン: 選択したスナップショットの本文プレビューと復元 */}
          <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
            {selectedSnapshot ? (
              <>
                {/* スナップショット詳細バー */}
                <div
                  className={`px-4 py-2.5 border-b flex items-center justify-between text-xs select-none ${
                    isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-cyan-400">
                      📅 {formatDate(selectedSnapshot.timestamp)}
                    </span>
                    <span className="opacity-60">
                      {selectedSnapshot.charCount.toLocaleString()} 文字 ({selectedSnapshot.lineCount} 行)
                    </span>
                  </div>

                  <button
                    onClick={handleRestore}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer ${
                      isDark
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/30'
                        : 'bg-cyan-700 hover:bg-cyan-600 text-white shadow-cyan-300/40'
                    }`}
                    title="このスナップショットの内容を現在のドキュメントへ復元"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>このリビジョンに復元</span>
                  </button>
                </div>

                {/* 本文プレビュー */}
                <div className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed whitespace-pre-wrap select-text">
                  {selectedSnapshot.content}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center text-xs opacity-40">
                左の一覧からリビジョンを選択してください
              </div>
            )}
          </div>
        </div>

        {/* フッター */}
        <div
          className={`px-5 py-2.5 border-t flex items-center justify-between text-[11px] ${
            isDark ? 'border-slate-800 bg-slate-900/40 text-slate-500' : 'border-slate-200 bg-slate-100/40 text-slate-500'
          }`}
        >
          <span>💡 復元を実行する際、現在の編集内容も自動的に最新スナップショットとしてバックアップされます。</span>
          <button
            onClick={onClose}
            className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
