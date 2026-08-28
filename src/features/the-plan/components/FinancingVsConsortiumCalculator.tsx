import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { Scale, Sparkles } from 'lucide-react';
import { MoneyInput } from '../../../components/ui/MoneyInput';
import { 
  calculateFinancing, 
  calculateConsortium, 
  calculateInvestToBuy 
} from '../thePlanMath';

interface Props {
  defaultAssetType?: 'property' | 'vehicle';
}

export const FinancingVsConsortiumCalculator: React.FC<Props> = ({ defaultAssetType = 'property' }) => {
  const isProperty = defaultAssetType === 'property';

  // Inputs
  const [totalValueStr, setTotalValueStr] = useState(isProperty ? '450.000,00' : '90.000,00');
  const [downPaymentStr, setDownPaymentStr] = useState(isProperty ? '90.000,00' : '20.000,00');
  const [years, setYears] = useState(isProperty ? 25 : 5);
  const [annualRate, setAnnualRate] = useState(isProperty ? 10.5 : 18.0); // 10.5% a.a. habitacional ou 18% a.a. auto
  const [adminFee, setAdminFee] = useState(isProperty ? 18.0 : 15.0); // Taxa adm consórcio
  const [financingSystem, setFinancingSystem] = useState<'SAC' | 'PRICE'>('SAC');

  // Parse values
  const totalValue = parseFloat(totalValueStr.replace(/\./g, '').replace(',', '.')) || 0;
  const downPayment = parseFloat(downPaymentStr.replace(/\./g, '').replace(',', '.')) || 0;
  const months = Math.max(12, years * 12);

  // Calculations
  const financing = useMemo(() => {
    return calculateFinancing(totalValue, downPayment, annualRate, months, financingSystem, isProperty);
  }, [totalValue, downPayment, annualRate, months, financingSystem, isProperty]);

  const consortium = useMemo(() => {
    return calculateConsortium(totalValue, months, adminFee, 2);
  }, [totalValue, months, adminFee]);

  const investToBuy = useMemo(() => {
    // Aporte mensal equivalente à parcela inicial do financiamento
    const monthlyContribution = financing.initialPayment;
    return calculateInvestToBuy(totalValue, downPayment, monthlyContribution, 10.5, isProperty ? 8 : 6);
  }, [totalValue, downPayment, financing.initialPayment, isProperty]);

  // Chart data
  const chartData = [
    {
      name: `Financiamento (${financingSystem})`,
      valorOriginal: totalValue,
      custoTotal: Math.round(financing.totalWithAdditional),
      jurosTaxas: Math.round(financing.totalInterest + financing.additionalCosts),
      color: '#EF4444' // vermelho
    },
    {
      name: 'Consórcio',
      valorOriginal: totalValue,
      custoTotal: Math.round(consortium.totalPaid),
      jurosTaxas: Math.round(consortium.totalFeesPaid),
      color: '#F59E0B' // amarelo/laranja
    },
    {
      name: 'Investir & Comprar à Vista',
      valorOriginal: Math.round(investToBuy.cashTargetAmount),
      custoTotal: Math.round(investToBuy.totalInvested),
      jurosTaxas: 0,
      rendimentoGanho: Math.round(investToBuy.totalInterestEarned),
      color: '#10B981' // verde
    }
  ];

  return (
    <div className="sim-container anim-fade-up">
      <div className="sim-header">
        <div>
          <h3 className="sim-header__title">
            <Scale size={22} color="var(--brand-primary)" />
            Simulador Comparativo: Financiamento vs. Consórcio vs. À Vista
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Descubra exatamente quanto do seu dinheiro vai para o banco, quanto vai para taxas e quanto você economiza.
          </p>
        </div>

        <div className="tx-pills">
          <button 
            type="button" 
            className={`tx-pill-btn ${financingSystem === 'SAC' ? 'tx-pill-btn--active' : ''}`}
            onClick={() => setFinancingSystem('SAC')}
          >
            Tabela SAC (Decrescente)
          </button>
          <button 
            type="button" 
            className={`tx-pill-btn ${financingSystem === 'PRICE' ? 'tx-pill-btn--active' : ''}`}
            onClick={() => setFinancingSystem('PRICE')}
          >
            Tabela Price (Fixa)
          </button>
        </div>
      </div>

      {/* Grid de Inputs */}
      <div className="sim-grid-inputs">
        <div className="sim-input-group">
          <label className="afic-label">Valor do {isProperty ? 'Imóvel' : 'Veículo'} (R$)</label>
          <MoneyInput value={totalValueStr} onChange={setTotalValueStr} />
        </div>

        <div className="sim-input-group">
          <label className="afic-label">Entrada Disponível (R$)</label>
          <MoneyInput value={downPaymentStr} onChange={setDownPaymentStr} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Equivale a {totalValue > 0 ? ((downPayment / totalValue) * 100).toFixed(0) : 0}% do valor total
          </span>
        </div>

        <div className="sim-input-group">
          <label className="afic-label">Prazo Desejado</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="range" 
              min={isProperty ? 5 : 1} 
              max={isProperty ? 35 : 7} 
              value={years} 
              onChange={e => setYears(Number(e.target.value))}
            />
            <span style={{ fontWeight: 800, minWidth: '60px', textAlign: 'right' }}>{years} anos</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{months} meses</span>
        </div>

        <div className="sim-input-group">
          <label className="afic-label">Juros Financiamento (% a.a.)</label>
          <input 
            type="number" 
            step="0.1" 
            value={annualRate} 
            onChange={e => setAnnualRate(Number(e.target.value))} 
            className="tx-search-input"
          />
        </div>

        <div className="sim-input-group">
          <label className="afic-label">Taxa Adm. Consórcio (% Total)</label>
          <input 
            type="number" 
            step="0.5" 
            value={adminFee} 
            onChange={e => setAdminFee(Number(e.target.value))} 
            className="tx-search-input"
          />
        </div>
      </div>

      {/* Cards de Comparação Lado a Lado */}
      <div className="sim-comparison-cards">
        {/* Financiamento */}
        <div className="sim-compare-card">
          <span className="sim-compare-card__tag" style={{ color: 'var(--danger)' }}>
            Financiamento ({financingSystem})
          </span>
          <span className="sim-compare-card__val" style={{ color: 'var(--danger)' }}>
            {financing.totalWithAdditional.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <div className="sim-compare-card__sub">
            <div>Parcela inicial: <strong>{financing.initialPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
            <div>Parcela final: <strong>{financing.finalPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
            <div style={{ color: 'var(--danger)', marginTop: '0.25rem' }}>
              + {financing.totalInterest.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} só em juros bancários
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              + {financing.additionalCosts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (ITBI/Cartório/Taxas)
            </div>
          </div>
        </div>

        {/* Consórcio */}
        <div className="sim-compare-card">
          <span className="sim-compare-card__tag" style={{ color: 'var(--warning)' }}>
            Consórcio Estratégico
          </span>
          <span className="sim-compare-card__val" style={{ color: 'var(--warning)' }}>
            {consortium.totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <div className="sim-compare-card__sub">
            <div>Parcela mensal: <strong>{consortium.monthlyPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
            <div>Sem juros bancários (apenas taxa de adm diluída)</div>
            <div style={{ color: 'var(--warning)', marginTop: '0.25rem' }}>
              Economia de {(financing.totalWithAdditional - consortium.totalPaid).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} vs. financiamento
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Lance sugerido p/ contemplar rápido: ~{consortium.bidRequiredForFastContemplation.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </div>
        </div>

        {/* Investir & Comprar à Vista */}
        <div className="sim-compare-card sim-compare-card--best">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="sim-compare-card__tag" style={{ color: 'var(--success)' }}>
              Investir & Comprar à Vista
            </span>
            <span className="plan-strategy-card__badge badge--success">Mais Inteligente</span>
          </div>
          <span className="sim-compare-card__val" style={{ color: 'var(--success)' }}>
            {investToBuy.totalInvested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <div className="sim-compare-card__sub">
            <div>Tempo para comprar: <strong>{Math.floor(investToBuy.monthsToReachGoal / 12)} anos e {investToBuy.monthsToReachGoal % 12} meses</strong></div>
            <div style={{ color: 'var(--success)', fontWeight: 700 }}>
              Você atinge o valor em menos de {((investToBuy.monthsToReachGoal / months) * 100).toFixed(0)}% do tempo do financiamento!
            </div>
            <div style={{ color: 'var(--brand-primary)', marginTop: '0.25rem' }}>
              + {investToBuy.totalInterestEarned.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} recebidos em juros a seu favor
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico Comparativo */}
      <div style={{ height: '300px', marginTop: '1rem' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
          Comparativo do Custo Total Desembolsado (R$)
        </h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 5 }}>
            <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickFormatter={v => `R$ ${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="name" stroke="var(--text-secondary)" fontSize={12} width={130} />
            <Tooltip 
              formatter={(value: any) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Total']}
              contentStyle={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
            />
            <Bar dataKey="custoTotal" radius={[0, 8, 8, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Veredito AFIC */}
      <div className="hack-banner">
        <Sparkles size={28} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
        <div>
          <h4 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Veredito Estratégico AFIC
          </h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            No financiamento de {years} anos, você pagaria o equivalente a <strong>{((financing.totalWithAdditional / totalValue)).toFixed(2)}x</strong> o valor real do bem. 
            Se você não tem urgência imediata de mudar hoje, poupar e investir a mesma parcela permite comprar o bem à vista em <strong>{Math.floor(investToBuy.monthsToReachGoal / 12)} anos</strong>, poupando <strong>{(financing.totalWithAdditional - investToBuy.totalInvested).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>.
            Caso precise da posse em 1 a 3 anos, o <strong>Consórcio Estratégico com lance planejado</strong> é a ponte perfeita com custo até 60% menor que o banco.
          </p>
        </div>
      </div>
    </div>
  );
};
