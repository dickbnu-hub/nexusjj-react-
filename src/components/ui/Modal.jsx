import React, { useEffect } from 'react';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlay = true,
  showClose = true,
}) => {
  // Fecha com tecla ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw]',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={closeOnOverlay ? onClose : undefined}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-nexus-dark/80 backdrop-blur-sm"></div>

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${sizes[size]} bg-nexus-surface border border-nexus-border rounded-2xl shadow-nexus-card overflow-hidden`}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between p-6 border-b border-nexus-border">
            {title && (
              <h2 className="text-xl font-bold text-nexus-light font-display">
                {title}
              </h2>
            )}
            {showClose && (
              <button
                onClick={onClose}
                className="text-nexus-muted hover:text-nexus-light transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-nexus-surface-2"
                aria-label="Fechar"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-nexus-border bg-nexus-surface-2/30">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
