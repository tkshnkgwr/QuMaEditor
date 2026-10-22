import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: '127.0.0.1',
    watch: {
      ignored: ['**/src-tauri/**', '**/target/**'],
    },
  },
  build: {
    // デスクトップアプリ（Tauri）環境向けにチャンクサイズ警告の上限を調整 (2MB)
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Google Gemini AI SDK
            if (id.includes('@google/genai')) {
              return 'vendor-ai';
            }
            // 数式レンダラー (KaTeX)
            if (id.includes('katex')) {
              return 'vendor-katex';
            }
            // Markdown 解析・HTML 変換エンジン関連
            if (
              id.includes('react-markdown') ||
              id.includes('remark-') ||
              id.includes('rehype-') ||
              id.includes('micromark') ||
              id.includes('unist') ||
              id.includes('mdast') ||
              id.includes('vfile')
            ) {
              return 'vendor-markdown';
            }
            // シンタックスハイライター関連
            if (
              id.includes('react-syntax-highlighter') ||
              id.includes('prismjs') ||
              id.includes('refractor') ||
              id.includes('lowlight')
            ) {
              return 'vendor-syntax';
            }
            // Lucide アイコン
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            // Tauri API プラグイン群
            if (id.includes('@tauri-apps')) {
              return 'vendor-tauri';
            }
            // React コアランタイム
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react';
            }
          }
        },
      },
    },
  },
});
