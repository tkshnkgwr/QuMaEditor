import { TextStats } from '../types';

export function insertFormatting(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  type:
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strikethrough'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'bullet'
    | 'numbered'
    | 'task'
    | 'code'
    | 'codeblock'
    | 'quote'
    | 'link'
    | 'image'
    | 'table'
    | 'hr'
    | 'text'
    | string,
  value?: string
): { newText: string; newCursorStart: number; newCursorEnd: number } {
  const selectedText = text.slice(selectionStart, selectionEnd);
  let prefix = '';
  let suffix = '';
  let replacement = value || '';
  let cursorOffsetStart = 0;
  let cursorOffsetEnd = 0;

  switch (type) {
    case 'bold':
      prefix = '**';
      suffix = '**';
      replacement = selectedText || '太字テキスト';
      break;
    case 'italic':
      prefix = '*';
      suffix = '*';
      replacement = selectedText || '斜体テキスト';
      break;
    case 'underline':
      prefix = '<u>';
      suffix = '</u>';
      replacement = selectedText || '下線テキスト';
      break;
    case 'strikethrough':
      prefix = '~~';
      suffix = '~~';
      replacement = selectedText || '打ち消し線テキスト';
      break;
    case 'h1':
      prefix = '# ';
      replacement = selectedText || '見出し 1';
      break;
    case 'h2':
      prefix = '## ';
      replacement = selectedText || '見出し 2';
      break;
    case 'h3':
      prefix = '### ';
      replacement = selectedText || '見出し 3';
      break;
    case 'bullet':
      if (selectedText.includes('\n')) {
        const lines = selectedText.split('\n');
        replacement = lines.map((line) => `- ${line.replace(/^[-*+]\s+/, '')}`).join('\n');
      } else {
        prefix = '- ';
        replacement = selectedText || 'リスト項目';
      }
      break;
    case 'numbered':
      if (selectedText.includes('\n')) {
        const lines = selectedText.split('\n');
        replacement = lines.map((line, idx) => `${idx + 1}. ${line.replace(/^\d+\.\s+/, '')}`).join('\n');
      } else {
        prefix = '1. ';
        replacement = selectedText || '番号付き項目';
      }
      break;
    case 'task':
      if (selectedText.includes('\n')) {
        const lines = selectedText.split('\n');
        replacement = lines.map((line) => `- [ ] ${line.replace(/^-\s*\[[ xX]\]\s*/, '')}`).join('\n');
      } else {
        prefix = '- [ ] ';
        replacement = selectedText || 'タスク項目';
      }
      break;
    case 'code':
      prefix = '`';
      suffix = '`';
      replacement = selectedText || 'code';
      break;
    case 'codeblock':
      prefix = '```javascript\n';
      suffix = '\n```';
      replacement = selectedText || '// コードをここに入力';
      break;
    case 'quote':
      if (selectedText.includes('\n')) {
        replacement = selectedText
          .split('\n')
          .map((line) => `> ${line}`)
          .join('\n');
      } else {
        prefix = '> ';
        replacement = selectedText || '引用テキスト';
      }
      break;
    case 'link':
      prefix = '[';
      suffix = '](https://example.com)';
      replacement = selectedText || 'リンクテキスト';
      break;
    case 'image':
      prefix = '![';
      suffix = '](https://via.placeholder.com/600x300)';
      replacement = selectedText || '画像の説明';
      break;
    case 'table':
      replacement = `| ヘッダー 1 | ヘッダー 2 | ヘッダー 3 |\n| --- | --- | --- |\n| データ 1 | データ 2 | データ 3 |\n| データ 4 | データ 5 | データ 6 |`;
      break;
    case 'hr':
      replacement = '\n\n---\n\n';
      break;
  }

  // 行頭への挿入が必要な書式かチェック
  const needsLineStart = ['h1', 'h2', 'h3', 'bullet', 'numbered', 'task', 'quote', 'hr', 'table'].includes(type);

  if (needsLineStart && selectionStart === selectionEnd) {
    const lineStart = text.lastIndexOf('\n', selectionStart - 1) + 1;
    const isBeginningOfLine = selectionStart === lineStart;

    if (!isBeginningOfLine && type !== 'table' && type !== 'hr') {
      // 行頭でない場合は改行を先頭に追加
      prefix = '\n' + prefix;
    }
  }

  const resultString = prefix + replacement + suffix;
  const newText = text.slice(0, selectionStart) + resultString + text.slice(selectionEnd);

  cursorOffsetStart = selectionStart + prefix.length;
  cursorOffsetEnd = cursorOffsetStart + replacement.length;

  return {
    newText,
    newCursorStart: cursorOffsetStart,
    newCursorEnd: cursorOffsetEnd,
  };
}

