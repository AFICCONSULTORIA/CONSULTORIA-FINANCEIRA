import React from 'react';
import toast from 'react-hot-toast';
import './ui.css';

interface MoneyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({ value, onChange, placeholder = '0,00', style, className }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Remove tudo que não for dígito
    const rawVal = val.replace(/\D/g, '');
    
    if (!rawVal) {
      onChange('');
      return;
    }

    // Se o usuário tentar digitar mais dígitos do que o limite seguro (14 dígitos = 999 bilhões)
    if (rawVal.length > 13) {
      toast.error('Limite máximo alcançado!', { id: 'money-limit' });
      return;
    }

    // Transforma em float com duas casas (ex: "1250" -> 12.50)
    const numberValue = parseInt(rawVal, 10) / 100;
    // Formata no padrão pt-BR
    const formatted = numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    if (formatted.length > 16) {
      toast.error('Limite máximo alcançado!', { id: 'money-limit' });
      return;
    }

    onChange(formatted);
  };

  return (
    <div className="money-input-wrap" style={style}>
      <span className="money-input-prefix">R$</span>
      <input 
        type="text" 
        value={value} 
        onChange={handleChange} 
        placeholder={placeholder} 
        maxLength={17}
        className={`money-input-field ${className || ''}`}
        style={{ width: '100%', paddingLeft: '2.5rem' }}
      />
    </div>
  );
};
