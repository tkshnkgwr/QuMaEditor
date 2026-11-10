import { useState, useEffect } from 'react';
import { EditorSettings, ThemeMode, MarkdownDoc } from '../types';
import { loadSettings, saveSettings } from '../utils/storage';

/**
 * アプリケーションのテーマ設定（ダーク/ライト/システム）、
 * 基本エディタ設定、およびウィンドウ/ドキュメントタイトル同期を管理するカスタムフック
 */
export function useAppTheme(currentDoc: MarkdownDoc) {
  // 基本設定 state
  const [settings, setSettings] = useState<EditorSettings>(loadSettings);

  // OSのシステムダークモード設定の検出
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  const effectiveTheme: 'dark' | 'light' =
    settings.theme === 'system' ? systemTheme : settings.theme || 'dark';
  const isDark = effectiveTheme === 'dark';

  // HTML ルート (documentElement) のテーマクラス・color-scheme 同期
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [isDark]);

  // ウィンドウタイトルおよび印刷タイトルを現在のドキュメント名に同期
  useEffect(() => {
    const docName = currentDoc.title || 'QuMaEditor';
    document.title = docName;
  }, [currentDoc.title]);

  const handleUpdateSettings = (newSettings: Partial<EditorSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveSettings(updated);
      return updated;
    });
  };

  const handleChangeTheme = (newTheme: ThemeMode) => {
    handleUpdateSettings({ theme: newTheme });
  };

  return {
    settings,
    setSettings,
    handleUpdateSettings,
    isDark,
    effectiveTheme,
    handleChangeTheme,
  };
}
