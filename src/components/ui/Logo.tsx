import React from 'react';

interface LogoProps {
  size?: number;
  showText?: boolean;
  textSuffix?: string;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 32,
  showText = true,
  textSuffix = 'Consultoria',
  className = ''
}) => {
  return (
    <div className={`afic-logo ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', userSelect: 'none' }}>
      <div 
        style={{ 
          width: size, 
          height: size, 
          borderRadius: '25%',
          background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(192, 132, 252, 0.1) 100%)',
          border: '1px solid rgba(147, 51, 234, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${size * 0.15}px`,
          boxShadow: '0 0 16px rgba(147, 51, 234, 0.25)',
          flexShrink: 0
        }}
      >
        <img 
          src="/favicon.svg" 
          alt="AFIC Logo" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain'
          }} 
        />
      </div>
      {showText && (
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: `${Math.max(16, size * 0.65)}px`, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          AFIC-<strong style={{ color: 'var(--brand-primary)', fontWeight: 900 }}>{textSuffix}</strong>
        </span>
      )}
    </div>
  );
};
