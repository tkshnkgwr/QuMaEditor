import React, { useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'warning' | 'reload';

export interface ToastMessage {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
  isDark?: boolean;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose, isDark = true }) => {
  useEffect(() => {
    if (!toast) return;
    const duration = toast.duration || 4000;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const renderIcon = () => {
    switch (toast.type) {
      case 'reload':
        return <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin-slow shrink-0" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-sky-400 shrink-0" />;
    }
  };

  return (
    <div
      className="fixed top-12 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out pointer-events-auto"
      role="alert"
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md transition-colors ${
          isDark
            ? 'bg-slate-900/95 border-slate-700/80 text-slate-100 shadow-black/50'
            : 'bg-white/95 border-slate-300/80 text-slate-800 shadow-slate-400/40'
        }`}
      >
        {renderIcon()}
        <span className="text-sm font-medium tracking-wide whitespace-nowrap">{toast.message}</span>
        <button
          onClick={onClose}
          className={`p-1 rounded-lg transition-colors ml-1 ${
            isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
          }`}
          title="閉じる"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
