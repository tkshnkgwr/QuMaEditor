// UPDATE 2026-08-04: 低リソース環境向けログローテーション管理機能の実装
// 目的: ログ肥大化によるメモリ・LocalStorageの消費を防ぎつつ、動作履歴とリモート/ローカル保存ログを保持するため
import { LogEntry, LogLevel } from '../types';

const MAX_LOG_ENTRIES = 100; // ログ肥大化防止のローテーション閾値件数
const STORAGE_KEY = 'app_system_logs_v1';

type LogListener = (logs: LogEntry[]) => void;

class LoggerService {
  private logs: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();

  constructor() {
    this.loadLogs();
  }

  private loadLogs() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.logs = JSON.parse(saved);
      }
    } catch {
      this.logs = [];
    }
  }

  private saveLogs() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
    } catch (e) {
      console.error('Failed to save logs to storage', e);
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.logs]));
  }

  /**
   * ログを出力し、最大100件を超えた場合は古い順に自動ローテート（削除）します
   */
  public log(level: LogLevel, message: string, details?: string) {
    const timestamp = new Date().toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const newEntry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp,
      level,
      message,
      details,
    };

    this.logs.unshift(newEntry); // 新しい順に先頭に追加

    // ログ件数が上限(100件)を超えた場合、古いログを切り捨て（ローテーション）
    if (this.logs.length > MAX_LOG_ENTRIES) {
      this.logs = this.logs.slice(0, MAX_LOG_ENTRIES);
    }

    this.saveLogs();
    this.notify();

    // コンソールにもデバッグ出力
    const consoleMsg = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    if (level === 'error') console.error(consoleMsg, details);
    else if (level === 'warn') console.warn(consoleMsg, details);
    else console.log(consoleMsg, details);
  }

  public info(message: string, details?: string) {
    this.log('info', message, details);
  }

  public warn(message: string, details?: string) {
    this.log('warn', message, details);
  }

  public error(message: string, details?: string) {
    this.log('error', message, details);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    this.saveLogs();
    this.notify();
  }

  public subscribe(listener: LogListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const logger = new LoggerService();
