import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { TOAST_DURATION } from '../utils/constants';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg backdrop-blur-xl border animate-slide-in ${
        type === 'success'
          ? 'bg-green-500/20 border-green-400/30 text-green-100'
          : 'bg-red-500/20 border-red-400/30 text-red-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
        </div>
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 p-1 hover:bg-white/10 rounded transition-colors"
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
