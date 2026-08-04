import React, { useState } from 'react';
import { X, RefreshCw, Layers, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { SupportedEncoding } from '../types';
import { batchConvertFilesNative, BatchConvertResult } from '../utils/tauriNative';

interface BatchConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const BatchConvertModal: React.FC<BatchConvertModalProps> = ({ isOpen, onClose, isDark = true }) => {
  const [selectedEncoding, setSelectedEncoding] = useState<SupportedEncoding>('UTF-8');
  const [filePathsInput, setFilePathsInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BatchConvertResult | null>(null);

  if (!isOpen) return null;

  const handleRunBatch = async () => {
    const paths = filePathsInput
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (paths.length === 0) {
      alert('変換対象のファイルパスを1行に1つずつ入力してください。');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const res = await batchConvertFilesNative(paths, selectedEncoding);
      if (res) {
        setResult(res);
      } else {
        alert('Tauri ネイティブ一括変換コマンドの実行に失敗しました。');
      }
    } catch (err) {
      console.error(err);
      alert('一括変換中にエラーが発生しました。');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div
        className={`w-full max-w-2xl rounded-xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* モーダルヘッダー */}
        <div
          className={`p-4 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-wide">複数ファイルの一括文字コード変換 (Rust並列処理)</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                `rayon` マルチスレッドエンジンにより大量のファイルを並列で爆速文字コード変換します
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-100' : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* モーダルボディ */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh] text-xs">
          {/* ターゲットエンコーディング選択 */}
          <div>
            <label className={`block font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              変換後の文字コード (Target Encoding)
            </label>
            <div className="flex gap-2">
              {(['UTF-8', 'Shift_JIS', 'EUC-JP'] as SupportedEncoding[]).map((enc) => (
                <button
                  key={enc}
                  onClick={() => setSelectedEncoding(enc)}
                  className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                    selectedEncoding === enc
                      ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                      : isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      : 'bg-slate-100 border-slate-300 text-slate-700 hover:border-slate-400'
                  }`}
                >
                  {enc}
                </button>
              ))}
            </div>
          </div>

          {/* 対象ファイルパス一覧入力 */}
          <div>
            <label className={`block font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              変換対象のローカルファイルパス（1行に1パスずつ入力）
            </label>
            <textarea
              rows={6}
              value={filePathsInput}
              onChange={(e) => setFilePathsInput(e.target.value)}
              placeholder="C:\docs\note1.md&#10;C:\docs\note2.txt"
              className={`w-full p-3 font-mono rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* 変換実行結果 */}
          {result && (
            <div
              className={`p-4 rounded-lg border space-y-2 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> 成功: {result.success_count} 件
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <AlertTriangle className="w-4 h-4" /> 失敗: {result.failure_count} 件
                </span>
              </div>
              {result.messages.length > 0 && (
                <div className="mt-2 space-y-1 font-mono text-[11px] text-rose-300 max-h-24 overflow-y-auto">
                  {result.messages.map((m, idx) => (
                    <div key={idx}>• {m}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* モーダルフッター */}
        <div
          className={`px-4 py-3 border-t flex items-center justify-end gap-2 shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            キャンセル
          </button>

          <button
            onClick={handleRunBatch}
            disabled={isProcessing}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors flex items-center gap-1.5 shadow-md disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Rust 並列一括変換中...
              </>
            ) : (
              <>
                <Layers className="w-3.5 h-3.5" />
                一括変換を実行
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
