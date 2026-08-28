import React, { useState } from 'react';
import { 
  Building2, Car, Compass, Sparkles 
} from 'lucide-react';
import { PropertyPlanTab } from './components/PropertyPlanTab';
import { VehiclePlanTab } from './components/VehiclePlanTab';
import { SmartRecommenderQuiz } from './components/SmartRecommenderQuiz';
import './ThePlan.css';

export const ThePlanDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'property' | 'vehicle' | 'recommender'>('property');

  return (
    <div className="the-plan anim-fade-up">
      {/* Hero Header */}
      <div className="the-plan__hero">
        <div className="the-plan__hero-badge">
          <Compass size={16} /> O PLANO • GPS PATRIMONIAL AFIC
        </div>
        <h1 className="the-plan__hero-title">
          Planejamento de Grandes Conquistas: Imóveis & Veículos
        </h1>
        <p className="the-plan__hero-desc">
          As duas maiores decisões financeiras da sua vida não podem ser tomadas no escuro. 
          Compare financiamentos, consórcios, compras à vista e custos reais de posse com precisão matemática.
        </p>
      </div>

      {/* Main Segment Tabs */}
      <div className="the-plan__tabs">
        <button
          type="button"
          className={`the-plan__tab-btn ${activeTab === 'property' ? 'the-plan__tab-btn--active' : ''}`}
          onClick={() => setActiveTab('property')}
        >
          <Building2 size={20} />
          <span>🏠 Imóveis (O Plano Imobiliário)</span>
        </button>

        <button
          type="button"
          className={`the-plan__tab-btn ${activeTab === 'vehicle' ? 'the-plan__tab-btn--active' : ''}`}
          onClick={() => setActiveTab('vehicle')}
        >
          <Car size={20} />
          <span>🚗 Veículos (O Plano Veicular)</span>
        </button>

        <button
          type="button"
          className={`the-plan__tab-btn ${activeTab === 'recommender' ? 'the-plan__tab-btn--active' : ''}`}
          onClick={() => setActiveTab('recommender')}
        >
          <Sparkles size={20} />
          <span>🧠 Qual é o Melhor Caminho Para Mim?</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'property' && <PropertyPlanTab />}
      {activeTab === 'vehicle' && <VehiclePlanTab />}
      {activeTab === 'recommender' && <SmartRecommenderQuiz />}
    </div>
  );
};
