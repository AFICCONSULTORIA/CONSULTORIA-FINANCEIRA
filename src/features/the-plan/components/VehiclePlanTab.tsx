import React, { useState } from 'react';
import { 
  Car, Scale, Sparkles, DollarSign, CheckCircle, AlertTriangle, KeyRound 
} from 'lucide-react';
import { FinancingVsConsortiumCalculator } from './FinancingVsConsortiumCalculator';
import { VehicleOwnershipSimulator } from './VehicleOwnershipSimulator';

export const VehiclePlanTab: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'comparator' | 'tco'>('comparator');

  return (
    <div className="anim-fade-up">
      {/* Cards de Formas de Comprar Veículo */}
      <div className="plan-strategies-grid">
        {/* Financiamento CDC */}
        <div className="plan-strategy-card">
          <div className="plan-strategy-card__header">
            <div className="plan-strategy-card__icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger)' }}>
              <Car size={22} />
            </div>
            <span className="plan-strategy-card__badge badge--danger">Maior Destruidor de Riqueza</span>
          </div>
          <h4 className="plan-strategy-card__title">1. Financiamento CDC</h4>
          <p className="plan-strategy-card__desc">
            Juros de 18% a 30% a.a. somados à desvalorização de 12% a 15% a.a. da Tabela Fipe.
          </p>
          <ul className="plan-strategy-card__points">
            <li><CheckCircle size={14} color="var(--success)" /> Liberação imediata na concessionária.</li>
            <li><AlertTriangle size={14} color="var(--danger)" /> Em 48 meses você paga quase 2 carros e fica com 1 desvalorizado.</li>
            <li><AlertTriangle size={14} color="var(--danger)" /> IOF e Taxa de Cadastro (TAC) embutidos no saldo.</li>
          </ul>
        </div>

        {/* Consórcio Auto */}
        <div className="plan-strategy-card plan-strategy-card--highlight">
          <div className="plan-strategy-card__header">
            <div className="plan-strategy-card__icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
              <Sparkles size={22} />
            </div>
            <span className="plan-strategy-card__badge badge--warning">Planejamento Inteligente</span>
          </div>
          <h4 className="plan-strategy-card__title">2. Consórcio com Lance</h4>
          <p className="plan-strategy-card__desc">
            Prazos de 36 a 72 meses com taxas de adm pequenas (12% a 15% totais).
          </p>
          <ul className="plan-strategy-card__points">
            <li><CheckCircle size={14} color="var(--success)" /> Seu carro atual pode ser usado como lance na contemplação.</li>
            <li><CheckCircle size={14} color="var(--success)" /> Economia colossal em relação aos juros do CDC.</li>
            <li><AlertTriangle size={14} color="var(--warning)" /> Exige estratégia de lance para não ficar à mercê do sorteio.</li>
          </ul>
        </div>

        {/* Carro por Assinatura */}
        <div className="plan-strategy-card">
          <div className="plan-strategy-card__header">
            <div className="plan-strategy-card__icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: 'var(--brand-primary)' }}>
              <KeyRound size={22} />
            </div>
            <span className="plan-strategy-card__badge badge--info">Zero Dor de Cabeça</span>
          </div>
          <h4 className="plan-strategy-card__title">3. Carro por Assinatura</h4>
          <p className="plan-strategy-card__desc">
            Você paga uma mensalidade fixa e a locadora/montadora cuida de tudo.
          </p>
          <ul className="plan-strategy-card__points">
            <li><CheckCircle size={14} color="var(--success)" /> Inclusos: IPVA, emplacamento, seguro total, revisões e pneus.</li>
            <li><CheckCircle size={14} color="var(--success)" /> Você não sofre a perda financeira da depreciação Fipe do zero km.</li>
            <li><CheckCircle size={14} color="var(--success)" /> Seu capital fica 100% livre rendendo no CDI.</li>
            <li><AlertTriangle size={14} color="var(--text-muted)" /> O carro nunca será seu patrimônio (locação contínua).</li>
          </ul>
        </div>

        {/* Seminovo à Vista */}
        <div className="plan-strategy-card">
          <div className="plan-strategy-card__header">
            <div className="plan-strategy-card__icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success)' }}>
              <DollarSign size={22} />
            </div>
            <span className="plan-strategy-card__badge badge--success">O "Sweet Spot" Financeiro</span>
          </div>
          <h4 className="plan-strategy-card__title">4. Seminovo à Vista (2 a 3 anos)</h4>
          <p className="plan-strategy-card__desc">
            A melhor relação custo-benefício que existe no mercado automotivo nacional.
          </p>
          <ul className="plan-strategy-card__points">
            <li><CheckCircle size={14} color="var(--success)" /> O primeiro dono já absorveu a maior fatia da desvalorização (~25%).</li>
            <li><CheckCircle size={14} color="var(--success)" /> Carro moderno e seguro pela metade do custo de um zero km.</li>
            <li><CheckCircle size={14} color="var(--success)" /> IPVA e seguro substancialmente mais baratos.</li>
          </ul>
        </div>
      </div>

      {/* Subnavegação de Calculadoras de Veículos */}
      <div className="the-plan__subnav">
        <button 
          type="button" 
          className={`the-plan__subnav-btn ${activeTool === 'comparator' ? 'the-plan__subnav-btn--active' : ''}`}
          onClick={() => setActiveTool('comparator')}
        >
          <Scale size={16} /> Comparador Geral (CDC vs Consórcio vs À Vista)
        </button>

        <button 
          type="button" 
          className={`the-plan__subnav-btn ${activeTool === 'tco' ? 'the-plan__subnav-btn--active' : ''}`}
          onClick={() => setActiveTool('tco')}
        >
          <Car size={16} /> Custo Real de Propriedade (TCO) & Assinatura
        </button>
      </div>

      {/* Ferramenta Ativa */}
      {activeTool === 'comparator' && <FinancingVsConsortiumCalculator defaultAssetType="vehicle" />}
      {activeTool === 'tco' && <VehicleOwnershipSimulator />}
    </div>
  );
};
