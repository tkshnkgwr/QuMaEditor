/**
 * エディタ (<textarea>) の自動折り返し (wordWrap) に対応した
 * 高速・高精度な視覚行計測およびカーソル視覚座標計算ユーティリティ
 *
 * - 非表示のミラー div を1つだけ使い回し、ブラウザの実際の折り返し結果と一致させる
 * - 絶対に折り返さない短い行は DOM 計測をスキップし、長い行は文字列キャッシュで O(1) 化
 * - カーソル位置の計測は「前段の視覚行数合算 + 現在行のみ Range/ミラー計測」で長文でも超高速
 */

export interface EditorTypography {
  fontSize: number;
  lineHeightPx: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  contentWidth: number;
}

export interface CaretVisualPosition {
  /** テキスト先頭（padding を除く）からの視覚的 Y 座標 (px) */
  top: number;
  /** 1 視覚行の高さ (px) */
  height: number;
}

const MAX_CACHE_ENTRIES = 5000;

export class EditorLayoutMeasurer {
  private mirror: HTMLDivElement | null = null;
  private lastStyleKey: string = '';
  private wrapCache = new Map<string, number>();

  /** ミラー div を遅延生成してスタイルを同期 */
  private ensureMirror(typography: EditorTypography): HTMLDivElement | null {
    if (typeof document === 'undefined') return null;

    if (!this.mirror) {
      const div = document.createElement('div');
      div.setAttribute('aria-hidden', 'true');
      div.style.position = 'fixed';
      div.style.top = '-99999px';
      div.style.left = '-99999px';
      div.style.visibility = 'hidden';
      div.style.pointerEvents = 'none';
      div.style.boxSizing = 'content-box';
      div.style.margin = '0';
      div.style.padding = '0';
      div.style.border = '0';
      div.style.whiteSpace = 'pre-wrap';
      div.style.overflowWrap = 'break-word';
      div.style.wordWrap = 'break-word';
      div.style.overflow = 'hidden';
      document.body.appendChild(div);
      this.mirror = div;
    }

    const styleKey = `${typography.fontSize}|${typography.lineHeightPx}|${typography.fontFamily}|${typography.tabSize}|${Math.round(typography.contentWidth * 10)}`;
    if (this.lastStyleKey !== styleKey) {
      this.lastStyleKey = styleKey;
      this.wrapCache.clear();
      this.mirror.style.fontSize = `${typography.fontSize}px`;
      this.mirror.style.lineHeight = `${typography.lineHeightPx}px`;
      this.mirror.style.fontFamily = typography.fontFamily;
      this.mirror.style.tabSize = String(typography.tabSize);
      this.mirror.style.width = `${Math.max(1, typography.contentWidth)}px`;
    }

    return this.mirror;
  }

  /**
   * 単一の論理行が視覚的に何行に折り返されるかを高速計測する
   */
  public measureLineWrapCount(lineText: string, typography: EditorTypography): number {
    if (!typography.wordWrap || lineText.length === 0 || typography.contentWidth <= 0) {
      return 1;
    }

    // タブを含まず、全角文字だけで構成されていても絶対に折り返さない安全幅なら DOM 計測をスキップ
    if (
      lineText.indexOf('\t') === -1 &&
      lineText.length * typography.fontSize * 1.15 < typography.contentWidth
    ) {
      return 1;
    }

    const mirror = this.ensureMirror(typography);
    if (!mirror) return 1;

    const cached = this.wrapCache.get(lineText);
    if (cached !== undefined) {
      return cached;
    }

    mirror.textContent = lineText;
    const height = mirror.offsetHeight;
    const count = Math.max(1, Math.round(height / typography.lineHeightPx));

    if (this.wrapCache.size >= MAX_CACHE_ENTRIES) {
      this.wrapCache.clear();
    }
    this.wrapCache.set(lineText, count);
    return count;
  }

  /**
   * 折り返し行を空行パディングした行番号テキストを生成する
   * 例: 1行目が3行に折り返された場合 -> "1\n\n\n2\n..."
   */
  public buildLineNumbersText(content: string, typography: EditorTypography): string {
    if (!content) return '1';

    if (!typography.wordWrap || typography.contentWidth <= 0) {
      let lineCount = 1;
      for (let i = 0; i < content.length; i++) {
        if (content.charCodeAt(i) === 10) lineCount++;
      }
      const nums = new Array<string>(lineCount);
      for (let i = 0; i < lineCount; i++) {
        nums[i] = String(i + 1);
      }
      return nums.join('\n');
    }

    const lines = content.split('\n');
    const parts = new Array<string>(lines.length);

    for (let i = 0; i < lines.length; i++) {
      const wrapCount = this.measureLineWrapCount(lines[i], typography);
      if (wrapCount <= 1) {
        parts[i] = String(i + 1);
      } else {
        parts[i] = String(i + 1) + '\n'.repeat(wrapCount - 1);
      }
    }

    return parts.join('\n');
  }

