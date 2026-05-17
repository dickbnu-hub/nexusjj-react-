import React, { useState } from 'react';

const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helper,
  icon: Icon = null,
  fullWidth = true,
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <div className={`${widthStyle} ${className}`}>
      {label && (
        <label className="block text-nexus-light text-sm font-medium mb-2">
          {label}
          {required && <span className="text-nexus-danger ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-nexus-muted pointer-events-none">
            <Icon className="w-5 h-5" />
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`
            w-full bg-nexus-surface text-nexus-light placeholder-nexus-muted
            border rounded-lg px-4 py-3 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-nexus-primary focus:border-transparent
            ${Icon ? 'pl-11' : ''}
            ${error 
              ? 'border-nexus-danger focus:ring-nexus-danger' 
              : focused 
                ? 'border-nexus-primary' 
                : 'border-nexus-border'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          {...props}
        />
      </div>

      {error && (
        <p className="text-nexus-danger text-xs mt-1.5 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}

      {helper && !error && (
        <p className="text-nexus-muted text-xs mt-1.5">{helper}</p>
      )}
    </div>
  );
};

export default Input;
