import React, { useState } from 'react';
import { Key, Eye, EyeOff, Sparkles, Activity, Check, AlertCircle, Globe, RefreshCw } from 'lucide-react';
import { EditorSettings } from '../../types';
import { testGeminiConnection, fetchAvailableGeminiModels } from '../../utils/aiSummary';

interface AiTabProps {
  settings: EditorSettings;
  onUpdateSettings: (newSettings: Partial<EditorSettings>) => void;
  isDark?: boolean;
}

const PRESET_MODELS = [
  { value: 'gemini-3.7-flash', label: 'gemini-3.7-flash (爆速約1秒・安定動作 - 最推奨)' },
  { value: 'gemini-flash-lite-latest', label: 'gemini-flash-lite-latest (超軽量・即答)' },
  { value: 'gemini-flash-latest', label: 'gemini-flash-latest (最新Flash標準版)' },
  { value: 'gemini-3.8-flash', label: 'gemini-3.8-flash (最新推論・15〜30秒以上要)' },
  { value: 'gemini-3.6-flash', label: 'gemini-3.6-flash (高速安定版)' },
];

const DEFAULT_SUMMARY_RULE =
  '80〜120文字程度でドキュメントの主要な要点・テーマ・結論を簡潔に要約してください。挨拶やプレフィックス（「要約：」等）は含めず、要約本文のみを出力してください。';