  /**
   * カーソル位置 (selectionStart) の視覚的 Y 座標と行高を正確に計算する
   */
  public measureCaretPosition(
    content: string,
    caretIndex: number,
    typography: EditorTypography
  ): CaretVisualPosition {
    const safeIndex = Math.max(0, Math.min(caretIndex, content.length));
    const { lineHeightPx, wordWrap, contentWidth } = typography;

    // 折り返し無効時は単純な改行カウントのみで O(N) ゼロDOM計測
    if (!wordWrap || contentWidth <= 0) {
      let lineIndex = 0;
      for (let i = 0; i < safeIndex; i++) {
        if (content.charCodeAt(i) === 10) lineIndex++;
      }
      return {
        top: lineIndex * lineHeightPx,
        height: lineHeightPx,
      };
    }

    // カーソルより前の論理行の視覚行数を合算しつつ、現在行の開始・終了位置を特定
    let visualLinesBefore = 0;
    let lineStart = 0;

    for (let i = 0; i < safeIndex; i++) {
      if (content.charCodeAt(i) === 10) {
        const prevLine = content.slice(lineStart, i);
        visualLinesBefore += this.measureLineWrapCount(prevLine, typography);
        lineStart = i + 1;
      }
    }

    const nextNewline = content.indexOf('\n', safeIndex);
    const lineEnd = nextNewline === -1 ? content.length : nextNewline;
    const currentLineText = content.slice(lineStart, lineEnd);
    const offsetInLine = safeIndex - lineStart;

    // 行頭または折り返しが発生しない1行の場合は即確定
    if (offsetInLine === 0 || this.measureLineWrapCount(currentLineText, typography) === 1) {
      return {
        top: visualLinesBefore * lineHeightPx,
        height: lineHeightPx,
      };
    }

    // 現在行内でのカーソルの折り返し行オフセットをミラー + Range API で厳密計測
    const mirror = this.ensureMirror(typography);
    if (!mirror) {
      return {
        top: visualLinesBefore * lineHeightPx,
        height: lineHeightPx,
      };
    }

    let inLineTop = 0;
    mirror.textContent = currentLineText;
    const textNode = mirror.firstChild;

    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
      const mirrorRect = mirror.getBoundingClientRect();

      if (offsetInLine < currentLineText.length) {
        // テキストを加工せず Range API で実際の折り返し位置を取得
        const range = document.createRange();
        range.setStart(textNode, offsetInLine);
        range.setEnd(textNode, offsetInLine + 1);
        const rects = range.getClientRects();
        const rect = rects.length > 0 ? rects[0] : range.getBoundingClientRect();
        if (rect && rect.height > 0) {
          inLineTop = Math.max(0, rect.top - mirrorRect.top);
        }
      } else {
        // 行末位置: 末尾にゼロ幅スパンを置いて正確な折り返し行を取得
        const marker = document.createElement('span');
        marker.textContent = '\u200b';
        mirror.appendChild(marker);
        inLineTop = Math.max(0, marker.offsetTop);
      }
    }

    // 行グリッド (lineHeightPx の整数倍) にスナップ
    const subLineIndex = Math.max(0, Math.round(inLineTop / lineHeightPx));

    return {
      top: (visualLinesBefore + subLineIndex) * lineHeightPx,
      height: lineHeightPx,
    };
  }

  /** ミラー DOM 要素とキャッシュを解放 */
  public dispose() {
    if (this.mirror && this.mirror.parentNode) {
      this.mirror.parentNode.removeChild(this.mirror);
    }
    this.mirror = null;
    this.wrapCache.clear();
    this.lastStyleKey = '';
  }
}

/**
 * textarea のテキスト描画可能幅（padding およびスクロールバーを除いた内側幅）を取得する
 */
export function getTextareaContentWidth(el: HTMLTextAreaElement | null): number {
  if (!el) return 0;
  const style = window.getComputedStyle(el);
  const paddingLeft = parseFloat(style.paddingLeft) || 0;
  const paddingRight = parseFloat(style.paddingRight) || 0;
  return Math.max(0, el.clientWidth - paddingLeft - paddingRight);
}
