import Encoding from 'encoding-japanese';
import { SupportedEncoding, LineEnding } from '../types';
import { detectAndConvertNative, convertToEncodingNative } from './tauriNative';

/**
 * テキスト内の改行コード（LF, CRLF, CR）を自動判別
 */
export function detectLineEnding(content: string): LineEnding {
  if (!content) return 'LF';
  if (content.includes('\r\n')) {
    return 'CRLF';
  } else if (content.includes('\r')) {
    return 'CR';
  } else if (content.includes('\n')) {
    return 'LF';
  }
  return 'LF';
}

/**
 * Uint8Array から文字コードを自動判別
 */
export function detectEncoding(uint8Array: Uint8Array): SupportedEncoding {
  const detected = Encoding.detect(uint8Array);
  if (detected === 'SJIS') return 'Shift_JIS';
  if (detected === 'EUCJP') return 'EUC-JP';
  return 'UTF-8';
}

/**
 * ファイルのバイナリデータを文字列にデコード (Rust ネイティブ併用非同期版)
 */
export async function decodeFileContentAsync(
  uint8Array: Uint8Array,
  specifiedEncoding?: SupportedEncoding
): Promise<{ text: string; encoding: SupportedEncoding }> {
  // 1. Rust ネイティブコマンド試行 (Tauri環境)
  if (!specifiedEncoding) {
    const nativeRes = await detectAndConvertNative(uint8Array);
    if (nativeRes) {
      return { text: nativeRes.text, encoding: nativeRes.encoding };
    }
  }

  // 2. フォールバック (JavaScript)
  return decodeFileContent(uint8Array, specifiedEncoding);
}

/**
 * 同期フォールバック版
 */
export function decodeFileContent(
  uint8Array: Uint8Array,
  specifiedEncoding?: SupportedEncoding
): { text: string; encoding: SupportedEncoding } {
  const detected = detectEncoding(uint8Array);
  const targetEncoding = specifiedEncoding || detected;

  let fromType: Encoding.Encoding = 'UTF8';
  if (targetEncoding === 'Shift_JIS') fromType = 'SJIS';
  else if (targetEncoding === 'EUC-JP') fromType = 'EUCJP';
  else fromType = 'UTF8';

  try {
    const unicodeArray = Encoding.convert(uint8Array, {
      to: 'UNICODE',
      from: fromType,
    });
    const text = Encoding.codeToString(unicodeArray);
    return { text, encoding: targetEncoding };
  } catch (e) {
    const textDecoder = new TextDecoder('utf-8');
    return { text: textDecoder.decode(uint8Array), encoding: 'UTF-8' };
  }
}

/**
 * 指定された文字コードと改行コードに従って Blob または Uint8Array を生成
 */
export async function prepareEncodedBlobAsync(
  text: string,
  encoding: SupportedEncoding = 'UTF-8'
): Promise<Blob> {
  const nativeBytes = await convertToEncodingNative(text, encoding);
  if (nativeBytes) {
    let mimeCharset = 'utf-8';
    if (encoding === 'Shift_JIS') mimeCharset = 'shift_jis';
    else if (encoding === 'EUC-JP') mimeCharset = 'euc-jp';
    return new Blob([new Uint8Array(nativeBytes)], { type: `text/markdown;charset=${mimeCharset}` });
  }

  return prepareEncodedBlob(text, encoding);
}

/**
 * 同期フォールバック版
 */
export function prepareEncodedBlob(text: string, encoding: SupportedEncoding = 'UTF-8'): Blob {
  let normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  if (encoding === 'Shift_JIS') {
    normalizedText = normalizedText.replace(/\n/g, '\r\n');
  } else {
    normalizedText = normalizedText.replace(/\n/g, '\n');
  }

  if (encoding === 'UTF-8') {
    return new Blob([normalizedText], { type: 'text/markdown;charset=utf-8' });
  }

  const unicodeArray = Encoding.stringToCode(normalizedText);
  let toType: Encoding.Encoding = 'UTF8';
  let mimeCharset = 'utf-8';

  if (encoding === 'Shift_JIS') {
    toType = 'SJIS';
    mimeCharset = 'shift_jis';
  } else if (encoding === 'EUC-JP') {
    toType = 'EUCJP';
    mimeCharset = 'euc-jp';
  }

  const encodedArray = Encoding.convert(unicodeArray, {
    to: toType,
    from: 'UNICODE',
  });

  const byteArray = new Uint8Array(encodedArray);
  return new Blob([byteArray], { type: `text/markdown;charset=${mimeCharset}` });
}