export function generateCustomTable(rows: number, cols: number, headers: string[]): string {
  const headerRow = `| ${headers.map((h, i) => h || `列 ${i + 1}`).join(' | ')} |`;
  const dividerRow = `| ${Array(cols).fill('---').join(' | ')} |`;
  const dataRows: string[] = [];

  for (let r = 0; r < rows; r++) {
    const cells = Array(cols)
      .fill(0)
      .map((_, c) => `データ ${r + 1}-${c + 1}`);
    dataRows.push(`| ${cells.join(' | ')} |`);
  }

  return `${headerRow}\n${dividerRow}\n${dataRows.join('\n')}`;
}

export function calculateTextStats(text: string): TextStats {
  const characters = text.length;
  const charactersNoSpace = text.replace(/\s/g, '').length;
  
  // 日本語・CJKおよび英単語のカウント
  const wordsMatch = text.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]|\w+/g);
  const words = wordsMatch ? wordsMatch.length : 0;
  
  const lines = text ? text.split('\n').length : 1;
  // 平均的な日本語読書速度（約400〜500文字/分）
  const readingTimeMinutes = Math.max(1, Math.ceil(charactersNoSpace / 400));

  return {
    characters,
    charactersNoSpace,
    words,
    lines,
    readingTimeMinutes,
  };
}

export function handleAutoListContinuation(
  text: string,
  selectionStart: number
): { handled: boolean; newText: string; newCursor: number } {
  const lineStart = text.lastIndexOf('\n', selectionStart - 1) + 1;
  const currentLine = text.slice(lineStart, selectionStart);

  // タスクリストパターン "- [ ] ", "- [/] ", "- [x] "
  const taskMatch = currentLine.match(/^(\s*)([-*+])\s+\[([ xX\/\-|])\]\s*(.*)$/);
  if (taskMatch) {
    const [, indent, bullet, , content] = taskMatch;
    if (content.trim() === '') {
      // 空のタスク項目の場合：Enterでプレフィックスを削除
      const newText = text.slice(0, lineStart) + text.slice(selectionStart);
      return { handled: true, newText, newCursor: lineStart };
    } else {
      const prefix = `\n${indent}${bullet} [ ] `;
      const newText = text.slice(0, selectionStart) + prefix + text.slice(selectionStart);
      return { handled: true, newText, newCursor: selectionStart + prefix.length };
    }
  }

  // 箇条書きリストパターン "- " / "* " / "+ "
  const bulletMatch = currentLine.match(/^(\s*)([-*+])\s+(.*)$/);
  if (bulletMatch) {
    const [, indent, bullet, content] = bulletMatch;
    if (content.trim() === '') {
      // 空のリスト項目の場合：プレフィックスを削除
      const newText = text.slice(0, lineStart) + text.slice(selectionStart);
      return { handled: true, newText, newCursor: lineStart };
    } else {
      const prefix = `\n${indent}${bullet} `;
      const newText = text.slice(0, selectionStart) + prefix + text.slice(selectionStart);
      return { handled: true, newText, newCursor: selectionStart + prefix.length };
    }
  }

  // 番号付きリストパターン "1. "
  const numberMatch = currentLine.match(/^(\s*)(\d+)\.\s+(.*)$/);
  if (numberMatch) {
    const [, indent, numStr, content] = numberMatch;
    if (content.trim() === '') {
      const newText = text.slice(0, lineStart) + text.slice(selectionStart);
      return { handled: true, newText, newCursor: lineStart };
    } else {
      const nextNum = parseInt(numStr, 10) + 1;
      const prefix = `\n${indent}${nextNum}. `;
      const newText = text.slice(0, selectionStart) + prefix + text.slice(selectionStart);
      return { handled: true, newText, newCursor: selectionStart + prefix.length };
    }
  }

  return { handled: false, newText: text, newCursor: selectionStart };
}

/**
 * UPDATE 2026-08-04: Markdown内の指定インデックス(targetIndex)のタスク箇条書き項目の状態をトグル/巡回する
 * 状態サイクル: [ ] (未完了) -> [/] (進行中) -> [x] (完了) -> [ ] (未完了)
 */
export function toggleTaskInMarkdown(markdown: string, targetIndex: number): string {
  let currentIndex = 0;
  // [-*+] \[( |x|X|/|-)] のパターンにマッチ
  const taskRegex = /^([ \t]*[-*+]\s+\[)( |x|X|\/|-)(\])/gm;

  return markdown.replace(taskRegex, (match, prefix, state, suffix) => {
    if (currentIndex === targetIndex) {
      currentIndex++;
      let newState = 'x';
      if (state === ' ' || state === '') {
        newState = '/'; // 未完了 -> 進行中
      } else if (state === '/' || state === '-') {
        newState = 'x'; // 進行中 -> 完了
      } else {
        newState = ' '; // 完了/その他 -> 未完了
      }
      return `${prefix}${newState}${suffix}`;
    }
    currentIndex++;
    return match;
  });
}

