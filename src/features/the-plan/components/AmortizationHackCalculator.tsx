import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Zap, CheckCircle2 } from 'lucide-react';
import { MoneyInput } from '../../../components/ui/MoneyInput';
import { calculateAmortizationHack } from '../thePlanMath';

export const AmortizationHackCalculator: React.FC = () => {
  const [debtStr, setDebtStr] = useState('320.000,00');
  const [annualRate, setAnnualRate] = useState(10.5);
  const [originalYears, setOriginalYears] = useState(30);
  const [extraMonthlyStr, setExtraMonthlyStr] = useState('400,00');
  const [extraAnnualStr, setExtraAnnualStr] = useState('3.000,00');

  const debt = parseFloat(debtStr.replace(/\./g, '').replace(',', '.')) || 0;
  const extraMonthly = parseFloat(extraMonthlyStr.replace(/\./g, '').replace(',', '.')) || 0;
  const extraAnnual = parseFloat(extraAnnualStr.replace(/\./g, '').replace(',', '.')) || 0;
  const originalMonths = originalYears * 12;

  const result = useMemo(() => {
    return calculateAmortizationHack(debt, annualRate, originalMonths, extraMonthly, extraAnnual);
  }, [debt, annualRate, originalMonths, extraMonthly, extraAnnual]);

  const newYears = Math.floor(result.newMonths / 12);
  const newRemainingMonths = result.newMonths % 12;
  const yearsSaved = Math.floor(result.monthsSaved / 12);

  return (
    <div className="sim-container anim-fade-up">
      <div className="sim-header">
        <div>
          <h3 className="sim-header__title">
            <Zap size={22} color="var(--brand-primary)" />
            Acelerador de Quitação (O Hack do Saldo Devedor)
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Descubra como pequenos aportes extras no principal reduzem décadas de juros bancários.
          </p>
        </div>
      </div>

      {/* Explicação Didática */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--r-lg)', padding: '1rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--brand-primary)' }}>💡 Como funciona a amortização com redução de prazo:</strong> Na sua parcela mensal habitual, até 80% do valor vai apenas para pagar os juros do mês. 
        Porém, quando você faz uma <strong>amortização extraordinária</strong> solicitando <em>redução de prazo</em>, 100% do valor entra abatendo o saldo devedor puro. O banco é obrigado por lei a recalcular e eliminar todos os juros futuros proporcionais daquele montante!
      </div>

      {/* Inputs */}
      <div className="sim-grid-inputs">
        <div className="sim-input-group">
          <label className="afic-label">Saldo Devedor a Quitar (R$)</label>
          <MoneyInput value={debtStr} onChange={setDebtStr} />
        </div>

        <div className="sim-input-group">
          <label className="afic-label">Taxa do Financiamento (% a.a.)</label>
          <input 
            type="number" 
            step="0.1" 
            value={annualRate} 
            onChange={e => setAnnualRate(Number(e.target.value))}
            className="tx-search-input"
          />
        </div>

        <div className="sim-input-group">
          <label className="afic-label">Prazo Restante (Anos)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="range" 
              min={5} 
              max={35} 
              value={originalYears} 
              onChange={e => setOriginalYears(Number(e.target.value))}
            />
            <span style={{ fontWeight: 800, minWidth: '60px', textAlign: 'right' }}>{originalYears} anos</span>
          </div>
        </div>

        <div className="sim-input-group">
          <label className="afic-label">Aporte Extra Mensal (R$)</label>
          <MoneyInput value={extraMonthlyStr} onChange={setExtraMonthlyStr} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ex: Sobra do orçamento mensal</span>
        </div>

        <div className="sim-input-group">
          <label className="afic-label">Aporte Extra Anual (R$)</label>
          <MoneyInput value={extraAnnualStr} onChange={setExtraAnnualStr} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ex: 13º salário, bônus ou FGTS</span>
        </div>
      </div>

      {/* Métricas de Impacto */}
      <div className="hack-metrics">
        <div className="hack-metric-box">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Novo Tempo de Quitação
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-primary)', margin: '0.35rem 0' }}>
            {newYears} anos {newRemainingMonths > 0 && `e ${newRemainingMonths}m`}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
            Redução de {yearsSaved} anos e {result.monthsSaved % 12} meses!
          </span>
        </div>

        <div className="hack-metric-box">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Juros Poupados
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)', margin: '0.35rem 0' }}>
            {result.interestSaved.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Dinheiro que deixou de ir para o banco
          </span>
        </div>

        <div className="hack-metric-box">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Juros Totais Pagos
          </span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.35rem 0' }}>
            {result.newTotalInterest.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--danger)', textDecoration: 'line-through' }}>
            De {result.originalTotalInterest.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      </div>

      {/* Gráfico de Evolução do Saldo Devedor */}
      <div style={{ height: '300px', marginTop: '1rem' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
          Curva de Eliminação da Dívida (Saldo Devedor ao Longo dos Anos)
        </h4>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={result.timeline} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="origGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="accelGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.5}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={12} tickFormatter={v => `Ano ${v}`} />
            <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={v => `R$ ${(v / 1000).toFixed(0)}k`} />
            <Tooltip 
              formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
              contentStyle={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
            />
            <Legend />
            <Area type="monotone" dataKey="originalBalance" name="Financiamento Padrão (Sem Aportes)" stroke="#EF4444" fillOpacity={1} fill="url(#origGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="acceleratedBalance" name="Com Aceleração AFIC (Redução de Prazo)" stroke="#10B981" fillOpacity={1} fill="url(#accelGrad)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Passo a Passo no App do Banco */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--r-xl)', padding: '1.25rem 1.5rem' }}>
        <h4 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} color="var(--success)" /> Passo a Passo Prático no App do seu Banco
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.8125rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>1. Acesse a área Habitacional</span>
            <span style={{ color: 'var(--text-secondary)' }}>No app da Caixa (Habitação Caixa), Itaú ou Santander, localize o seu contrato ativo.</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>2. Clique em "Amortizar"</span>
            <span style={{ color: 'var(--text-secondary)' }}>Selecione a opção de amortização com recursos próprios ou FGTS.</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--warning)' }}>3. CRUCIAL: Escolha "Redução de Prazo"</span>
            <span style={{ color: 'var(--text-secondary)' }}>NUNCA escolha "reduzir parcela" se o objetivo for cortar juros. A redução de prazo é onde a mágica acontece.</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--success)' }}>4. Gere o boleto ou pague por Pix</span>
            <span style={{ color: 'var(--text-secondary)' }}>Em até 48 horas seu saldo devedor e a quantidade de parcelas restantes diminuem no sistema!</span>
          </div>
        </div>
      </div>
    </div>
  );
};
