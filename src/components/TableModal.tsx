import React, { useState } from 'react';
import { X, Table, Plus } from 'lucide-react';
import { generateCustomTable } from '../utils/markdownUtils';

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertTable: (tableMarkdown: string) => void;
}

export const TableModal: React.FC<TableModalProps> = ({ isOpen, onClose, onInsertTable }) => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [headers, setHeaders] = useState<string[]>(['ヘッダー 1', 'ヘッダー 2', 'ヘッダー 3']);

  if (!isOpen) return null;

  const handleColsChange = (newCols: number) => {
    const validCols = Math.max(1, Math.min(10, newCols));
    setCols(validCols);
    const newHeaders = Array.from({ length: validCols }, (_, i) => headers[i] || `ヘッダー ${i + 1}`);
    setHeaders(newHeaders);
  };

  const handleHeaderChange = (index: number, val: string) => {
    const copy = [...headers];
    copy[index] = val;
    setHeaders(copy);
  };

  const handleInsert = () => {
    const tableMd = generateCustomTable(rows, cols, headers);
    onInsertTable(tableMd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-md p-5 text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 font-semibold text-sm text-cyan-400">
            <Table className="w-4 h-4" />
            <span>表組 (テーブル) 作成ウィザード</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs">
          {/* 行数・列数入力 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">行数 (Rows)</label>
              <input
                type="number"
                min={1}
                max={20}
                value={rows}
                onChange={(e) => setRows(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">列数 (Columns)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={cols}
                onChange={(e) => handleColsChange(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* ヘッダー項目名入力 */}
          <div>
            <label className="block text-slate-400 mb-2">ヘッダー項目名</label>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {headers.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-slate-500 w-12 text-right">列 {i + 1}:</span>
                  <input
                    type="text"
                    value={h}
                    onChange={(e) => handleHeaderChange(i, e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleInsert}
            className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-md transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            表組を挿入
          </button>
        </div>
      </div>
    </div>
  );
};
