import React, { useState, useMemo } from 'react';
import { Car, Sparkles } from 'lucide-react';
import { MoneyInput } from '../../../components/ui/MoneyInput';
import { calculateVehicleOwnership } from '../thePlanMath';

export const VehicleOwnershipSimulator: React.FC = () => {
  const [carValueStr, setCarValueStr] = useState('110.000,00');
  const [depreciationRate, setDepreciationRate] = useState(12.0); // 12% a.a. FIPE
  const [ipvaRate, setIpvaRate] = useState(4.0); // 4%
  const [insuranceRate, setInsuranceRate] = useState(4.5); // 4.5%
  const [maintenanceMonthly, setMaintenanceMonthly] = useState(300);
  const [opportunityRate, setOpportunityRate] = useState(10.5); // CDI líquido

  const carValue = parseFloat(carValueStr.replace(/\./g, '').replace(',', '.')) || 0;

  const result = useMemo(() => {
    return calculateVehicleOwnership(
      carValue,
      15000,
      depreciationRate,
      ipvaRate,
      insuranceRate,
      maintenanceMonthly,
      opportunityRate
    );
  }, [carValue, depreciationRate, ipvaRate, insuranceRate, maintenanceMonthly, opportunityRate]);

  // Breakdown data for pie chart
  const pieData = [
    { name: 'Depreciação Fipe', value: Math.round(result.monthlyDepreciation), color: '#EF4444' },
    { name: 'Custo de Oportunidade (CDI)', value: Math.round(result.monthlyOpportunityCost), color: '#F59E0B' },
    { name: 'IPVA & Licenciamento', value: Math.round(result.monthlyIpva), color: '#3B82F6' },
    { name: 'Seguro Automotivo', value: Math.round(result.monthlyInsurance), color: '#8B5CF6' },
    { name: 'Manutenção Preventiva', value: Math.round(result.monthlyMaintenance), color: '#10B981' },
  ];

  return (
    <div className="sim-container anim-fade-up">
      <div className="sim-header">
        <div>
          <h3 className="sim-header__title">
            <Car size={22} color="var(--brand-primary)" />
            Custo Real de Propriedade (TCO do Veículo)
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Quanto custa realmente ter um carro na garagem por mês, somando depreciação, IPVA, seguro e capital parado?
          </p>
        </div>
      </div>

      {/* Inputs */}
      <div className="sim-grid-inputs">
        <div className="sim-input-group">
          <label className="afic-label">Valor de Mercado do Carro (R$)</label>
          <MoneyInput value={carValueStr} onChange={setCarValueStr} />
        </div>

        <div className="sim-input-group">
          <label className="afic-label">Desvalorização Fipe (% a.a.)</label>
          <input 
            type="number" 
            step="0.5" 
            value={depreciationRate} 
            onChange={e => setDepreciationRate(Number(e.target.value))} 
            className="tx-search-input"
          />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Média brasileira: 10% a 15% a.a.</span>
        </div>

        <div className="sim-input-group">
          <label className="afic-label">Alíquota de IPVA (%)</label>
          <input 
            type="number" 
            step="0.5" 
            value={ipvaRate} 
            onChange={e => setIpvaRate(Number(e.target.value))} 
            className="tx-search-input"
          />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>SP/RJ/MG = 4%</span>
        </div>

        <div className="sim-input-group">
          <label className="afic-label">Seguro Anual (% do carro)</label>
          <input 
            type="number" 
            step="0.5" 
            value={insuranceRate} 
            onChange={e => setInsuranceRate(Number(e.target.value))} 
            className="tx-search-input"
          />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Média: 4% a 6%</span>
        </div>

        <div className="sim-input-group">
          <label className="afic-label">Manutenção Média (R$/mês)</label>
          <input 
            type="number" 
            value={maintenanceMonthly} 
            onChange={e => setMaintenanceMonthly(Number(e.target.value))} 
            className="tx-search-input"
          />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pneus, óleo, pastilhas, revisões</span>
        </div>

        <div className="sim-input-group">
          <label className="afic-label">Custo Oportunidade CDI (% a.a.)</label>
          <input 
            type="number" 
            step="0.5" 
            value={opportunityRate} 
            onChange={e => setOpportunityRate(Number(e.target.value))} 
            className="tx-search-input"
          />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Rendimento que o dinheiro teria investido</span>
        </div>
      </div>

      {/* Cards de Resumo do Custo */}
      <div className="sim-comparison-cards">
        <div className="sim-compare-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <span className="sim-compare-card__tag">Custo Real Invisível / Mês</span>
          <span className="sim-compare-card__val" style={{ color: 'var(--danger)' }}>
            {result.realMonthlyCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <div className="sim-compare-card__sub">
            Mesmo quitado na garagem, este é o valor real que o veículo consome todo mês sem você perceber.
          </div>
        </div>

        <div className="sim-compare-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <span className="sim-compare-card__tag">Custo Real / Ano</span>
          <span className="sim-compare-card__val" style={{ color: 'var(--warning)' }}>
            {result.realAnnualCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <div className="sim-compare-card__sub">
            Em 3 anos, o custo total de posse equivale a <strong>{((result.realAnnualCost * 3) / carValue * 100).toFixed(0)}%</strong> do preço de compra do carro!
          </div>
        </div>

        <div className="sim-compare-card" style={{ borderLeft: '4px solid var(--brand-primary)' }}>
          <span className="sim-compare-card__tag">Carro por Assinatura Equivalente</span>
          <span className="sim-compare-card__val" style={{ color: 'var(--brand-primary)' }}>
            ~{result.subscriptionMonthlyEquivalent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
          </span>
          <div className="sim-compare-card__sub">
            Plano anual com IPVA, seguro, manutenção e emplacamento 100% cobertos pela montadora/locadora.
          </div>
        </div>
      </div>

      {/* Tabela de Composição dos Custos */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--r-xl)', padding: '1.25rem' }}>
        <h4 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
          Detalhamento do Custo Mensal Oculto
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {pieData.map((item, idx) => (
            <div key={idx} style={{ borderLeft: `3px solid ${item.color}`, paddingLeft: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.name}</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500, marginLeft: '4px' }}>/mês</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regra de Ouro da AFIC para Veículos */}
      <div className="hack-banner">
        <Sparkles size={26} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Regra de Ouro AFIC para Veículos:</strong> Carro é despesa e instrumento de transporte/conforto, nunca investimento.
          <ul style={{ marginTop: '0.35rem', paddingLeft: '1.25rem' }}>
            <li><strong>Se troca a cada 1 ou 2 anos:</strong> A Assinatura (ou aluguel mensal) costuma ser matematicamente melhor porque evita tomar o baque da depreciação inicial (15% a 20% no primeiro ano).</li>
            <li><strong>Se pretende ficar 4 a 6 anos com o veículo:</strong> Comprar seminovo (2 a 3 anos de uso, com a desvalorização inicial já absorvida pelo primeiro dono) à vista ou via consórcio planejado é a forma mais barata existente no Brasil.</li>
            <li><strong>Financiamento CDC tradicional:</strong> É a pior forma possível, pois você junta juros de 20% a 30% a.a. com um bem que perde 12% a.a. de valor de mercado.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
