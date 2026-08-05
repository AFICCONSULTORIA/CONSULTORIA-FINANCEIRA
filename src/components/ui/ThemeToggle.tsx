import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '0.5rem',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        transition: 'background 0.2s',
      }}
      title={`Mudar para modo ${theme === 'light' ? 'escuro' : 'claro'}`}
      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(128,128,128,0.1)'}
      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
    >
      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
};