export const AiTab: React.FC<AiTabProps> = ({
  settings,
  onUpdateSettings,
  isDark = true,
}) => {
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isFetchingModels, setIsFetchingModels] = useState<boolean>(false);
  const [fetchModelsStatus, setFetchModelsStatus] = useState<{ message: string; isError: boolean } | null>(null);

  // 利用可能なモデル一覧（動的取得キャッシュがあれば優先、なければ既定プリセット）
  const availableModels =
    settings.cachedAvailableModels && settings.cachedAvailableModels.length > 0
      ? settings.cachedAvailableModels
      : PRESET_MODELS;

  // カスタムモデル手入力モードの制御
  const currentModel = settings.geminiModel || 'gemini-3.7-flash';
  const isKnownPreset = availableModels.some((m) => m.value === currentModel);
  const [isCustomModelMode, setIsCustomModelMode] = useState<boolean>(!isKnownPreset && Boolean(currentModel));

  // 「最新モデル取得」ボタンハンドラー
  const handleFetchLatestModels = async () => {
    const apiKey = settings.geminiApiKey?.trim();
    if (!apiKey) {
      alert('最新モデルを取得するには、先に Gemini API キーを入力してください。');
      return;
    }

    setIsFetchingModels(true);
    setFetchModelsStatus(null);
    try {
      const fetched = await fetchAvailableGeminiModels({
        apiKey,
        baseUrl: settings.geminiBaseUrl,
      });
      onUpdateSettings({ cachedAvailableModels: fetched });
      setFetchModelsStatus({
        message: `最新モデルを ${fetched.length} 件取得・更新しました`,
        isError: false,
      });
    } catch (err: any) {
      setFetchModelsStatus({
        message: err?.message || '最新モデルの取得に失敗しました',
        isError: true,
      });
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const result = await testGeminiConnection({
        apiKey: settings.geminiApiKey || '',
        model: settings.geminiModel || 'gemini-3.7-flash',
        baseUrl: settings.geminiBaseUrl,
      });

      onUpdateSettings({
        lastTestResult: {
          testedAt: result.testedAt,
          apiSuccess: result.apiTest.success,
          apiMessage: result.apiTest.message,
          apiLatency: result.apiTest.latency,
          urlSuccess: result.urlTest.success,
          urlMessage: result.urlTest.message,
          urlLatency: result.urlTest.latency,
        },
      });
    } catch (e: any) {
      alert(`テスト実行中にエラーが発生しました: ${e?.message || e}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* APIキーとモデル設定カード */}
      <div
        className={`p-3.5 rounded-xl border space-y-3.5 ${
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        {/* Gemini API Key */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-500" />
              <span>Gemini API キー</span>
            </label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-sky-500 hover:text-sky-600 underline"
            >
              Google AI Studio でキーを取得 ↗
            </a>
          </div>

          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={settings.geminiApiKey || ''}
              onChange={(e) => onUpdateSettings({ geminiApiKey: e.target.value })}
              placeholder="AIzaSy..."
              className={`w-full pl-3 pr-10 py-1.5 text-xs font-mono rounded-lg border outline-none ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-amber-500'
                  : 'bg-white border-slate-300 text-slate-800 focus:border-amber-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[10.5px] text-slate-400 leading-tight">
            ※ APIキー未設定の場合は、本文から重要文を自動抽出するローカルフォールバック要約が実行されます。
          </p>
        </div>

        {/* 実行モード選択 */}
        <div className="space-y-1.5 pt-1 border-t border-slate-200/50 dark:border-slate-800/60">
          <label className="block text-xs font-semibold">要約実行方式</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { mode: 'api', label: 'API 直通', desc: '公式SDK / 標準' },
              { mode: 'web_proxy', label: 'Web/プロキシ中継', desc: 'CORS回避・社内' },
              { mode: 'local_fallback', label: 'ローカル要約', desc: '完全オフライン' },
            ].map((item) => (
              <button
                key={item.mode}
                type="button"
                onClick={() => onUpdateSettings({ activeSummaryMode: item.mode as any })}
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  (settings.activeSummaryMode || 'api') === item.mode
                    ? isDark
                      ? 'bg-purple-950/60 border-purple-500 text-purple-200 shadow-sm'
                      : 'bg-purple-50 border-purple-500 text-purple-900 shadow-sm'
                    : isDark
                      ? 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="font-semibold text-xs">{item.label}</div>
                <div className="text-[10px] opacity-70">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* モデル選択 & Base URL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-200/50 dark:border-slate-800/60">
          {/* 使用AIモデル */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <label className="block text-xs font-semibold">使用AIモデル</label>
                {settings.cachedAvailableModels && settings.cachedAvailableModels.length > 0 && (
                  <span className="text-[9.5px] px-1.5 py-0.2 text-emerald-500 bg-emerald-500/10 rounded font-normal">
                    Google取得済 ({settings.cachedAvailableModels.length}件)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFetchLatestModels}
                  disabled={isFetchingModels || !settings.geminiApiKey?.trim()}
                  title="Google サーバーから要約に使える最新モデル一覧をスマート取得します"
                  className="px-2 py-0.5 text-[10.5px] font-medium bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 rounded flex items-center gap-1 transition-all disabled:opacity-40 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isFetchingModels ? 'animate-spin' : ''}`} />
                  {isFetchingModels ? '取得中...' : '最新モデル取得'}
                </button>
                {isCustomModelMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomModelMode(false);
                      onUpdateSettings({ geminiModel: 'gemini-3.7-flash' });
                    }}
                    className="text-[10.5px] text-sky-500 hover:text-sky-600 underline cursor-pointer"
                  >
                    一覧選択に戻す
                  </button>
                )}
              </div>
            </div>

            {!isCustomModelMode ? (
              <select
                value={isKnownPreset ? currentModel : '__custom__'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__custom__') {
                    setIsCustomModelMode(true);
                  } else {
                    setIsCustomModelMode(false);
                    onUpdateSettings({ geminiModel: val });
                  }
                }}
                className={`w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-purple-500'
                    : 'bg-white border-slate-300 text-slate-800 focus:border-purple-600'
                }`}
              >
                {availableModels.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
                <option value="__custom__">⚙️ カスタム指定（直接手入力...）</option>
              </select>
            ) : (
              <input
                type="text"
                value={settings.geminiModel || ''}
                onChange={(e) => onUpdateSettings({ geminiModel: e.target.value })}
                placeholder="例: gemini-3.7-flash, gemini-flash-lite-latest..."
                className={`w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border outline-none ${
                  isDark
                    ? 'bg-slate-900 border-purple-500 text-slate-200'
                    : 'bg-white border-purple-600 text-slate-800'
                }`}
              />
            )}
            {fetchModelsStatus && (
              <p className={`text-[10px] ${fetchModelsStatus.isError ? 'text-rose-500' : 'text-emerald-500'}`}>
                {fetchModelsStatus.isError ? '⚠️ ' : '✓ '} {fetchModelsStatus.message}
              </p>
            )}
            <p className="text-[10px] text-slate-400">
              💡 おすすめ: <strong>gemini-3.7-flash</strong> / <strong>gemini-3.6-flash</strong>（高速・安定動作）
            </p>
          </div>

          {/* Base URL */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold">Base URL (プロキシ・カスタム)</label>
            <input
              type="text"
              value={settings.geminiBaseUrl || ''}
              onChange={(e) => onUpdateSettings({ geminiBaseUrl: e.target.value })}
              placeholder="https://generativelanguage.googleapis.com"
              className={`w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border outline-none ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-purple-500'
                  : 'bg-white border-slate-300 text-slate-800 focus:border-purple-600'
              }`}
            />
            <p className="text-[10px] text-slate-400">社内プロキシや中継サーバー利用時に指定</p>
          </div>
        </div>

        {/* 接続テスト実行ボタン & 結果 */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Activity className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              {isTesting ? '接続テスト中...' : 'Gemini AI API 接続テスト実行'}
            </button>
            {settings.lastTestResult?.testedAt && (
              <span className="text-[10px] text-slate-400">
                最終テスト: {settings.lastTestResult.testedAt}
              </span>
            )}
          </div>

          {/* 直近のテスト結果カード */}
          {settings.lastTestResult && (
            <div
              className={`p-2.5 rounded-lg border text-[11px] space-y-1.5 ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start gap-1.5">
                {settings.lastTestResult.apiSuccess ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold">モデル応答テスト: </span>
                  <span
                    className={
                      settings.lastTestResult.apiSuccess
                        ? 'text-emerald-500 font-medium'
                        : 'text-rose-500'
                    }
                  >
                    {settings.lastTestResult.apiMessage}
                  </span>
                  {Boolean(settings.lastTestResult.apiLatency) && (
                    <span className="ml-1 text-[10px] text-slate-400">
                      ({settings.lastTestResult.apiLatency}ms)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                {settings.lastTestResult.urlSuccess ? (
                  <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold">Base URL 導通テスト: </span>
                  <span
                    className={
                      settings.lastTestResult.urlSuccess
                        ? 'text-emerald-500 font-medium'
                        : 'text-slate-400'
                    }
                  >
                    {settings.lastTestResult.urlMessage}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI 要約プロンプト生成ルール */}
      <div
        className={`p-3.5 rounded-xl border space-y-2 ${
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI 要約生成ルール（システム指示プロンプト）</span>
          </label>
          <button
            type="button"
            onClick={() => onUpdateSettings({ summaryRule: DEFAULT_SUMMARY_RULE })}
            className="text-[10.5px] text-purple-500 hover:text-purple-600 underline"
          >
            初期ルールに戻す
          </button>
        </div>
        <textarea
          rows={3}
          value={settings.summaryRule || DEFAULT_SUMMARY_RULE}
          onChange={(e) => onUpdateSettings({ summaryRule: e.target.value })}
          placeholder={DEFAULT_SUMMARY_RULE}
          className={`w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none leading-relaxed ${
            isDark
              ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-purple-500'
              : 'bg-white border-slate-300 text-slate-800 focus:border-purple-600'
          }`}
        />
        <p className="text-[10px] text-slate-400">
          要約の文字数、トーン、箇条書き/文章等の指定を自由にカスタマイズできます。
        </p>
      </div>
    </div>
  );
};
