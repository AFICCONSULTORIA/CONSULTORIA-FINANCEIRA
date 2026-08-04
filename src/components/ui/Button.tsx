import React from 'react';
import clsx from 'clsx';
import './ui.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  ...props
}) => {
  return (
    <button
      className={clsx(
        'afic-btn',
        `afic-btn--${variant}`,
        size === 'sm' && 'afic-btn--sm',
        size === 'lg' && 'afic-btn--lg',
        fullWidth && 'afic-btn--full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
