//! # 実ファイル・ストレージ双方向同期統合管理モジュール (FileSyncManager)
//!
//! フロントエンドと OS ファイルシステム間の同期状態、自プロセス保存中ロック、
//! 最新 mtime の一元管理を行い、外部変更監視の誤検知やレースコンディションを防止します。

use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;
use std::sync::{LazyLock, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

/// ファイルごとの同期管理状態
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct FileSyncState {
    /// 管理対象ファイルパス
    pub file_path: String,
    /// 記録されている最新 mtime (ミリ秒)
    pub last_mtime_ms: f64,
    /// 自プロセスによる保存実行中フラグ
    pub is_saving: bool,
    /// 直近の自プロセス保存完了タイムスタンプ (ミリ秒)
    pub last_saved_at_ms: f64,
}

/// グローバルなファイル同期マネージャーストア
pub struct FileSyncManager {
    files: HashMap<String, FileSyncState>,
}

impl Default for FileSyncManager {
    fn default() -> Self {
        Self::new()
    }
}

impl FileSyncManager {
    pub fn new() -> Self {
        Self {
            files: HashMap::new(),
        }
    }

    /// 現在時刻（ミリ秒）を取得
    fn current_time_ms() -> f64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis() as f64)
            .unwrap_or(0.0)
    }

    /// パスを正規化（小文字化・トリム）
    fn normalize_path(path: &str) -> String {
        path.trim()
            .trim_matches('"')
            .replace('\\', "/")
            .to_lowercase()
    }

    /// ファイルの監視・同期状態を登録または更新
    pub fn register_file(&mut self, file_path: &str, mtime_ms: f64) {
        let key = Self::normalize_path(file_path);
        let now = Self::current_time_ms();
        self.files.insert(
            key.clone(),
            FileSyncState {
                file_path: file_path.to_string(),
                last_mtime_ms: mtime_ms,
                is_saving: false,
                last_saved_at_ms: now,
            },
        );
    }

    /// 自プロセスによる保存開始をマーク
    pub fn begin_save(&mut self, file_path: &str) {
        let key = Self::normalize_path(file_path);
        let now = Self::current_time_ms();
        if let Some(state) = self.files.get_mut(&key) {
            state.is_saving = true;
            state.last_saved_at_ms = now;
        } else {
            self.files.insert(
                key,
                FileSyncState {
                    file_path: file_path.to_string(),
                    last_mtime_ms: 0.0,
                    is_saving: true,
                    last_saved_at_ms: now,
                },
            );
        }
    }

    /// 自プロセスによる保存完了を記録し最新 mtime を同期
    pub fn finish_save(&mut self, file_path: &str, new_mtime_ms: f64) {
        let key = Self::normalize_path(file_path);
        let now = Self::current_time_ms();
        if let Some(state) = self.files.get_mut(&key) {
            state.is_saving = false;
            state.last_mtime_ms = new_mtime_ms;
            state.last_saved_at_ms = now;
        } else {
            self.files.insert(
                key,
                FileSyncState {
                    file_path: file_path.to_string(),
                    last_mtime_ms: new_mtime_ms,
                    is_saving: false,
                    last_saved_at_ms: now,
                },
            );
        }
    }

    /// 自プロセスの保存中、または直近指定ミリ秒（例: 4000ms）以内の保存完了直後かを判定
    pub fn is_self_saving(&self, file_path: &str, window_ms: f64) -> bool {
        let key = Self::normalize_path(file_path);
        if let Some(state) = self.files.get(&key) {
            if state.is_saving {
                return true;
            }
            let now = Self::current_time_ms();
            let elapsed = now - state.last_saved_at_ms;
            return elapsed < window_ms;
        }
        false
    }

    /// 記録されている最新 mtime を取得
    pub fn get_last_mtime(&self, file_path: &str) -> Option<f64> {
        let key = Self::normalize_path(file_path);
        self.files.get(&key).map(|s| s.last_mtime_ms)
    }
}

/// グローバルな FileSyncManager シングルトンインスタンス
static SYNC_MANAGER: LazyLock<Mutex<FileSyncManager>> =
    LazyLock::new(|| Mutex::new(FileSyncManager::new()));

/// ファイルの同期管理を登録する
pub fn sync_register_file(file_path: String, mtime_ms: f64) -> Result<bool, String> {
    let mut manager = SYNC_MANAGER
        .lock()
        .map_err(|e| format!("同期マネージャーのロック失敗: {}", e))?;
    manager.register_file(&file_path, mtime_ms);
    Ok(true)
}

/// 自プロセスの保存開始をマークする
pub fn sync_begin_save(file_path: String) -> Result<bool, String> {
    let mut manager = SYNC_MANAGER
        .lock()
        .map_err(|e| format!("同期マネージャーのロック失敗: {}", e))?;
    manager.begin_save(&file_path);
    Ok(true)
}

/// 自プロセスの保存完了を記録し最新 mtime を同期する
pub fn sync_finish_save(file_path: String, mtime_ms: f64) -> Result<bool, String> {
    let mut manager = SYNC_MANAGER
        .lock()
        .map_err(|e| format!("同期マネージャーのロック失敗: {}", e))?;
    manager.finish_save(&file_path, mtime_ms);
    Ok(true)
}

/// 自プロセスが保存中または保存直後（ガード期間内）かを判定する
pub fn sync_is_self_saving(file_path: String, window_ms: f64) -> Result<bool, String> {
    let manager = SYNC_MANAGER
        .lock()
        .map_err(|e| format!("同期マネージャーのロック失敗: {}", e))?;
    Ok(manager.is_self_saving(&file_path, window_ms))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sync_manager_lifecycle() {
        let mut manager = FileSyncManager::new();
        let path = "C:\\Users\\test\\sample.md";

        // 登録
        manager.register_file(path, 1000.0);
        assert_eq!(manager.get_last_mtime(path), Some(1000.0));
        assert!(!manager.is_self_saving(path, 0.0));

        // 保存開始
        manager.begin_save(path);
        assert!(manager.is_self_saving(path, 0.0));

        // 保存完了
        manager.finish_save(path, 2000.0);
        assert_eq!(manager.get_last_mtime(path), Some(2000.0));
        assert!(manager.is_self_saving(path, 4000.0));
    }
}
