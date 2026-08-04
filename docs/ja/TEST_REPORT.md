# テスト実行結果報告書 (TEST_REPORT)

## 1. テスト実施概要
- **実施日**: 2026-08-03
- **対象バージョン**: v1.4.0
- **実施環境**: Cloud Run Container / Chrome 127.0 (Linux/x86_64)

## 2. テストケース検証結果

| ID | テスト項目 | 検証手順 | 期待される結果 | 結果 |
|---|---|---|---|---|
| TC-01 | UTF-8ファイル読み込み | UTF-8形式の.mdをオープン | 文字化けせず表示、判定がUTF-8 | **Pass** |
| TC-02 | Shift_JISファイル読み込み | SJIS形式の.txtをオープン | 文字化けせず表示、判定がShift_JIS | **Pass** |
| TC-03 | EUC-JPファイル読み込み | EUC-JP形式の.mdをオープン | 文字化けせず表示、判定がEUC-JP | **Pass** |
| TC-04 | Shift_JISエクスポート | Shift_JIS選択でエクスポート | 改行コード CRLF (\r\n) で出力 | **Pass** |
| TC-05 | EUC-JPエクスポート | EUC-JP選択でエクスポート | 改行コード LF (\n) で出力 | **Pass** |
| TC-06 | SQL構文ハイライト | SQLコードブロックを出力 | SELECT/FROM等がハイライト表示 | **Pass** |
| TC-07 | Version情報モーダル | v1.4.0アイコンまたはメニューをクリック | バージョン情報ダイアログ表示 | **Pass** |
| TC-08 | Yama Front Matter パース | Front Matter付き.mdを読み込み | タイトル/タグ/エンコーディングが自動設定 | **Pass** |
| TC-09 | Front Matter エディタ保護 | エディタ画面を確認 | Front Matterブロックが直接文字編集不可 | **Pass** |
| TC-10 | タグ追加・削除インタラクション | タグ管理UIで「+追加」「削除」操作 | タグバッジが動的に更新されデータ反映 | **Pass** |
| TC-11 | Yama Front Matter エクスポート | エクスポート (.md) を実行 | 最新のYAML Front Matterが先頭に付与 | **Pass** |
| TC-12 | ショートカットモーダル表示 | 「ヘルプ」>「キーボードショートカット」クリックまたは `F1` キー押下 | カテゴリ別キーボードショートカット一覧モーダルが表示 | **Pass** |
| TC-13 | グローバルショートカット | `Ctrl+N` / `Ctrl+S` / `Ctrl+P` 押下 | 新規作成、保存、印刷ダイアログが起動 | **Pass** |
| TC-14 | TypeScriptコンパイル | `npm run lint` を実行 | エラーゼロでパス | **Pass** |
| TC-15 | Productionビルド | `npm run build` を実行 | ビルド成功 (`dist/` 生成) | **Pass** |

