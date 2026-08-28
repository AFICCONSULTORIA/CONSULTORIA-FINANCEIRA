import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Home, Info } from 'lucide-react';
import { MoneyInput } from '../../../components/ui/MoneyInput';
import { calculateBuyVsRent } from '../thePlanMath';

export const BuyVsRentSimulator: React.FC = () => {
  const [propertyValueStr, setPropertyValueStr] = useState('500.000,00');
  const [downPaymentStr, setDownPaymentStr] = useState('100.000,00');
  const [years, setYears] = useState(20);
  const [financingRate, setFinancingRate] = useState(10.5);
  const [investmentRate, setInvestmentRate] = useState(10.5);
  const [propertyAppreciation, setPropertyAppreciation] = useState(5.0);
  const [rentalYield, setRentalYield] = useState(4.5); // 4.5% a.a. (~0.37% a.m.)

  const propertyValue = parseFloat(propertyValueStr.replace(/\./g, '').replace(',', '.')) || 0;
  const downPayment = parseFloat(downPaymentStr.replace(/\./g, '').replace(',', '.')) || 0;

  const result = useMemo(() => {
    return calculateBuyVsRent(
      propertyValue,
      downPayment,
      years,
      financingRate,
      investmentRate,
      propertyAppreciation,
      rentalYield
    );
  }, [propertyValue, downPayment, years, financingRate, investmentRate, propertyAppreciation, rentalYield]);

  return (
    <div className="sim-container anim-fade-up">
      <div className="sim-header">
        <div>
          <h3 className="sim-header__title">
            <Home size={22} color="var(--brand-primary)" />
            Comprar vs. Alugar & Investir
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            A matemática real: Morar de aluguel e investir a entrada + diferença de parcelas vs. comprar financiado.
          </p>
        </div>
      </div>

      {/* Inputs */}
      <div className="sim-grid-inputs">
        <div className="sim-input-group">
          <label className="afic-label">Valor do Imóvel (R$)</label>
          <MoneyInput value={propertyValueStr} onChange={setPropertyValueStr} />
        </div>

        <div className="sim-input-group">
          <label className="afic-label">Entrada / Capital Inicial (R$)</label>
          <MoneyInput value={downPaymentStr} onChange={setDownPaymentStr} />
        </div>

        <div className="sim-input-group">
          <label className="afic-label">Horizonte de Tempo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="range" 
              min={5} 
              max={30} 
              value={years} 
              onChange={e => setYears(Number(e.target.value))}
            />
            <span style={{ fontWeight: 800, minWidth: '60px', textAlign: 'right' }}>{years} anos</span>
          </div>
        </div>

        <div className="sim-input-group">
          <label className="afic-label">Juros Financiamento (% a.a.)</label>
          <input 
            type="number" 
            step="0.1" 
            value={financingRate} 
            onChange={e => setFinancingRate(Number(e.target.value))} 
            className="tx-search-input"
          />
        </div>

        <div className="sim-input-group">
          <label className="afic-label">Rendimento Investimentos (% a.a.)</label>
          <input 
            type="number" 
            step="0.1" 
            value={investmentRate} 
            onChange={e => setInvestmentRate(Number(e.target.value))} 
            className="tx-search-input"
          />
        </div>

        <div className="sim-input-group">
          <label className="afic-label">Valorização do Imóvel (% a.a.)</label>
          <input 
            type="number" 
            step="0.1" 
            value={propertyAppreciation} 
            onChange={e => setPropertyAppreciation(Number(e.target.value))} 
            className="tx-search-input"
          />
        </div>

        <div className="sim-input-group">
          <label className="afic-label">Aluguel Anual (% do imóvel)</label>
          <input 
            type="number" 
            step="0.1" 
            value={rentalYield} 
            onChange={e => setRentalYield(Number(e.target.value))} 
            className="tx-search-input"
          />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Média Brasil: 4% a 5% a.a. (~R$ {((propertyValue * (rentalYield / 100)) / 12).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/mês)
          </span>
        </div>
      </div>

      {/* Cards de Resultado */}
      <div className="sim-comparison-cards">
        <div className={`sim-compare-card ${result.verdict === 'buy' ? 'sim-compare-card--best' : ''}`}>
          <span className="sim-compare-card__tag">Cenário 1: Comprar Financiado</span>
          <span className="sim-compare-card__val" style={{ color: result.verdict === 'buy' ? 'var(--success)' : 'var(--text-primary)' }}>
            {result.propertyValueAfterYears.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <div className="sim-compare-card__sub">
            Valor estimado do imóvel após {years} anos com valorização média de {propertyAppreciation}% ao ano.
          </div>
        </div>

        <div className={`sim-compare-card ${result.verdict === 'rent' ? 'sim-compare-card--best' : ''}`}>
          <span className="sim-compare-card__tag">Cenário 2: Alugar & Investir</span>
          <span className="sim-compare-card__val" style={{ color: result.verdict === 'rent' ? 'var(--success)' : 'var(--text-primary)' }}>
            {result.rentInvestedPortfolioAfterYears.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <div className="sim-compare-card__sub">
            Patrimônio líquido em carteira financeira aplicando a entrada de {downPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} + a diferença entre parcela e aluguel a {investmentRate}% a.a.
          </div>
        </div>

        <div className="sim-compare-card">
          <span className="sim-compare-card__tag">Diferença Patrimonial</span>
          <span className="sim-compare-card__val" style={{ color: 'var(--brand-primary)' }}>
            {Math.abs(result.difference).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <div className="sim-compare-card__sub">
            {result.verdictDescription}
          </div>
        </div>
      </div>

      {/* Gráfico de Evolução Patrimonial */}
      <div style={{ height: '320px', marginTop: '1rem' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
          Evolução Patrimonial ao Longo dos Anos (Imóvel vs. Carteira de Investimentos)
        </h4>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={result.timeline} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
            <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={12} tickFormatter={v => `Ano ${v}`} />
            <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={v => `R$ ${(v / 1000).toFixed(0)}k`} />
            <Tooltip 
              formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
              contentStyle={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
            />
            <Legend />
            <Line type="monotone" dataKey="propertyEquity" name="Patrimônio no Imóvel Próprio" stroke="#3B82F6" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="rentInvestmentEquity" name="Carteira de Investimentos (Alugando)" stroke="#10B981" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Dica da Consultoria */}
      <div className="hack-banner">
        <Info size={24} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Critério Psicológico vs. Financeiro:</strong> Financeiramente, no Brasil de juros reais altos, alugar e investir com disciplina frequentemente ganha da compra financiada. 
          No entanto, a casa própria oferece estabilidade emocional e não exige disciplina diária para investir a diferença. Se optar por comprar, priorize o <strong>Consórcio</strong> ou a <strong>Amortização Extraordinária com redução de prazo</strong> para não deixar o patrimônio no bolso do banco.
        </div>
      </div>
    </div>
  );
};
