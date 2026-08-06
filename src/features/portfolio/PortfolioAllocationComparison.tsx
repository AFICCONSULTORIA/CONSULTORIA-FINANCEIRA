import { 
  Award, AlertTriangle, CheckCircle, 
  ShoppingCart, Info 
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { ClientAsset } from './ClientPortfolioManager';
import type { RecommendedAsset } from './RecommendedPortfolio';

interface PortfolioAllocationComparisonProps {
  clientAssets: ClientAsset[];
  recommendedAssets: RecommendedAsset[];
  onSelectTab?: (tab: 'client' | 'recommended') => void;
}

const CATEGORIES: ('Ações' | 'FIIs' | 'Renda Fixa' | 'Internacional' | 'Cripto')[] = [
  'Ações', 'FIIs', 'Renda Fixa', 'Internacional', 'Cripto'
];

export const PortfolioAllocationComparison: React.FC<PortfolioAllocationComparisonProps> = ({
  clientAssets,
  recommendedAssets,
  onSelectTab
}) => {
  const currentTotalValue = clientAssets.reduce((sum, a) => sum + (a.total_value || (a.quantity * a.current_price)), 0);

  // Client distribution per category
  const clientDistribution = CATEGORIES.reduce((acc, cat) => {
    const catValue = clientAssets
      .filter(a => a.category === cat)
      .reduce((s, a) => s + (a.total_value || (a.quantity * a.current_price)), 0);
    acc[cat] = currentTotalValue > 0 ? (catValue / currentTotalValue) * 100 : 0;
    return acc;
  }, {} as Record<string, number>);

  // Recommended distribution per category
  const recommendedTotalWeight = recommendedAssets.reduce((s, a) => s + a.targetWeight, 0) || 100;
  const recommendedDistribution = CATEGORIES.reduce((acc, cat) => {
    const catWeight = recommendedAssets
      .filter(a => a.category === cat)
      .reduce((s, a) => s + a.targetWeight, 0);
    acc[cat] = (catWeight / recommendedTotalWeight) * 100;
    return acc;
  }, {} as Record<string, number>);

  // Suggestions for rebalancing
  const categoryDeviations = CATEGORIES.map(cat => {
    const currentPct = clientDistribution[cat] || 0;
    const targetPct = recommendedDistribution[cat] || 0;
    const diff = currentPct - targetPct; // positive = overexposed, negative = underexposed
    return { category: cat, currentPct, targetPct, diff };
  });

  // Top recommended buys for categories that are underexposed
  const recommendedBuys = recommendedAssets.filter(a => a.status === 'COMPRAR');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Overview Banner */}
      <Card style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--r-md)', background: 'var(--primary-color)', color: '#fff' }}>
            <Award size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Comparativo de Alocação & Sugestões AFIC
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Comparamos a sua carteira atual com a alocação recomendada pela equipe AFIC para identificar desvios e sugerir novos aportes com segurança.
            </p>
          </div>
        </div>
      </Card>

      {/* Comparison Grid */}
      <Card style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
          Sua Alocação Atual vs Carteira Recomendada AFIC
        </h3>

        {currentTotalValue === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--r-md)' }}>
            <Info size={32} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Sua carteira de ativos ainda não possui lançamentos cadastrados.
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Cadastre seus investimentos na aba "Minha Carteira" para habilitar a análise e sugestões de rebalanceamento.
            </p>
            {onSelectTab && (
              <Button style={{ marginTop: '1rem' }} onClick={() => onSelectTab('client')}>
                Ir para Minha Carteira
              </Button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {categoryDeviations.map(item => {
              const colors: Record<string, string> = {
                'Ações': '#3b82f6',
                'FIIs': '#10b981',
                'Renda Fixa': '#f59e0b',
                'Internacional': '#8b5cf6',
                'Cripto': '#ec4899'
              };
              const color = colors[item.category] || '#3b82f6';
              const isBalanced = Math.abs(item.diff) <= 3;
              const isUnderexposed = item.diff < -3;
              const isOverexposed = item.diff > 3;

              return (
                <div key={item.category} style={{ background: 'var(--bg-secondary)', padding: '1rem 1.25rem', borderRadius: 'var(--r-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: color }} />
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{item.category}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem' }}>
                      {isBalanced && (
                        <span style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle size={14} /> Alocado no Alvo
                        </span>
                      )}
                      {isUnderexposed && (
                        <span style={{ color: '#3b82f6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <ShoppingCart size={14} /> Sugestão de Aporte ({Math.abs(item.diff).toFixed(1)}% abaixo)
                        </span>
                      )}
                      {isOverexposed && (
                        <span style={{ color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <AlertTriangle size={14} /> Sobre-exposto ({item.diff.toFixed(1)}% acima)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress comparisons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        <span>Sua Carteira Atual</span>
                        <strong>{item.currentPct.toFixed(1)}%</strong>
                      </div>
                      <div style={{ height: '8px', borderRadius: '4px', background: 'var(--border-color)', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(item.currentPct, 100)}%`, height: '100%', background: color }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        <span>Recomendado AFIC</span>
                        <strong>{item.targetPct.toFixed(1)}%</strong>
                      </div>
                      <div style={{ height: '8px', borderRadius: '4px', background: 'var(--border-color)', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(item.targetPct, 100)}%`, height: '100%', background: 'var(--primary-color)', opacity: 0.8 }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Suggested Acquisitions Section */}
      <Card style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Sugestões de Novas Aquisições AFIC
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Ativos recomendados pela consultoria com indicação atual de COMPRAR para direcionar seus próximos aportes.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {recommendedBuys.map(asset => (
            <div key={asset.id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--r-md)', padding: '1rem', background: 'var(--card-bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: 'var(--r-sm)', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
                  COMPRAR
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Peso Alvo: {asset.targetWeight}%
                </span>
              </div>

              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                {asset.ticker}
              </h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                {asset.name}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.75rem 0', fontSize: '0.8rem', background: 'var(--bg-secondary)', padding: '0.4rem 0.6rem', borderRadius: 'var(--r-sm)' }}>
                <span>Preço Teto:</span>
                <strong style={{ color: 'var(--primary-color)' }}>
                  {asset.maxPrice > 0 ? asset.maxPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'N/A'}
                </strong>
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                "{asset.thesis}"
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
