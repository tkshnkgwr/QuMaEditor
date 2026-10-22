import { GoogleGenAI } from '@google/genai';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { EditorSettings } from '../types';
import { parseYamlFrontMatter } from './yamlUtils';

/**
 * CORS制限をバイパスして安全にWeb/プロキシ通信を行うヘルパー
 * (Tauri環境では @tauri-apps/plugin-http の fetch を優先使用)
 */
export async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    return await tauriFetch(url, options as any);
  } catch {
    return await window.fetch(url, options);
  }
}

/**
 * 高速クライアントサイド要約生成ロジック（キーセンテンス自動抽出フォールバック）
 * QuDaMemo 準拠のローカルルールベース要約
 */
export function generateFallbackSummary(content: string, title?: string): string {
  if (!content || !content.trim()) {
    return '（ドキュメント内容が空のため要約はありません）';
  }

  // Front Matter が含まれている場合は本文のみを取り出す
  const { body } = parseYamlFrontMatter(content);
  const cleanBody = body || content;

  // 見出し(#)、空行、区切り線(---)、コードブロック(```)等を除外
  const lines = cleanBody
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false;
      if (l.startsWith('#')) return false;
      if (l.startsWith('---')) return false;
      if (l.startsWith('```')) return false;
      if (l.startsWith('>')) return false;
      return true;
    });

  if (lines.length === 0) {
    return title ? `「${title}」に関するドキュメント記録。` : 'Markdown ドキュメントの記録。';
  }

  // 先頭から箇条書き記号を除去した主要文を最大3〜4行抽出
  const keySentences = lines.slice(0, 4).map((l) => l.replace(/^[-*•\d+.\s]+/, '').trim()).filter(Boolean);
  let summaryText = keySentences.join('。');

  // 120文字以内に収める
  if (summaryText.length > 120) {
    summaryText = summaryText.slice(0, 117) + '...';
  }
  if (!summaryText.endsWith('。') && !summaryText.endsWith('...')) {
    summaryText += '。';
  }

  return summaryText;
}

/**
 * Gemini API / エンドポイント接続テスト実行
 */
export async function testGeminiConnection(options: {
  apiKey: string;
  model: string;
  baseUrl?: string;
}): Promise<{
  testedAt: string;
  apiTest: { success: boolean; latency: number; message: string };
  urlTest: { success: boolean; latency: number; message: string };
}> {
  const { apiKey, model, baseUrl } = options;
  const cleanBaseUrl = (baseUrl?.trim() || 'https://generativelanguage.googleapis.com').replace(/\/+$/, '');

  const now = new Date();
  const testedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  if (!apiKey.trim()) {
    return {
      testedAt,
      apiTest: {
        success: false,
        latency: 0,
        message: '⚠️ APIキーが未設定です。Gemini AI要約をご利用いただくにはAPIキーを入力してください。',
      },
      urlTest: {
        success: false,
        latency: 0,
        message: 'APIキー未設定のためテスト省略',
      },
    };
  }

  let apiRes = { success: false, latency: 0, message: '' };
  let urlRes = { success: false, latency: 0, message: '' };

  // 1. 直通 Gemini API テスト
  const start1 = performance.now();
  try {
    const testEndpoint = `${cleanBaseUrl}/v1beta/models/${model}?key=${encodeURIComponent(apiKey.trim())}`;
    const res = await safeFetch(testEndpoint);
    const latency1 = Math.round(performance.now() - start1);
    if (res.ok) {
      apiRes = { success: true, latency: latency1, message: `接続成功 (${model})` };
    } else {
      const errText = await res.text().catch(() => '');
      apiRes = { success: false, latency: latency1, message: `エラー ${res.status}: ${errText.slice(0, 100)}` };
    }
  } catch (err: any) {
    apiRes = {
      success: false,
      latency: Math.round(performance.now() - start1),
      message: err?.message || 'ネットワーク通信エラー',
    };
  }

  // 2. Base URL / プロキシ導通テスト
  const start2 = performance.now();
  try {
    const pingUrl = `${cleanBaseUrl}/v1beta/models?key=${encodeURIComponent(apiKey.trim())}`;
    const res2 = await safeFetch(pingUrl);
    const latency2 = Math.round(performance.now() - start2);
    if (res2.ok) {
      urlRes = { success: true, latency: latency2, message: `エンドポイント応答正常 (${cleanBaseUrl})` };
    } else {
      urlRes = { success: false, latency: latency2, message: `レスポンスエラー (${res2.status})` };
    }
  } catch (err: any) {
    urlRes = {
      success: false,
      latency: Math.round(performance.now() - start2),
      message: err?.message || 'プロキシ非導通',
    };
  }

  return { testedAt, apiTest: apiRes, urlTest: urlRes };
}

/**
 * Google サーバーから現在利用可能な Gemini モデル一覧を取得し、
 * 文章要約に適したテキストモデルのみをスマートフィルターで厳選して返却します。
 */
