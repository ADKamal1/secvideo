import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: {
    bg: 'bg-accent-emerald/10 border-accent-emerald/20',
    icon: 'text-accent-emerald',
    text: 'text-accent-emerald',
  },
  error: {
    bg: 'bg-accent-red/10 border-accent-red/20',
    icon: 'text-accent-red',
    text: 'text-accent-red',
  },
  warning: {
    bg: 'bg-accent-amber/10 border-accent-amber/20',
    icon: 'text-accent-amber',
    text: 'text-accent-amber',
  },
  info: {
    bg: 'bg-primary-500/10 border-primary-500/20',
    icon: 'text-primary-500',
    text: 'text-primary-400',
  },
};

export const ToastContainer: React.FC = () => {
  const toasts = useUIStore((state) => state.toasts);
  const removeToast = useUIStore((state) => state.removeToast);

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          const style = styles[toast.type];

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={clsx(
                'pointer-events-auto',
                'flex items-start gap-3 p-4',
                'min-w-[320px] max-w-md',
                'rounded-xl border backdrop-blur-xl',
                'shadow-lg',
                style.bg
              )}
            >
              <Icon className={clsx('flex-shrink-0 mt-0.5', style.icon)} size={20} />
              <p className={clsx('flex-1 text-sm font-medium', style.text)}>
                {toast.message}
              </p>
              <button
                onClick={() => removeToast(toast.id)}
                className={clsx(
                  'flex-shrink-0 p-1 rounded-lg',
                  'hover:bg-white/10 transition-colors',
                  style.text
                )}
              >
                <X size={16} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body
  );
};

