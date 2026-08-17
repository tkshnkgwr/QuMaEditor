import { MarkdownDoc, EditorSettings, CustomTemplate } from '../types';
import { isCsvDoc } from './fileSystem';

/** LocalStorage のキー名マッピング定数 */
export const STORAGE_KEYS = {
  DOCS: 'markdown_editor_docs_v1',
  ACTIVE_ID: 'markdown_editor_active_id_v1',
  OPEN_TABS: 'markdown_editor_open_tabs_v1',
  SETTINGS: 'markdown_editor_settings_v1',
  CUSTOM_TEMPLATES: 'markdown_editor_custom_templates_v1',
};

/** デフォルトのエディタ設定値 */
export const DEFAULT_SETTINGS: EditorSettings = {
  fontSize: 15,
  wordWrap: true,
  lineNumbers: true,
  syncScroll: true,
  autoSaveIntervalMs: 3000,
  theme: 'dark',
  headingTheme: 'muted',
  defaultAuthor: '',
};

/** サンプルドキュメントの初期データ */
const SAMPLE_DOCS: MarkdownDoc[] = [
  {
    id: 'doc-welcome',
    title: '👋 WinMarkdown Editor へようこそ',
    content: `# WinMarkdown Editor

Windows 11 のモダンなデザインイメージ・暗色モード対応のフル機能 Markdown エディタです。

---

## 📌 主な機能

1. **リアルタイムプレビュー**
   - 入力と同時にレンダリングされます。
   - 分割、エディタのみ、プレビューのみのモード切り替え対応。

2. **ローカルストレージへの自動保存**
   - 入力停止時にバックグラウンドでリアルタイム保存。
   - ドキュメントの管理・作成・検索が可能。

---

## 📝 サンプルタスク
- [x] 暗色モードデザインの構築
- [x] リアルタイムプレビューと同期スクロール
- [ ] プレゼンテーションモード機能
`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isFavorite: true,
    tags: ['ガイド', 'サンプル'],
  },
  {
    id: 'doc-meeting-notes',
    title: '📝 アプリミーティング議事録',
    content: `# 📝 アプリミーティング議事録

**日時**: ${new Date().toLocaleDateString('ja-JP')} 14:00 - 15:00
**参加者**: 山田, 佐藤, 鈴木

---

## 📌 議題
1. 次期バージョンUI改善
2. ダークモード仕様の確定
`,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    isFavorite: false,
    tags: ['議事録', '仕事'],
  },
];

/**
 * LocalStorage から保存されたドキュメント一覧を取得します。データが存在しない場合は初期サンプルを返します。
 *
 * @returns MarkdownDoc 配列
 */
export function loadStoredDocs(): MarkdownDoc[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DOCS);
    if (!raw) {
      saveStoredDocs(SAMPLE_DOCS);
      return SAMPLE_DOCS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SAMPLE_DOCS;
  } catch (e) {
    console.error('Failed to load stored docs:', e);
    return SAMPLE_DOCS;
  }
}

/**
 * ドキュメント一覧を LocalStorage に永続化保存します。
 * (CSVファイルはセキュリティ・容量配慮のため除外します。また実ファイルパスが存在し保存済みのドキュメントは、
 *  LocalStorage 肥大化防止のため本文データを自動スリム化して保存し QuotaExceededError を防止します)
 *
 * @param docs 保存対象の MarkdownDoc 配列
 */
