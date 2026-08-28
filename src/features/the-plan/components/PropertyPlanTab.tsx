import React, { useState } from 'react';
import { 
  Building2, Scale, Zap, Home, DollarSign, CheckCircle, AlertTriangle, Sparkles 
} from 'lucide-react';
import { FinancingVsConsortiumCalculator } from './FinancingVsConsortiumCalculator';
import { AmortizationHackCalculator } from './AmortizationHackCalculator';
import { BuyVsRentSimulator } from './BuyVsRentSimulator';

export const PropertyPlanTab: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'comparator' | 'amortization' | 'buy_vs_rent'>('comparator');

  return (
    <div className="anim-fade-up">
      {/* Cards de Formas de Comprar Imóvel */}
      <div className="plan-strategies-grid">
        {/* Financiamento Habitacional */}
        <div className="plan-strategy-card">
          <div className="plan-strategy-card__header">
            <div className="plan-strategy-card__icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger)' }}>
              <Building2 size={22} />
            </div>
            <span className="plan-strategy-card__badge badge--danger">Posse Imediata / Maior Custo</span>
          </div>
          <h4 className="plan-strategy-card__title">1. Financiamento (SAC / Price)</h4>
          <p className="plan-strategy-card__desc">
            Você pega a chave imediatamente, mas assume juros de 10% a 12% a.a. por 30 anos.
          </p>
          <ul className="plan-strategy-card__points">
            <li><CheckCircle size={14} color="var(--success)" /> Entrega rápida da posse do imóvel.</li>
            <li><CheckCircle size={14} color="var(--success)" /> Permite usar FGTS na entrada e amortizações.</li>
            <li><AlertTriangle size={14} color="var(--danger)" /> Você paga de 2x a 3x o valor do imóvel ao banco.</li>
            <li><AlertTriangle size={14} color="var(--danger)" /> Custos ocultos: ITBI + Cartório somam ~5% do bem.</li>
          </ul>
        </div>

        {/* Consórcio Imobiliário */}
        <div className="plan-strategy-card plan-strategy-card--highlight">
          <div className="plan-strategy-card__header">
            <div className="plan-strategy-card__icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
              <Sparkles size={22} />
            </div>
            <span className="plan-strategy-card__badge badge--warning">Estratégico / Custo Médio</span>
          </div>
          <h4 className="plan-strategy-card__title">2. Consórcio com Lance</h4>
          <p className="plan-strategy-card__desc">
            Sem juros bancários. Você paga taxa de administração diluída e usa lances para contemplar rápido.
          </p>
          <ul className="plan-strategy-card__points">
            <li><CheckCircle size={14} color="var(--success)" /> Economia de até 60% vs. juros do financiamento.</li>
            <li><CheckCircle size={14} color="var(--success)" /> Lance Embutido: use até 30% da própria carta.</li>
            <li><CheckCircle size={14} color="var(--success)" /> FGTS pode ser usado para dar lance ou abater parcelas.</li>
            <li><AlertTriangle size={14} color="var(--warning)" /> Exige planejamento (não é chave na mão no 1º dia sem lance).</li>
          </ul>
        </div>

        {/* À Vista */}
        <div className="plan-strategy-card">
          <div className="plan-strategy-card__header">
            <div className="plan-strategy-card__icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success)' }}>
              <DollarSign size={22} />
            </div>
            <span className="plan-strategy-card__badge badge--success">Máxima Eficiência</span>
          </div>
          <h4 className="plan-strategy-card__title">3. Compra à Vista</h4>
          <p className="plan-strategy-card__desc">
            Juntar o valor investindo os juros a seu favor e comprando com poder de barganha.
          </p>
          <ul className="plan-strategy-card__points">
            <li><CheckCircle size={14} color="var(--success)" /> Descontos de 8% a 15% para pagamento à vista.</li>
            <li><CheckCircle size={14} color="var(--success)" /> Zero dívidas, zero juros bancários, zero risco.</li>
            <li><CheckCircle size={14} color="var(--success)" /> O tempo para atingir o valor é 50% menor que o financiamento.</li>
            <li><AlertTriangle size={14} color="var(--text-muted)" /> Exige paciência e disciplina de aportes.</li>
          </ul>
        </div>

        {/* Alugar e Investir */}
        <div className="plan-strategy-card">
          <div className="plan-strategy-card__header">
            <div className="plan-strategy-card__icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: 'var(--brand-primary)' }}>
              <Home size={22} />
            </div>
            <span className="plan-strategy-card__badge badge--info">Flexibilidade Patrimonial</span>
          </div>
          <h4 className="plan-strategy-card__title">4. Alugar & Investir</h4>
          <p className="plan-strategy-card__desc">
            Morar de aluguel por uma fração do preço e fazer a entrada e sobra de parcelas renderem no mercado.
          </p>
          <ul className="plan-strategy-card__points">
            <li><CheckCircle size={14} color="var(--success)" /> Aluguel custa ~0,35% a 0,4% a.m. vs financiamento a ~0,9% a.m.</li>
            <li><CheckCircle size={14} color="var(--success)" /> Liberdade geográfica para mudar conforme carreira e família.</li>
            <li><AlertTriangle size={14} color="var(--text-muted)" /> Não gera imóvel próprio se o usuário não investir a diferença.</li>
          </ul>
        </div>
      </div>

      {/* Subnavegação de Calculadoras de Imóveis */}
      <div className="the-plan__subnav">
        <button 
          type="button" 
          className={`the-plan__subnav-btn ${activeTool === 'comparator' ? 'the-plan__subnav-btn--active' : ''}`}
          onClick={() => setActiveTool('comparator')}
        >
          <Scale size={16} /> Comparador Geral (Financiamento vs Consórcio vs À Vista)
        </button>

        <button 
          type="button" 
          className={`the-plan__subnav-btn ${activeTool === 'amortization' ? 'the-plan__subnav-btn--active' : ''}`}
          onClick={() => setActiveTool('amortization')}
        >
          <Zap size={16} /> Acelerador de Quitação (Hack do Saldo Devedor)
        </button>

        <button 
          type="button" 
          className={`the-plan__subnav-btn ${activeTool === 'buy_vs_rent' ? 'the-plan__subnav-btn--active' : ''}`}
          onClick={() => setActiveTool('buy_vs_rent')}
        >
          <Home size={16} /> Comprar vs. Alugar & Investir
        </button>
      </div>

      {/* Ferramenta Ativa */}
      {activeTool === 'comparator' && <FinancingVsConsortiumCalculator defaultAssetType="property" />}
      {activeTool === 'amortization' && <AmortizationHackCalculator />}
      {activeTool === 'buy_vs_rent' && <BuyVsRentSimulator />}
    </div>
  );
};
