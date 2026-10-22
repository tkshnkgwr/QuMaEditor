/**
 * Markdown テーブルの簡易編集支援ユーティリティ
 * - Tab: 次のセルへの移動 (最終セルなら次行、最終行なら新規行自動生成)
 * - Shift+Tab: 前のセルへの移動
 * - Enter: 新規行の挿入 (空行での Enter はテーブル終了・脱出)
 */

/**
 * 指定された行が Markdown テーブル行（パイプ区切り）であるかを判定する
 */
export function isTableLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('|')) return false;
  // パイプで始まるか、または2つ以上のパイプを含む
  return trimmed.startsWith('|') || (trimmed.split('|').length >= 3);
}

/**
 * 指定された行がテーブルのヘッダー区切り行 (|:---|:---:|---:|) であるかを判定する
 */
export function isTableDelimiterLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('|') || !trimmed.includes('-')) return false;
  const cells = trimmed
    .split('|')
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
  if (cells.length === 0) return false;
  return cells.every((cell) => /^:?-+:?$/.test(cell));
}

/**
 * 指定された行が空セルのみのテーブル行 (|   |   |) であるかを判定する
 */
export function isTableEmptyRow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('|')) return false;
  const cells = trimmed
    .split('|')
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
  return cells.length === 0;
}

/**
 * テーブル行の列数（セル数）をカウントする
 */
export function countTableColumns(line: string): number {
  const trimmed = line.trim();
  const rawCells = trimmed.split('|');
  // 先頭と末尾がパイプの場合、前後の空要素を除外
  const startIdx = trimmed.startsWith('|') ? 1 : 0;
  const endIdx = trimmed.endsWith('|') ? rawCells.length - 1 : rawCells.length;
  return Math.max(1, endIdx - startIdx);
}

/**
 * 空のテーブル行文字列 (|   |   | ... |) を生成する
 */
export function createEmptyTableRow(columnCount: number): string {
  const count = Math.max(1, columnCount);
  return `| ${new Array(count).fill(' ').join(' | ')} |`;
}

/**
 * テーブル行内の各セルのテキスト範囲（行先頭からの相対オフセット [start, end]）を取得する
 */
export function getTableCellOffsets(line: string): Array<{ start: number; end: number }> {
  const cells: Array<{ start: number; end: number }> = [];
  let inCell = false;
  let cellStart = 0;

  for (let i = 0; i < line.length; i++) {
    if (line[i] === '|') {
      if (inCell) {
        cells.push({ start: cellStart, end: i });
      }
      cellStart = i + 1;
      inCell = true;
    }
  }

  // 末尾がパイプで終わっていない場合
  if (inCell && cellStart < line.length) {
    cells.push({ start: cellStart, end: line.length });
  }

  return cells;
}

export interface TableNavResult {
  handled: boolean;
  newText?: string;
  newCursorStart?: number;
  newCursorEnd?: number;
}

/**
 * テーブル編集中における Tab / Shift+Tab / Enter キー操作を処理する
 *
 * @param content テキスト全体の文字列
 * @param cursorPos 現在のカーソル位置
 * @param key 押されたキー ('Tab' | 'Enter')
 * @param shiftKey Shift キーの押下状態
 * @returns TableNavResult
 */