export function saveStoredDocs(docs: MarkdownDoc[]): void {
  try {
    // CSV ファイルは内部ストレージ保存から完全除外
    const nonCsvDocs = docs.filter((doc) => !isCsvDoc(doc));

    // 実ファイルが存在するドキュメントで本文が 5KB を超えている場合、LocalStorage 上はスリム化
    const optimizedDocs = nonCsvDocs.map((doc) => {
      if (doc.filePath && !doc.isRemote && doc.content.length > 5000) {
        return {
          ...doc,
          content: doc.content.substring(0, 1000) + '\n\n<!-- [STORAGE_SLIMMED_LOAD_FROM_DISK] -->',
        };
      }
      return doc;
    });

    const serialized = JSON.stringify(optimizedDocs);

    // 全体サイズが 2MB を超える場合の自動ガベージコレクション (GC)
    if (serialized.length > 2 * 1024 * 1024) {
      const gcDocs = nonCsvDocs.map((doc) => {
        if (doc.filePath && !doc.isRemote) {
          return {
            ...doc,
            content: doc.content.substring(0, 500) + '\n\n<!-- [STORAGE_SLIMMED_LOAD_FROM_DISK] -->',
          };
        }
        return doc;
      });
      localStorage.setItem(STORAGE_KEYS.DOCS, JSON.stringify(gcDocs));
      console.log('[Storage Optimizer] LocalStorage の肥大化を検知し、保存済み実ファイルのバックアップ用キャッシュを自動スリム化しました。');
      return;
    }

    localStorage.setItem(STORAGE_KEYS.DOCS, serialized);
  } catch (e) {
    console.error('Failed to save docs to localStorage, applying emergency cleanup:', e);
    // QuotaExceededError 発生時の緊急クリーンアップ (全保存済み実ファイルドキュメントのキャッシュ解放)
    try {
      const emergencyDocs = docs
        .filter((doc) => !isCsvDoc(doc))
        .map((doc) => {
          if (doc.filePath) {
            return {
              ...doc,
              content: doc.content.substring(0, 200) + '\n\n<!-- [STORAGE_SLIMMED_LOAD_FROM_DISK] -->',
            };
          }
          return doc;
        });
      localStorage.setItem(STORAGE_KEYS.DOCS, JSON.stringify(emergencyDocs));
    } catch (innerErr) {
      console.error('Emergency storage cleanup failed:', innerErr);
    }
  }
}

/**
 * 現在アクティブなドキュメント ID を LocalStorage から読み込みます。
 *
 * @returns アクティブドキュメント ID 文字列
 */
export function loadActiveDocId(): string {
  try {
    const id = localStorage.getItem(STORAGE_KEYS.ACTIVE_ID);
    if (id) return id;
  } catch (e) {
    // 取得失敗時のフォールバック
  }
  return SAMPLE_DOCS[0].id;
}

/**
 * アクティブなドキュメント ID を LocalStorage に保存します。
 *
 * @param id アクティブドキュメント ID
 */
export function saveActiveDocId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, id);
  } catch (e) {
    console.error('Failed to save active id:', e);
  }
}

/**
 * エディタ設定を LocalStorage から読み込みます。
 *
 * @returns EditorSettings オブジェクト
 */
export function loadSettings(): EditorSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      const loadedInterval = typeof parsed.autoSaveIntervalMs === 'number' ? parsed.autoSaveIntervalMs : 3000;
      const clampedInterval = Math.max(1000, Math.min(10000, loadedInterval));
      return { ...DEFAULT_SETTINGS, ...parsed, autoSaveIntervalMs: clampedInterval };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

/**
 * エディタ設定を LocalStorage に保存します。
 *
 * @param settings 保存対象の EditorSettings オブジェクト
 */
export function saveSettings(settings: EditorSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

/**
 * 現在開いているタブ ID の一覧を LocalStorage から取得します。
 *
 * @param defaultDocs デフォルトのドキュメント配列
 * @returns タブ ID 文字列の配列
 */
export function loadOpenTabIds(defaultDocs: MarkdownDoc[]): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OPEN_TABS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load open tab ids:', e);
  }
  return defaultDocs.map((d) => d.id);
}

/**
 * 開いているタブ ID の一覧を LocalStorage に保存します。
 *
 * @param ids タブ ID 文字列の配列
 */
export function saveOpenTabIds(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.OPEN_TABS, JSON.stringify(ids));
  } catch (e) {
    console.error('Failed to save open tab ids:', e);
  }
}

/**
 * カスタムテンプレート一覧を LocalStorage から読み込みます。
 *
 * @returns CustomTemplate 配列
 */
export function loadCustomTemplates(): CustomTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_TEMPLATES);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load custom templates:', e);
  }
  return [];
}

/**
 * カスタムテンプレート一覧を LocalStorage に保存します。
 *
 * @param templates 保存対象の CustomTemplate 配列
 */
export function saveCustomTemplates(templates: CustomTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TEMPLATES, JSON.stringify(templates));
  } catch (e) {
    console.error('Failed to save custom templates:', e);
  }
}
