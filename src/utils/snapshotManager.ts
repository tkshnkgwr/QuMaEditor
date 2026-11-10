import { DocumentSnapshot, MarkdownDoc } from '../types';
import { logger } from './logger';

const SNAPSHOTS_KEY = 'markdown_editor_snapshots_v1';
const MAX_SNAPSHOTS_PER_DOC = 20;
const MAX_TOTAL_SNAPSHOTS = 100;

/**
 * 全スナップショットの取得
 */
export function getAllSnapshots(): DocumentSnapshot[] {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DocumentSnapshot[];
  } catch (err) {
    logger.error('スナップショット読み込み失敗', String(err));
    return [];
  }
}

/**
 * 特定ドキュメントのスナップショット一覧を新しい順に取得
 */
export function getSnapshotsForDoc(docId: string): DocumentSnapshot[] {
  const all = getAllSnapshots();
  return all
    .filter((s) => s.docId === docId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * スナップショットを保存（自動バックアップ・手動保存時・明示的作成）
 */
export function saveSnapshot(
  doc: MarkdownDoc,
  trigger: 'auto' | 'save' | 'manual' = 'auto'
): DocumentSnapshot | null {
  if (!doc || !doc.id || !doc.content) return null;

  try {
    const all = getAllSnapshots();
    const docSnapshots = all
      .filter((s) => s.docId === doc.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // 直近のスナップショットと同一内容の場合は保存をスキップ
    if (docSnapshots.length > 0 && docSnapshots[0].content === doc.content) {
      return null;
    }

    const lines = doc.content.split('\n').length;
    const newSnapshot: DocumentSnapshot = {
      id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      docId: doc.id,
      docTitle: doc.title || '無題のドキュメント',
      timestamp: new Date().toISOString(),
      content: doc.content,
      charCount: doc.content.length,
      lineCount: lines,
      trigger,
    };

    // ドキュメントごとの上限を超過した古いスナップショットを削除
    let updatedDocSnapshots = [newSnapshot, ...docSnapshots];
    if (updatedDocSnapshots.length > MAX_SNAPSHOTS_PER_DOC) {
      updatedDocSnapshots = updatedDocSnapshots.slice(0, MAX_SNAPSHOTS_PER_DOC);
    }

    // 他ドキュメントのスナップショットと結合
    const otherSnapshots = all.filter((s) => s.docId !== doc.id);
    let combined = [...updatedDocSnapshots, ...otherSnapshots];

    // 全体の上限を超過した場合は最も古いものを切り捨て
    if (combined.length > MAX_TOTAL_SNAPSHOTS) {
      combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      combined = combined.slice(0, MAX_TOTAL_SNAPSHOTS);
    }

    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(combined));
    logger.info(`スナップショット保存成功 [${trigger}]`, `${doc.title} (${doc.content.length}文字)`);
    return newSnapshot;
  } catch (err) {
    logger.error('スナップショット保存失敗', String(err));
    return null;
  }
}

/**
 * 単一スナップショットの削除
 */
export function deleteSnapshot(snapshotId: string): void {
  try {
    const all = getAllSnapshots();
    const filtered = all.filter((s) => s.id !== snapshotId);
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(filtered));
    logger.info('スナップショット削除', snapshotId);
  } catch (err) {
    logger.error('スナップショット削除失敗', String(err));
  }
}

/**
 * 特定ドキュメントの全スナップショット削除
 */
export function clearSnapshotsForDoc(docId: string): void {
  try {
    const all = getAllSnapshots();
    const filtered = all.filter((s) => s.docId !== docId);
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(filtered));
    logger.info('ドキュメントのスナップショット全削除', docId);
  } catch (err) {
    logger.error('スナップショット全削除失敗', String(err));
  }
}
