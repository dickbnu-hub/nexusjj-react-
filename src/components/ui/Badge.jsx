import React from 'react';

const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  rounded = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const variants = {
    primary: 'bg-nexus-primary/20 text-nexus-primary border border-nexus-primary/30',
    secondary: 'bg-nexus-surface-2 text-nexus-light border border-nexus-border',
    success: 'bg-nexus-success/20 text-nexus-success border border-nexus-success/30',
    danger: 'bg-nexus-danger/20 text-nexus-danger border border-nexus-danger/30',
    warning: 'bg-nexus-warning/20 text-nexus-warning border border-nexus-warning/30',
    info: 'bg-nexus-info/20 text-nexus-info border border-nexus-info/30',
    solid: 'bg-nexus-primary text-nexus-dark',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const roundeds = {
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium ${variants[variant]} ${sizes[size]} ${roundeds[rounded]} ${className}`}
      {...props}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
      )}
      {children}
    </span>
  );
};

export default Badge;
