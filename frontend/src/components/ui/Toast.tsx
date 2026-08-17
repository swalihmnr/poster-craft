import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

type Listener = (toasts: ToastMessage[]) => void;

let toasts: ToastMessage[] = [];
let listeners: Listener[] = [];

function notify() {
  listeners.forEach((listener) => listener([...toasts]));
}

export const toast = {
  success: (message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    toasts = [...toasts, { id, type: 'success', message }];
    notify();
    setTimeout(() => toast.dismiss(id), 3500);
  },
  error: (message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    toasts = [...toasts, { id, type: 'error', message }];
    notify();
    setTimeout(() => toast.dismiss(id), 4500);
  },
  info: (message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    toasts = [...toasts, { id, type: 'info', message }];
    notify();
    setTimeout(() => toast.dismiss(id), 3500);
  },
  dismiss: (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  },
};

export const ToastContainer: React.FC = () => {
  const [currentToasts, setCurrentToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    listeners.push(setCurrentToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setCurrentToasts);
    };
  }, []);

  if (currentToasts.length === 0) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2.5 max-w-md w-full px-4 pointer-events-none">
      {currentToasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-300 animate-in slide-in-from-top-3 ${
            t.type === 'success'
              ? 'bg-slate-900/90 border-emerald-500/40 text-emerald-300'
              : t.type === 'error'
              ? 'bg-slate-900/90 border-rose-500/40 text-rose-300'
              : 'bg-slate-900/90 border-sky-500/40 text-sky-300'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-sky-400 shrink-0" />}
            <span className="text-xs font-semibold text-slate-100 leading-snug break-words">{t.message}</span>
          </div>

          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