export async function fetchAvailableGeminiModels(options: {
  apiKey: string;
  baseUrl?: string;
}): Promise<{ value: string; label: string }[]> {
  const { apiKey, baseUrl } = options;
  if (!apiKey?.trim()) {
    throw new Error('APIキーが未設定です。先にAPIキーを入力してください。');
  }

  const cleanBaseUrl = (baseUrl?.trim() || 'https://generativelanguage.googleapis.com').replace(/\/+$/, '');
  const url = `${cleanBaseUrl}/v1beta/models?key=${encodeURIComponent(apiKey.trim())}`;

  const res = await safeFetch(url);
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Google API エラー (${res.status}): ${errText.slice(0, 100)}`);
  }

  const data = await res.json();
  const rawModels: Array<{
    name: string;
    displayName?: string;
    description?: string;
    supportedGenerationMethods?: string[];
    supportedActions?: string[];
  }> = data.models || [];

  // 🛡️ スマートフィルター（要約に無関係な画像・音声・ロボット等を完全排除）
  const filtered = rawModels.filter((m) => {
    const rawName = (m.name || '').replace(/^models\//, '').toLowerCase();
    const displayName = (m.displayName || '').toLowerCase();

    // 1. generateContent（文章生成）をサポートしていること
    const methods = m.supportedGenerationMethods || m.supportedActions || [];
    const canGenerate = methods.some((method) => method.includes('generateContent'));
    if (!canGenerate) return false;

    // 2. 特殊用途モデル（画像生成、音声、ロボット、埋め込み等）をブラックリスト除外
    const isSpecialized =
      rawName.includes('tts') ||
      rawName.includes('transcribe') ||
      rawName.includes('audio') ||
      rawName.includes('image') ||
      rawName.includes('banana') ||
      rawName.includes('lyria') ||
      rawName.includes('clip') ||
      rawName.includes('robotics') ||
      rawName.includes('computer-use') ||
      rawName.includes('deep-research') ||
      rawName.includes('embedding') ||
      rawName.includes('customtools') ||
      rawName.includes('gemma');
    if (isSpecialized) return false;

    // 3. gemini の flash または pro または latest であること
    const isTargetGemini =
      (rawName.includes('gemini') || displayName.includes('gemini')) &&
      (rawName.includes('flash') || rawName.includes('pro') || rawName.includes('latest'));

    return isTargetGemini;
  });

  // 整形とマッピング
  const modelOptions = filtered.map((m) => {
    const cleanId = m.name.replace(/^models\//, '');
    let label = cleanId;
    if (m.displayName && m.displayName !== cleanId) {
      label = `${cleanId} (${m.displayName})`;
    }
    return {
      value: cleanId,
      label,
    };
  });

  // ソート：latest を上位に、flash を pro より上位に、バージョン降順
  modelOptions.sort((a, b) => {
    const aLatest = a.value.includes('latest') ? 1 : 0;
    const bLatest = b.value.includes('latest') ? 1 : 0;
    if (aLatest !== bLatest) return bLatest - aLatest;

    const aFlash = a.value.includes('flash') ? 1 : 0;
    const bFlash = b.value.includes('flash') ? 1 : 0;
    if (aFlash !== bFlash) return bFlash - aFlash;

    return b.value.localeCompare(a.value);
  });

  if (modelOptions.length === 0) {
    throw new Error('利用可能な要約向け Gemini モデルが見つかりませんでした');
  }

  return modelOptions;
}

/**
 * AI 要約トリガー（API直通 / Web・プロキシ中継 / ローカルフォールバック統合）
 */
export async function triggerDocumentSummary(params: {
  content: string;
  title?: string;
  settings: EditorSettings;
}): Promise<{ summary: string; summaryType: string; errorMessage?: string }> {
  const { content, title, settings } = params;

  if (!content || !content.trim()) {
    return {
      summary: '（ドキュメント内容が空のため要約はありません）',
      summaryType: 'none',
    };
  }

  // Front Matter を除外した本文テキストを取り出す
  const { body } = parseYamlFrontMatter(content);
  const textToSummarize = (body || content).trim();

  if (!textToSummarize) {
    return {
      summary: '（本文が空のため要約はありません）',
      summaryType: 'none',
    };
  }

  const mode = settings.activeSummaryMode || 'api';
  const apiKey = settings.geminiApiKey?.trim() || '';
  const modelName = settings.geminiModel?.trim() || 'gemini-3.7-flash';
  const customPrompt =
    settings.summaryRule?.trim() ||
    '80〜120文字程度でドキュメントの主要な要点・テーマ・結論を簡潔に要約してください。挨拶やプレフィックス（「要約：」等）は含めず、要約本文のみを出力してください。';
  const baseUrl = settings.geminiBaseUrl?.trim();
  const cleanBaseUrl = (baseUrl || 'https://generativelanguage.googleapis.com').replace(/\/+$/, '');

  // 1. ローカルフォールバックモード、または APIキー未設定の場合
  if (mode === 'local_fallback' || !apiKey) {
    const fallbackText = generateFallbackSummary(textToSummarize, title);
    return {
      summary: fallbackText,
      summaryType: 'local-fallback',
      errorMessage: !apiKey ? 'APIキーが設定されていないためローカル要約を実行しました' : undefined,
    };
  }

  // 2. Web / プロキシ中継モード
  if (mode === 'web_proxy') {
    try {
      const keyQuery = `?key=${encodeURIComponent(apiKey)}`;
      const endpoint = `${cleanBaseUrl}/v1beta/models/${modelName}:generateContent${keyQuery}`;

      const res = await safeFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${customPrompt}\n\n【対象ドキュメント本文】\n${textToSummarize}` }] }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (generatedText) {
          return { summary: generatedText, summaryType: `${modelName} (Web-Proxy)` };
        }
      }
      const errText = await res.text().catch(() => '');
      throw new Error(`Web-Proxy HTTP ${res.status}: ${errText.slice(0, 100)}`);
    } catch (proxyErr: any) {
      return {
        summary: generateFallbackSummary(textToSummarize, title),
        summaryType: `${modelName} (Proxy Error -> Fallback)`,
        errorMessage: proxyErr?.message || String(proxyErr),
      };
    }
  }

  // 3. API 直通モード (QuDaMemo 実績準拠: GoogleGenAI SDK を最優先使用)
  try {
    let generatedText = '';

    const executeAiCall = async (): Promise<string> => {
      // 優先 1: GoogleGenAI SDK (QuDaMemo 準拠: AQ... 形式等の最新キーも自動マッピング)
      try {
        const aiOptions: Record<string, unknown> = { apiKey };
        if (cleanBaseUrl !== 'https://generativelanguage.googleapis.com') {
          aiOptions.baseUrl = cleanBaseUrl;
        }
        const ai = new GoogleGenAI(aiOptions as any);

        // 高速化: 思考モデルの場合は要約用として thinkingBudget: 0 を試行
        try {
          const fastResponse = await ai.models.generateContent({
            model: modelName,
            contents: `${customPrompt}\n\n【対象ドキュメント本文】\n${textToSummarize}`,
            config: {
              thinkingConfig: {
                thinkingBudget: 0,
              },
            },
          });
          const fastText = fastResponse.text?.trim();
          if (fastText) return fastText;
        } catch {
          // thinkingConfig 非対応モデル等の場合は通常呼び出し
          const standardResponse = await ai.models.generateContent({
            model: modelName,
            contents: `${customPrompt}\n\n【対象ドキュメント本文】\n${textToSummarize}`,
          });
          const stdText = standardResponse.text?.trim();
          if (stdText) return stdText;
        }
      } catch (sdkErr: any) {
        console.warn('GoogleGenAI SDK call failed, evaluating fallback:', sdkErr);
        // SDK 固有の明確な HTTP エラー（503 過負荷、402 残高不足、400 不正キー等）はそのまま上に伝達
        const errMsg = sdkErr?.message || String(sdkErr);
        if (errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('402') || errMsg.includes('400')) {
          throw sdkErr;
        }
      }

      // 優先 2: safeFetch REST 直通フォールバック (SDK が動かない環境用)
      const keyQuery = `?key=${encodeURIComponent(apiKey)}`;
      const endpoint = `${cleanBaseUrl}/v1beta/models/${modelName}:generateContent${keyQuery}`;
      const res = await safeFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${customPrompt}\n\n【対象ドキュメント本文】\n${textToSummarize}` }] }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      } else {
        const errBody = await res.text().catch(() => '');
        let detailedMsg = `HTTP ${res.status}`;
        try {
          const parsedErr = JSON.parse(errBody);
          if (parsedErr?.error?.message) {
            detailedMsg += `: ${parsedErr.error.message}`;
          }
        } catch {
          if (errBody) detailedMsg += `: ${errBody.slice(0, 150)}`;
        }
        throw new Error(detailedMsg);
      }
    };

    // 最大 45 秒で安全タイムアウト（混雑時や推論モデルでも確実に待機）
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Google サーバーの応答待機がタイムアウトしました (45秒)')), 45000)
    );

    generatedText = await Promise.race([executeAiCall(), timeoutPromise]);

    if (generatedText) {
      return { summary: generatedText, summaryType: modelName };
    }
    throw new Error('Gemini API から空の応答が返されました');
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error('Gemini API call failed:', errorMsg);
    // 失敗時はローカルルールベース要約に安全フォールバック
    return {
      summary: generateFallbackSummary(textToSummarize, title),
      summaryType: `${modelName} (Error -> Fallback)`,
      errorMessage: errorMsg,
    };
  }
}