/**
 * Tab / Shift+Tab キー押下時のインデント・アンインデント処理
 * - リスト行または通常行でのインデント（ネスト階層化）
 * - 複数行選択時の範囲インデント/アンインデント
 */
export function handleTabIndent(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  isShift: boolean,
  tabSize: number = 2
): { newText: string; newCursorStart: number; newCursorEnd: number } {
  const indentStr = ' '.repeat(tabSize);

  // 複数行が選択されている場合
  if (selectionStart !== selectionEnd && text.slice(selectionStart, selectionEnd).includes('\n')) {
    const lineStart = text.lastIndexOf('\n', selectionStart - 1) + 1;
    let lineEnd = text.indexOf('\n', selectionEnd);
    if (lineEnd === -1) lineEnd = text.length;

    const targetChunk = text.slice(lineStart, lineEnd);
    const lines = targetChunk.split('\n');

    let startOffsetDelta = 0;
    let totalOffsetDelta = 0;

    const newLines = lines.map((line, idx) => {
      if (!isShift) {
        // Tab: 各行の先頭にスペース追加
        if (idx === 0) startOffsetDelta += tabSize;
        totalOffsetDelta += tabSize;
        return indentStr + line;
      } else {
        // Shift + Tab: 各行の先頭の空白（最大 tabSize 個）を削除
        const match = line.match(/^[ ]{1,4}/);
        if (match) {
          const removedCount = Math.min(match[0].length, tabSize);
          if (idx === 0) startOffsetDelta -= removedCount;
          totalOffsetDelta -= removedCount;
          return line.slice(removedCount);
        } else if (line.startsWith('\t')) {
          if (idx === 0) startOffsetDelta -= 1;
          totalOffsetDelta -= 1;
          return line.slice(1);
        }
        return line;
      }
    });

    const replacement = newLines.join('\n');
    const newText = text.slice(0, lineStart) + replacement + text.slice(lineEnd);
    const newCursorStart = Math.max(lineStart, selectionStart + startOffsetDelta);
    const newCursorEnd = Math.max(newCursorStart, selectionEnd + totalOffsetDelta);

    return {
      newText,
      newCursorStart,
      newCursorEnd,
    };
  }

  // 単一行（または同一行内の選択）
  const lineStart = text.lastIndexOf('\n', selectionStart - 1) + 1;
  let lineEnd = text.indexOf('\n', selectionStart);
  if (lineEnd === -1) lineEnd = text.length;
  const currentLine = text.slice(lineStart, lineEnd);

  // 行がリスト形式（箇条書き、番号付き、タスク）か、あるいは行頭での操作か判定
  const isListLine = /^(\s*)([-*+]|\d+\.)(\s+)/.test(currentLine);

  if (!isShift) {
    // Tab
    if (isListLine || selectionStart === lineStart) {
      // リスト行または行頭の場合：行頭にインデントを追加してネスト
      const newText = text.slice(0, lineStart) + indentStr + text.slice(lineStart);
      return {
        newText,
        newCursorStart: selectionStart + tabSize,
        newCursorEnd: selectionEnd + tabSize,
      };
    } else {
      // 通常の行途中でのTab：カーソル位置にスペースを挿入
      const newText = text.slice(0, selectionStart) + indentStr + text.slice(selectionEnd);
      return {
        newText,
        newCursorStart: selectionStart + tabSize,
        newCursorEnd: selectionStart + tabSize,
      };
    }
  } else {
    // Shift + Tab: 行頭のインデントを削除
    const match = currentLine.match(/^[ ]{1,4}/);
    if (match) {
      const removedCount = Math.min(match[0].length, tabSize);
      const newText = text.slice(0, lineStart) + currentLine.slice(removedCount) + text.slice(lineEnd);
      const newPos = Math.max(lineStart, selectionStart - removedCount);
      return {
        newText,
        newCursorStart: newPos,
        newCursorEnd: newPos,
      };
    } else if (currentLine.startsWith('\t')) {
      const newText = text.slice(0, lineStart) + currentLine.slice(1) + text.slice(lineEnd);
      const newPos = Math.max(lineStart, selectionStart - 1);
      return {
        newText,
        newCursorStart: newPos,
        newCursorEnd: newPos,
      };
    }

    return {
      newText: text,
      newCursorStart: selectionStart,
      newCursorEnd: selectionEnd,
    };
  }
}


