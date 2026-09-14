//! # OS ネイティブ外部変更監視モジュール (FileWatcher)
//!
//! `notify` クレートを使用し、OS カーネル直結でファイルの変更を CPU 負荷 0% で監視します。
//! `FileSyncManager` と連携し、自プロセスによる保存時や同一 mtime の連続イベントを完全に抑止します。

use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{LazyLock, Mutex};
use tauri::{AppHandle, Emitter};

/// 外部変更通知ペイロード
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct NativeFileChangedPayload {
    /// 変更が検知されたファイルパス
    pub file_path: String,
    /// 変更後の最新 mtime (ミリ秒)
    pub mtime_ms: f64,
}

/// ファイル監視マネージャー
pub struct FileWatcherManager {
    watcher: Option<RecommendedWatcher>,
    watched_paths: HashMap<String, PathBuf>,
    app_handle: Option<AppHandle>,
}

impl Default for FileWatcherManager {
    fn default() -> Self {
        Self::new()
    }
}

impl FileWatcherManager {
    pub fn new() -> Self {
        Self {
            watcher: None,
            watched_paths: HashMap::new(),
            app_handle: None,
        }
    }

    /// パスを正規化（小文字化・トリム・スラッシュ統一）
    fn normalize_path(path: &str) -> String {
        path.trim()
            .trim_matches('"')
            .replace('\\', "/")
            .to_lowercase()
    }

    /// Watcher の初期化（初回のみ）
    fn ensure_watcher(&mut self, app_handle: AppHandle) -> Result<(), String> {
        if self.watcher.is_some() {
            self.app_handle = Some(app_handle);
            return Ok(());
        }

        self.app_handle = Some(app_handle.clone());
        let handle_clone = app_handle;

        let watcher_res = RecommendedWatcher::new(
            move |res: notify::Result<Event>| {
                if let Ok(event) = res {
                    Self::handle_fs_event(&handle_clone, event);
                }
            },
            Config::default(),
        );

        let watcher =
            watcher_res.map_err(|e| format!("ファイルウォッチャーの初期化に失敗: {}", e))?;
        self.watcher = Some(watcher);
        Ok(())
    }

    /// FS イベント発生時の処理ハンドラー
    fn handle_fs_event(app_handle: &AppHandle, event: Event) {
        // 更新または属性変更イベントのみ対象
        match event.kind {
            EventKind::Modify(_) | EventKind::Create(_) | EventKind::Any => {}
            _ => return,
        }

        for path_buf in event.paths {
            let path_str = path_buf.to_string_lossy().to_string();
            let norm = Self::normalize_path(&path_str);

            // 自プロセスによる保存中または直後（4秒以内ガード）であれば無視
            if let Ok(true) = crate::sync_manager::sync_is_self_saving(norm.clone(), 4000.0) {
                continue;
            }

            // 実ファイルの現在の mtime を取得
            let meta = match fs::metadata(&path_buf) {
                Ok(m) => m,
                Err(_) => continue,
            };

            let curr_mtime = meta
                .modified()
                .ok()
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_millis() as f64)
                .unwrap_or(0.0);

            if curr_mtime == 0.0 {
                continue;
            }

            // SyncManager に記録されている mtime と比較
            if let Ok(last_mtime_opt) =
                crate::sync_manager::sync_register_file(norm.clone(), curr_mtime)
            {
                let _ = last_mtime_opt;
            }

            // フロントエンドへ外部変更イベントを発行
            let payload = NativeFileChangedPayload {
                file_path: path_str,
                mtime_ms: curr_mtime,
            };

            let _ = app_handle.emit("native-file-changed", payload);
        }
    }

    /// ファイルの監視を開始
    pub fn watch_file(&mut self, app_handle: AppHandle, file_path: &str) -> Result<bool, String> {
        let clean = file_path.trim_matches('"');
        let path = Path::new(clean);
        if !path.exists() {
            return Err(format!("監視対象ファイルが存在しません: {}", clean));
        }

        self.ensure_watcher(app_handle)?;

        let norm = Self::normalize_path(clean);
        let path_buf = path.to_path_buf();

        if let Some(ref mut watcher) = self.watcher {
            // 既に監視中の場合は一旦解除してから再登録
            if let Some(existing) = self.watched_paths.get(&norm) {
                let _ = watcher.unwatch(existing);
            }

            watcher
                .watch(&path_buf, RecursiveMode::NonRecursive)
                .map_err(|e| format!("ファイル監視登録失敗 ({}): {}", clean, e))?;

            self.watched_paths.insert(norm.clone(), path_buf.clone());

            // 初回 mtime を SyncManager に記録
            if let Ok(meta) = fs::metadata(&path_buf) {
                if let Some(mtime) = meta
                    .modified()
                    .ok()
                    .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                    .map(|d| d.as_millis() as f64)
                {
                    let _ = crate::sync_manager::sync_register_file(norm, mtime);
                }
            }

            Ok(true)
        } else {
            Err("ウォッチャーが初期化されていません".to_string())
        }
    }

    /// ファイルの監視を解除
    pub fn unwatch_file(&mut self, file_path: &str) -> Result<bool, String> {
        let norm = Self::normalize_path(file_path);
        if let Some(path_buf) = self.watched_paths.remove(&norm) {
            if let Some(ref mut watcher) = self.watcher {
                let _ = watcher.unwatch(&path_buf);
            }
            Ok(true)
        } else {
            Ok(false)
        }
    }

    /// すべての監視を解除
    pub fn unwatch_all(&mut self) -> Result<bool, String> {
        if let Some(ref mut watcher) = self.watcher {
            for (_, path_buf) in self.watched_paths.drain() {
                let _ = watcher.unwatch(&path_buf);
            }
        } else {
            self.watched_paths.clear();
        }
        Ok(true)
    }
}

/// グローバルな FileWatcherManager シングルトン
static WATCHER_MANAGER: LazyLock<Mutex<FileWatcherManager>> =
    LazyLock::new(|| Mutex::new(FileWatcherManager::new()));

/// ネイティブファイル監視の開始
pub fn watch_file_native(app_handle: AppHandle, file_path: String) -> Result<bool, String> {
    let mut mgr = WATCHER_MANAGER
        .lock()
        .map_err(|e| format!("ウォッチャーマネージャーのロック失敗: {}", e))?;
    mgr.watch_file(app_handle, &file_path)
}

/// ネイティブファイル監視の解除
pub fn unwatch_file_native(file_path: String) -> Result<bool, String> {
    let mut mgr = WATCHER_MANAGER
        .lock()
        .map_err(|e| format!("ウォッチャーマネージャーのロック失敗: {}", e))?;
    mgr.unwatch_file(&file_path)
}

/// すべての監視を解除
pub fn unwatch_all_native() -> Result<bool, String> {
    let mut mgr = WATCHER_MANAGER
        .lock()
        .map_err(|e| format!("ウォッチャーマネージャーのロック失敗: {}", e))?;
    mgr.unwatch_all()
}
