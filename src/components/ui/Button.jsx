import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon: Icon = null,
  iconPosition = 'left',
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  // Variantes de estilo
  const variants = {
    primary: 'bg-nexus-primary text-nexus-dark hover:bg-nexus-secondary shadow-nexus-glow hover:shadow-nexus-glow-lg',
    secondary: 'bg-nexus-surface-2 text-nexus-light hover:bg-nexus-border border border-nexus-border',
    success: 'bg-nexus-success text-white hover:opacity-90',
    danger: 'bg-nexus-danger text-white hover:opacity-90',
    warning: 'bg-nexus-warning text-nexus-dark hover:opacity-90',
    info: 'bg-nexus-info text-white hover:opacity-90',
    ghost: 'bg-transparent text-nexus-light hover:bg-nexus-surface-2',
    outline: 'bg-transparent text-nexus-primary border-2 border-nexus-primary hover:bg-nexus-primary hover:text-nexus-dark',
  };

  // Tamanhos
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const baseStyles = 'font-semibold rounded-lg transition-all duration-300 inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-nexus-primary focus:ring-offset-2 focus:ring-offset-nexus-dark';
  const widthStyle = fullWidth ? 'w-full' : '';
  const disabledStyle = disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${disabledStyle} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-5 h-5" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-5 h-5" />}
        </>
      )}
    </button>
  );
};

export default Button;
