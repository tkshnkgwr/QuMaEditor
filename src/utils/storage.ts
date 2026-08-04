import { MarkdownDoc, EditorSettings, CustomTemplate } from '../types';

const STORAGE_KEYS = {
  DOCS: 'markdown_editor_docs_v1',
  ACTIVE_ID: 'markdown_editor_active_id_v1',
  OPEN_TABS: 'markdown_editor_open_tabs_v1',
  SETTINGS: 'markdown_editor_settings_v1',
  CUSTOM_TEMPLATES: 'markdown_editor_custom_templates_v1',
};

// UPDATE 2026-08-04: 自動保存待機時間を最小1秒(1000ms)、最大10秒(10000ms)、デフォルト3秒(3000ms)に設定
export const DEFAULT_SETTINGS: EditorSettings = {
  fontSize: 15,
  wordWrap: true,
  lineNumbers: true,
  syncScroll: true,
  autoSaveIntervalMs: 3000,
  theme: 'dark',
};

const SAMPLE_DOCS: MarkdownDoc[] = [
  {
    id: 'doc-welcome',
    title: '👋 WinMarkdown Editor へようこそ',
    content: `# WinMarkdown Editor

Windows 11のモダンなデザインをイメージした、暗色モード対応のフル機能Markdownエディタです。

---

## 🔥 主な機能

1. **リアルタイム・ライブプレビュー**
   - 入力と同時に美しくレンダリングされます。
   - 分割表示、エディタのみ、プレビューのみのモード切替対応。

2. **ローカルストレージへの自動保存**
   - 入力中にバックグラウンドでリアルタイム自動保存。
   - 複数ドキュメントの管理・作成・検索が可能。

3. **入力補助ツールバー & ショートカットキー**
   - **太字** (\`Ctrl + B\`)、*斜体* (\`Ctrl + I\`)、<u>下線</u> (\`Ctrl + U\`)、~~打ち消し線~~
   - **箇条書きリスト** / **項番付きリスト** / **タスクリスト**
   - テーブル作成ウィザード

4. **画像ドラッグ＆ドロップ UI**
   - 画像ファイルを直接ドラッグ＆ドロップして即座にインライン挿入！

---

## 📝 入力要素のサンプル

### 1. タスクリスト (Task List)
- [x] 暗色モードデザインの構築
- [x] リアルタイムプレビューと同期スクロール
- [x] 画像ドラッグ＆ドロップ対応
- [ ] プレゼンテーションモード機能

### 2. 表組 (Tables)
| 機能 | 対応状況 | 備考 |
| --- | :---: | --- |
| 太字・斜体 | ✅ | ショートカットキー対応 |
| 下線 / 消し線 | ✅ | HTML / GFM対応 |
| リスト自動補全 | ✅ | Enterキーで自動継続 |
| 表組ウィザード | ✅ | 行・列数の自由指定 |

### 3. コードブロック (Code Highlight)
\`\`\`typescript
interface UserSetting {
  theme: 'dark' | 'light';
  autoSave: boolean;
}

function initEditor(): void {
  console.log("WinMarkdown Editor Initialized.");
}
\`\`\`

> 💡 **ヒント**: ツールバーの各種ボタンを使って、ワンクリックでMarkdown記法を挿入できます。
`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isFavorite: true,
    tags: ['ガイド', 'サンプル'],
  },
  {
    id: 'doc-meeting-notes',
    title: '📝 アプリ企画ミーティング議事録',
    content: `# 📝 アプリ企画ミーティング議事録

**日時**: ${new Date().toLocaleDateString('ja-JP')} 14:00 - 15:00
**参加者**: 山田, 佐藤, 鈴木

---

## 📌 議題
1. 次期バージョンのUI改善案
2. ダークモード仕様の確定
3. 開発スケジュール確認

## 💡 決定事項
- [x] ウィンドウ風タイトルバーとステータスバーを採用
- [x] ドラッグ＆ドロップによる画像挿入機能を実装
- [ ] プレビュー表示の印刷・PDF出力ボタンを追加

## 📊 スケジュール案
| フェーズ | 担当者 | 期限 | 状態 |
| --- | --- | --- | --- |
| 要件定義 | 山田 | 8/10 | 完了 |
| デザイン設計 | 佐藤 | 8/18 | 進行中 |
| 実装・テスト | 鈴木 | 8/28 | 未着手 |
`,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    isFavorite: false,
    tags: ['議事録', '仕事'],
  },
  {
    id: 'doc-remote-sample',
    title: '🌐 [リモート] 外部参照仕様ドキュメント (自動保存OFF)',
    content: `# 🌐 [リモートファイル] 仕様動作サンプル

このドキュメントは **リモートサーバー/外部URLを参照しているドキュメント** のサンプルです。

---

### 🔒 リモートファイルの自動保存仕様
- **ローカルファイル**: 入力後1〜10秒（設定値）のキー入力停止後に、LocalStorageへ自動保存されます。
- **リモートファイル**: 意図しない上書きや競合を防ぐため、**自動保存は無効化**されています。
- タイトルバーには \`[リモート (自動保存OFF)]\` バッジが表示され、編集を行っても自動保存されず、ヘッダーの「動作ログ」にてスキップ履歴が自動で記録されます。

---

### 📝 テスト方法
1. ここで文章を編集してみてください。
2. タイトルバー右上のステータスに \`[リモート (自動保存OFF)]\` と表示されます。
3. ヘルプメニュー ➔ **「動作ログ表示」** を開くと、自動保存スキップログを確認できます。
`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isFavorite: false,
    tags: ['リモート', '仕様'],
    isRemote: true,
    remoteUrl: 'https://raw.githubusercontent.com/example/remote-doc.md',
  },
];

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

export function saveStoredDocs(docs: MarkdownDoc[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DOCS, JSON.stringify(docs));
  } catch (e) {
    console.error('Failed to save docs to localStorage:', e);
  }
}

export function loadActiveDocId(): string {
  try {
    const id = localStorage.getItem(STORAGE_KEYS.ACTIVE_ID);
    if (id) return id;
  } catch (e) {
    // 取得失敗時のフォールバック
  }
  return SAMPLE_DOCS[0].id;
}

export function saveActiveDocId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, id);
  } catch (e) {
    console.error('Failed to save active id:', e);
  }
}

export function loadSettings(): EditorSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      const loadedInterval = typeof parsed.autoSaveIntervalMs === 'number' ? parsed.autoSaveIntervalMs : 3000;
      // UPDATE 2026-08-04: 設定の読み込み時に自動保存待機時間が1000ms〜10000msの範囲内に収まるよう補正
      const clampedInterval = Math.max(1000, Math.min(10000, loadedInterval));
      return { ...DEFAULT_SETTINGS, ...parsed, autoSaveIntervalMs: clampedInterval };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: EditorSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

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

export function saveOpenTabIds(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.OPEN_TABS, JSON.stringify(ids));
  } catch (e) {
    console.error('Failed to save open tab ids:', e);
  }
}

// UPDATE 2026-08-04: カスタムテンプレートのローカルストレージ永続化管理
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

export function saveCustomTemplates(templates: CustomTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TEMPLATES, JSON.stringify(templates));
  } catch (e) {
    console.error('Failed to save custom templates:', e);
  }
}

