import React from 'react';
import clsx from 'clsx';
import './ui.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'brand';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, variant = 'default', interactive = false, ...props }) => {
  return (
    <div
      className={clsx(
        'afic-card',
        variant === 'brand' && 'afic-card--brand',
        interactive && 'afic-card--interactive',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