export function handleTableKeyNavigation(
  content: string,
  cursorPos: number,
  key: string,
  shiftKey: boolean
): TableNavResult {
  if (key !== 'Tab' && key !== 'Enter') {
    return { handled: false };
  }

  // 現在のカーソル行の開始位置と終了位置を探索
  const lastNewline = content.lastIndexOf('\n', cursorPos - 1);
  const nextNewline = content.indexOf('\n', cursorPos);
  const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
  const lineEnd = nextNewline === -1 ? content.length : nextNewline;
  const currentLine = content.slice(lineStart, lineEnd);

  // 現在行がテーブル行でなければ処理しない
  if (!isTableLine(currentLine)) {
    return { handled: false };
  }

  // --- Enter キーの処理 ---
  if (key === 'Enter') {
    // 1. 全セルが空のテーブル行 (|   |   |) の場合: テーブル入力を終了し、空行で抜ける
    if (isTableEmptyRow(currentLine)) {
      const before = content.slice(0, lineStart);
      const after = content.slice(lineEnd);
      // 空行（\n）に置換
      const newText = before + after;
      return {
        handled: true,
        newText,
        newCursorStart: lineStart,
        newCursorEnd: lineStart,
      };
    }

    // 2. 内容があるテーブル行の場合: 直下に新しい空テーブル行を挿入
    const cols = countTableColumns(currentLine);
    const newRow = createEmptyTableRow(cols);
    const before = content.slice(0, lineEnd);
    const after = content.slice(lineEnd);
    const newText = before + '\n' + newRow + after;

    // 新規行の第1セルの位置にカーソルを合わせる
    // newRow は "|   |   |" なので、最初の "| " の直後（2文字目）
    const firstCellPos = lineEnd + 1 + 2;

    return {
      handled: true,
      newText,
      newCursorStart: firstCellPos,
      newCursorEnd: firstCellPos,
    };
  }

  // --- Tab / Shift+Tab キーの処理 ---
  if (key === 'Tab') {
    const colOffset = cursorPos - lineStart;
    const cells = getTableCellOffsets(currentLine);

    if (cells.length === 0) {
      return { handled: false };
    }

    // 現在どのセルにいるかを特定
    let currentCellIdx = -1;
    for (let i = 0; i < cells.length; i++) {
      if (colOffset >= cells[i].start && colOffset <= cells[i].end) {
        currentCellIdx = i;
        break;
      }
    }
    if (currentCellIdx === -1) {
      // パイプ上または範囲外の場合、最も近いセルへ
      currentCellIdx = colOffset < cells[0].start ? 0 : cells.length - 1;
    }

    if (!shiftKey) {
      // --- Tab (次へ) ---
      if (currentCellIdx < cells.length - 1) {
        // 同じ行の次のセルへ
        const nextCell = cells[currentCellIdx + 1];
        const rawCellContent = currentLine.slice(nextCell.start, nextCell.end);
        const trimmedStart = rawCellContent.search(/\S/);
        const trimmedEnd = rawCellContent.search(/\s*$/);
        const targetStart = nextCell.start + (trimmedStart !== -1 ? trimmedStart : 1);
        const targetEnd = nextCell.start + (trimmedStart !== -1 ? trimmedEnd : Math.max(1, nextCell.end - nextCell.start - 1));

        return {
          handled: true,
          newCursorStart: lineStart + targetStart,
          newCursorEnd: lineStart + Math.max(targetStart, targetEnd),
        };
      } else {
        // 現在行の最後のセル -> 次の行へ移動
        if (nextNewline === -1) {
          // ファイル末尾 -> 新しいテーブル行を追加
          const cols = countTableColumns(currentLine);
          const newRow = createEmptyTableRow(cols);
          const newText = content + '\n' + newRow;
          const firstCellPos = content.length + 1 + 2;
          return {
            handled: true,
            newText,
            newCursorStart: firstCellPos,
            newCursorEnd: firstCellPos,
          };
        }

        // 次の行を取得
        const nextNextNewline = content.indexOf('\n', nextNewline + 1);
        const nextLineStart = nextNewline + 1;
        const nextLineEnd = nextNextNewline === -1 ? content.length : nextNextNewline;
        let targetLineStart = nextLineStart;
        let targetLine = content.slice(nextLineStart, nextLineEnd);

        // もし次の行がヘッダー区切り行 (|:---|) なら、さらにその次の行へスキップ
        if (isTableDelimiterLine(targetLine)) {
          if (nextNextNewline === -1) {
            // 区切り行の直後に新行を作成
            const cols = countTableColumns(currentLine);
            const newRow = createEmptyTableRow(cols);
            const newText = content + '\n' + newRow;
            const firstCellPos = content.length + 1 + 2;
            return {
              handled: true,
              newText,
              newCursorStart: firstCellPos,
              newCursorEnd: firstCellPos,
            };
          }
          const afterDelimiterEnd = content.indexOf('\n', nextNextNewline + 1);
          targetLineStart = nextNextNewline + 1;
          targetLine = content.slice(
            targetLineStart,
            afterDelimiterEnd === -1 ? content.length : afterDelimiterEnd
          );
        }

        // 次の行がテーブル行なら第1セルへ
        if (isTableLine(targetLine)) {
          const nextCells = getTableCellOffsets(targetLine);
          if (nextCells.length > 0) {
            const rawCellContent = targetLine.slice(nextCells[0].start, nextCells[0].end);
            const trimmedStart = rawCellContent.search(/\S/);
            const trimmedEnd = rawCellContent.search(/\s*$/);
            const targetStart = nextCells[0].start + (trimmedStart !== -1 ? trimmedStart : 1);
            const targetEnd = nextCells[0].start + (trimmedStart !== -1 ? trimmedEnd : Math.max(1, nextCells[0].end - nextCells[0].start - 1));

            return {
              handled: true,
              newCursorStart: targetLineStart + targetStart,
              newCursorEnd: targetLineStart + Math.max(targetStart, targetEnd),
            };
          }
        }

        // 次の行がテーブル行でなければ、新しいテーブル行を間に挿入
        const cols = countTableColumns(currentLine);
        const newRow = createEmptyTableRow(cols);
        const before = content.slice(0, lineEnd);
        const after = content.slice(lineEnd);
        const newText = before + '\n' + newRow + after;
        const firstCellPos = lineEnd + 1 + 2;

        return {
          handled: true,
          newText,
          newCursorStart: firstCellPos,
          newCursorEnd: firstCellPos,
        };
      }
    } else {
      // --- Shift + Tab (前へ) ---
      if (currentCellIdx > 0) {
        // 同じ行の前のセルへ
        const prevCell = cells[currentCellIdx - 1];
        const rawCellContent = currentLine.slice(prevCell.start, prevCell.end);
        const trimmedStart = rawCellContent.search(/\S/);
        const trimmedEnd = rawCellContent.search(/\s*$/);
        const targetStart = prevCell.start + (trimmedStart !== -1 ? trimmedStart : 1);
        const targetEnd = prevCell.start + (trimmedStart !== -1 ? trimmedEnd : Math.max(1, prevCell.end - prevCell.start - 1));

        return {
          handled: true,
          newCursorStart: lineStart + targetStart,
          newCursorEnd: lineStart + Math.max(targetStart, targetEnd),
        };
      } else {
        // 現在行の第1セル -> 前の行の最後のセルへ移動
        if (lastNewline === -1) {
          // ファイル先頭
          return { handled: true };
        }

        const prevLastNewline = content.lastIndexOf('\n', lastNewline - 1);
        const prevLineStart = prevLastNewline === -1 ? 0 : prevLastNewline + 1;
        let targetLineStart = prevLineStart;
        let targetLine = content.slice(prevLineStart, lastNewline);

        // もし前の行がヘッダー区切り行 (|:---|) なら、さらに前の行（ヘッダー行）へスキップ
        if (isTableDelimiterLine(targetLine)) {
          if (prevLastNewline === -1) {
            return { handled: true };
          }
          const prevPrevNewline = content.lastIndexOf('\n', prevLastNewline - 1);
          targetLineStart = prevPrevNewline === -1 ? 0 : prevPrevNewline + 1;
          targetLine = content.slice(targetLineStart, prevLastNewline);
        }

        if (isTableLine(targetLine)) {
          const prevCells = getTableCellOffsets(targetLine);
          if (prevCells.length > 0) {
            const lastCell = prevCells[prevCells.length - 1];
            const rawCellContent = targetLine.slice(lastCell.start, lastCell.end);
            const trimmedStart = rawCellContent.search(/\S/);
            const trimmedEnd = rawCellContent.search(/\s*$/);
            const targetStart = lastCell.start + (trimmedStart !== -1 ? trimmedStart : 1);
            const targetEnd = lastCell.start + (trimmedStart !== -1 ? trimmedEnd : Math.max(1, lastCell.end - lastCell.start - 1));

            return {
              handled: true,
              newCursorStart: targetLineStart + targetStart,
              newCursorEnd: targetLineStart + Math.max(targetStart, targetEnd),
            };
          }
        }

        return { handled: true };
      }
    }
  }

  return { handled: false };
}
