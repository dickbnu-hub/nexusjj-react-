import React from 'react';

const Card = ({
  children,
  variant = 'default',
  hover = false,
  padding = 'md',
  className = '',
  onClick,
  ...props
}) => {
  const variants = {
    default: 'bg-nexus-surface border border-nexus-border',
    elevated: 'bg-nexus-surface-2 border border-nexus-border shadow-nexus-card',
    glow: 'bg-nexus-surface border border-nexus-primary shadow-nexus-glow',
    gradient: 'bg-nexus-gradient text-nexus-dark',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverStyle = hover 
    ? 'hover:scale-[1.02] hover:border-nexus-primary transition-all duration-300 cursor-pointer' 
    : '';

  return (
    <div
      onClick={onClick}
      className={`rounded-xl ${variants[variant]} ${paddings[padding]} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Sub-componentes para estrutura interna
Card.Header = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);

Card.Title = ({ children, className = '' }) => (
  <h3 className={`text-xl font-bold text-nexus-light font-display ${className}`}>
    {children}
  </h3>
);

Card.Description = ({ children, className = '' }) => (
  <p className={`text-nexus-muted text-sm mt-1 ${className}`}>{children}</p>
);

Card.Body = ({ children, className = '' }) => (
  <div className={`text-nexus-light ${className}`}>{children}</div>
);

Card.Footer = ({ children, className = '' }) => (
  <div className={`mt-4 pt-4 border-t border-nexus-border ${className}`}>
    {children}
  </div>
);

export default Card;
