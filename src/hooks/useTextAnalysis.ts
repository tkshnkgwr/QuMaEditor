import { useState, useEffect } from 'react';
import { TextStats } from '../types';
import { calculateTextStats } from '../utils/markdownUtils';
import { calculateTextStatsNative, lintMarkdownDocumentNative, ProofreadingIssue } from '../utils/tauriNative';

/**
 * ドキュメント本文のリアルタイム統計（文字数・単語数・読了時間）および
 * 日本語校正・Markdown構文lint解析をディバウンス非同期実行するカスタムフック
 */
export function useTextAnalysis(content: string) {
  // テキスト統計情報 (Rust ネイティブによる超高速・低メモリ計算 + 150ms ディバウンス)
  const [nativeStats, setNativeStats] = useState<TextStats | null>(null);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      calculateTextStatsNative(content).then((res) => {
        if (isMounted && res) {
          setNativeStats(res);
        }
      });
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [content]);

  const stats: TextStats = nativeStats || calculateTextStats(content);

  // 日本語校正 ＆ Markdown 構文 lint (Rust 非同期バックグラウンド高速解析 + 250ms ディバウンス)
  const [proofreadingIssues, setProofreadingIssues] = useState<ProofreadingIssue[]>([]);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      lintMarkdownDocumentNative(content).then((issues) => {
        if (isMounted) {
          setProofreadingIssues(issues);
        }
      });
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [content]);

  return {
    stats,
    nativeStats,
    proofreadingIssues,
  };
}
