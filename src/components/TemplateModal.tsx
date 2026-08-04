// UPDATE 2026-08-04: ユーザーによるテンプレートの新規作成・編集・削除・現在ドキュメントのテンプレート化に対応
import React, { useState, useEffect } from 'react';
import { X, Sparkles, FileText, Code, Calendar, LayoutGrid, Plus, Trash2, Edit3, Save, BookmarkPlus, Check } from 'lucide-react';
import { CustomTemplate, MarkdownDoc } from '../types';
import { loadCustomTemplates, saveCustomTemplates } from '../utils/storage';
import { logger } from '../utils/logger';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (title: string, content: string) => void;
  currentDoc?: MarkdownDoc;
  isDark?: boolean;
}

const DEFAULT_TEMPLATES: CustomTemplate[] = [
  {
    id: 'weekly-report',
    title: '週報・業務報告',
    description: '今週の成果、課題、来週の計画を整理するフォーマット',
    content: `# 📊 週報 (${new Date().toLocaleDateString('ja-JP')}週)

**報告者**: 担当者名
**所属**: 開発チーム

---

## 🚀 今週の主な成果
- [x] 機能Aの実装および動作確認完了
- [x] バグFIX (#102, #105)
- [ ] ドキュメント更新作業

## 📈 進捗状況 (Progress)
| タスク名 | 予定 | 実績 | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| UIデザイン作成 | 2d | 2d | 完了 | - |
| API連携実装 | 3d | 3.5d | 完了 | 一部追加対応あり |
| テスト実行 | 1d | 0.5d | 進行中 | 残り明日完了予定 |

## 💡 課題・相談事項 (Keep / Problem / Try)
> **課題**: 外部ライブラリ更新によるビルド速度の低下
> **対策**: 次週キャッシュ設定の見直しを行う。

## 📅 来週の予定
1. 新機能Bの設計とレビュー
2. パフォーマンステスト実施
3. リリース準備
`,
  },
  {
    id: 'tech-spec',
    title: '技術仕様書 (Technical Spec)',
    description: 'システム設計、API仕様、データモデルをまとめる設計テンプレート',
    content: `# 💻 技術仕様書: 新規モジュール設計

**作成日**: ${new Date().toLocaleDateString('ja-JP')}
**ステータス**: 草案 (Draft)

---

## 1. 概要 (Overview)
本ドキュメントは、新モジュールのアーキテクチャおよびインターフェース仕様を定義します。

## 2. 構成図 & データ構造 (Data Architecture)
\`\`\`typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  created_at: number;
}
\`\`\`

## 3. API インターフェース (API Endpoint)
| メソッド | パス | 説明 | 認証 |
| --- | --- | --- | --- |
| GET | \`/api/v1/users\` | ユーザー一覧取得 | 要 |
| POST | \`/api/v1/users\` | ユーザー新規作成 | 要 |

## 4. セキュリティ・運用上の注意事項
- [ ] APIキーの環境変数管理の徹底
- [ ] リクエストレート制限 (100 req/min) の有効化
`,
  },
  {
    id: 'meeting-notes',
    title: 'ミーティング議事録',
    description: '議題、決定事項、アクションアイテムを明確にする議事録',
    content: `# 📝 ミーティング議事録

**日時**: ${new Date().toLocaleDateString('ja-JP')} 10:00 - 11:00
**場所**: オンライン会議室
**参加者**: 山田, 佐藤, 鈴木

---

## 📌 議題 (Agenda)
1. 前回のネクストアクション確認
2. 新プロジェクトの進捗確認
3. デザイン方針の調整

## ✅ 決定事項 (Decisions)
- [x] UIデザインはダークモードベースで統一する
- [x] リリース予定日を来月15日に決定

## 🎯 アクションアイテム (Action Items)
- [ ] 山田: ワイヤーフレーム修正 (期日: 8/10)
- [ ] 佐藤: バックエンドAPIの検証 (期日: 8/12)
- [ ] 鈴木: テスト仕様書作成 (期日: 8/15)
`,
  },
  {
    id: 'task-matrix',
    title: 'アイゼンハワー・タスクマトリクス',
    description: '緊急度・重要度で優先順位を整理するタスク管理テンプレート',
    content: `# 🎯 タスク優先順位マトリクス

---

## 🔥 1. 重要かつ緊急 (Do First)
- [ ] システムエラーの修正
- [ ] クライアントへの急ぎの返信

## 📅 2. 重要だが緊急ではない (Schedule)
- [ ] 中長期プロジェクトのロードマップ作成
- [ ] コードのリファクタリング
- [ ] ドキュメント整備

## ⚡ 3. 緊急だが重要ではない (Delegate)
- [ ] 問い合わせメールの初期分類
- [ ] 定例会議のスケジューリング

## 🗑️ 4. 緊急でも重要でもない (Don't Do)
- [ ] 不要な雑務の自動化・削減
`,
  },
];

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  currentDoc,
  isDark = true,
}) => {
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<CustomTemplate>>({});

  useEffect(() => {
    if (isOpen) {
      setCustomTemplates(loadCustomTemplates());
      setIsEditing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 編集保存処理
  const handleSaveTemplate = () => {
    if (!editingTemplate.title?.trim() || !editingTemplate.content?.trim()) {
      alert('タイトルとテンプレート本文を入力してください。');
      return;
    }

    let updatedList: CustomTemplate[];
    if (editingTemplate.id) {
      // 編集更新
      updatedList = customTemplates.map((t) =>
        t.id === editingTemplate.id ? ({ ...t, ...editingTemplate, isCustom: true } as CustomTemplate) : t
      );
      logger.info(`[テンプレート更新] "${editingTemplate.title}" を更新しました`);
    } else {
      // 新規作成
      const newTpl: CustomTemplate = {
        id: `custom-tpl-${Date.now()}`,
        title: editingTemplate.title.trim(),
        description: editingTemplate.description?.trim() || 'カスタム作成テンプレート',
        content: editingTemplate.content,
        isCustom: true,
      };
      updatedList = [newTpl, ...customTemplates];
      logger.info(`[テンプレート登録] 新規カスタムテンプレート "${newTpl.title}" を作成しました`);
    }

    setCustomTemplates(updatedList);
    saveCustomTemplates(updatedList);
    setIsEditing(false);
    setEditingTemplate({});
    setActiveTab('custom');
  };

  // 削除処理
  const handleDeleteTemplate = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`テンプレート「${title}」を削除してもよろしいですか？`)) {
      const updatedList = customTemplates.filter((t) => t.id !== id);
      setCustomTemplates(updatedList);
      saveCustomTemplates(updatedList);
      logger.info(`[テンプレート削除] "${title}" を削除しました`);
    }
  };

  // 現在のドキュメントをテンプレート化
  const handleSaveCurrentDocAsTemplate = () => {
    if (!currentDoc) return;
    setEditingTemplate({
      title: `${currentDoc.title} (テンプレート)`,
      description: '現在のドキュメントから作成したカスタムテンプレート',
      content: currentDoc.content,
    });
    setIsEditing(true);
    setActiveTab('custom');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div
        className={`w-full max-w-2xl rounded-xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
        }`}
      >
        {/* ヘッダー */}
        <div className={`flex items-center justify-between px-5 py-3.5 border-b ${
          isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-sm">テンプレート管理 & 新規作成</h2>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${
            isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600'
          }`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* タブナビゲーション */}
        <div className={`flex items-center justify-between px-5 border-b text-xs ${
          isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-100/50'
        }`}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setActiveTab('preset'); setIsEditing(false); }}
              className={`py-2.5 font-medium border-b-2 transition-colors ${
                activeTab === 'preset' && !isEditing
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              標準プリセット (4種)
            </button>
            <button
              onClick={() => { setActiveTab('custom'); setIsEditing(false); }}
              className={`py-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'custom' && !isEditing
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>カスタムテンプレート</span>
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">
                {customTemplates.length}
              </span>
            </button>
          </div>

          {!isEditing && (
            <div className="flex items-center gap-2 py-1">
              {currentDoc && (
                <button
                  onClick={handleSaveCurrentDocAsTemplate}
                  className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                  title="開いているドキュメントをテンプレート化"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  現在のドキュメントをテンプレート登録
                </button>
              )}
              <button
                onClick={() => {
                  setEditingTemplate({ title: '', description: '', content: '' });
                  setIsEditing(true);
                  setActiveTab('custom');
                }}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-600 text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                新規作成
              </button>
            </div>
          )}
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* 編集モード画面 */}
          {isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-cyan-500/30">
                <span className="font-semibold text-xs text-cyan-400 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4" />
                  {editingTemplate.id ? 'テンプレートを編集' : '新規カスタムテンプレート作成'}
                </span>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  キャンセル
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">テンプレート名 *</label>
                <input
                  type="text"
                  value={editingTemplate.title || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                  placeholder="例: 日報フォーマット, 仕様書案"
                  className={`w-full px-3 py-1.5 text-xs rounded border focus:outline-none focus:border-cyan-500 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">簡単な説明</label>
                <input
                  type="text"
                  value={editingTemplate.description || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  placeholder="例: 毎日の業務進捗および所感を記入するテンプレート"
                  className={`w-full px-3 py-1.5 text-xs rounded border focus:outline-none focus:border-cyan-500 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">テンプレート本文 (Markdown) *</label>
                <textarea
                  value={editingTemplate.content || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                  rows={8}
                  placeholder="# タイトル&#10;&#10;## セクション1&#10;- 項目A"
                  className={`w-full p-3 text-xs font-mono rounded border focus:outline-none focus:border-cyan-500 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs rounded border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="px-4 py-1.5 text-xs rounded bg-cyan-500 hover:bg-cyan-600 text-white font-medium flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  保存する
                </button>
              </div>
            </div>
          ) : activeTab === 'preset' ? (
            /* 標準プリセット表示 */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DEFAULT_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => {
                    onSelectTemplate(tpl.title, tpl.content);
                    onClose();
                  }}
                  className={`group p-3.5 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                    isDark
                      ? 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 hover:border-cyan-500/50'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-cyan-500/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 font-medium text-xs group-hover:text-cyan-400 mb-1">
                      <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{tpl.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{tpl.description}</p>
                  </div>
                  <div className="mt-3 text-[10px] text-cyan-400 group-hover:translate-x-1 transition-transform font-medium">
                    このテンプレートを使用 →
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* カスタムテンプレート表示 */
            <div>
              {customTemplates.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs space-y-2">
                  <p>登録されたカスタムテンプレートはありません。</p>
                  <p className="text-[11px] text-slate-400">
                    右上ボタンから新規作成するか、「現在のドキュメントをテンプレート登録」で保存できます。
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {customTemplates.map((tpl) => (
                    <div
                      key={tpl.id}
                      onClick={() => {
                        onSelectTemplate(tpl.title, tpl.content);
                        onClose();
                      }}
                      className={`group p-3.5 rounded-lg border cursor-pointer transition-all flex flex-col justify-between relative ${
                        isDark
                          ? 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 hover:border-cyan-500/50'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-cyan-500/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-medium text-xs group-hover:text-cyan-400 truncate pr-12">
                            {tpl.title}
                          </span>
                          <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTemplate(tpl);
                                setIsEditing(true);
                              }}
                              className="p-1 rounded hover:bg-cyan-500/20 text-cyan-400"
                              title="編集"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteTemplate(tpl.id, tpl.title, e)}
                              className="p-1 rounded hover:bg-rose-500/20 text-rose-400"
                              title="削除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">{tpl.description}</p>
                      </div>
                      <div className="mt-3 text-[10px] text-cyan-400 group-hover:translate-x-1 transition-transform font-medium">
                        このカスタムテンプレートを使用 →
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className={`px-5 py-2.5 text-[11px] border-t flex justify-between items-center ${
          isDark ? 'border-slate-800 bg-slate-950/50 text-slate-400' : 'border-slate-200 bg-slate-100 text-slate-500'
        }`}>
          <span>※ 作成したテンプレートはブラウザの保存領域に安全に保存されます。</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
