import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

// Hook para usar em qualquer componente
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  }
  return context;
};

// Provider que envolve o app
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, variant = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    danger: (msg, dur) => addToast(msg, 'danger', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// Container fixo dos toasts
const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
};

// Item individual
const ToastItem = ({ toast, onClose }) => {
  const variants = {
    success: 'border-nexus-success bg-nexus-success/10',
    danger: 'border-nexus-danger bg-nexus-danger/10',
    warning: 'border-nexus-warning bg-nexus-warning/10',
    info: 'border-nexus-info bg-nexus-info/10',
  };

  const iconColors = {
    success: 'text-nexus-success',
    danger: 'text-nexus-danger',
    warning: 'text-nexus-warning',
    info: 'text-nexus-info',
  };

  const icons = {
    success: '✓',
    danger: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      className={`pointer-events-auto min-w-[300px] max-w-md flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-md bg-nexus-surface/95 ${variants[toast.variant]} shadow-nexus-card`}
    >
      <span className={`text-lg font-bold ${iconColors[toast.variant]}`}>
        {icons[toast.variant]}
      </span>
      <p className="text-nexus-light flex-1 text-sm">{toast.message}</p>
      <button
        onClick={onClose}
        className="text-nexus-muted hover:text-nexus-light transition-colors text-lg"
      >
        ✕
      </button>
    </div>
  );
};

export default ToastProvider;

