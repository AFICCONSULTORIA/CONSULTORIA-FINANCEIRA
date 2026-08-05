import React, { useEffect, useState, useMemo } from 'react';
import { 
  Calculator, Shield, Heart, Target, Smile, TrendingUp, 
  RotateCcw, Sparkles, Sliders, Info, Copy, Check
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { MoneyInput } from '../../../components/ui/MoneyInput';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

interface BucketItem {
  id: string;
  label: string;
  percentage: number;
  color: string;
  icon?: any;
  description?: string;
}

const DEFAULT_BUCKET_RATES: BucketItem[] = [
  { id: 'fixed', label: 'Custo Fixo', percentage: 50, color: '#64748B', description: 'Moradia, contas, alimentação básica e sobrevivência.' },
  { id: 'comfort', label: 'Conforto', percentage: 10, color: '#EC4899', description: 'Assinaturas, transporte confortável, pequenos mimos.' },
  { id: 'goals', label: 'Metas & Sonhos', percentage: 20, color: '#8B5CF6', description: 'Projetos de médio/longo prazo e realizações.' },
  { id: 'leisure', label: 'Lazer', percentage: 10, color: '#F59E0B', description: 'Restaurantes, viagens, saídas e entretenimento.' },
  { id: 'invest', label: 'Investimento', percentage: 10, color: '#10B981', description: 'Construção de liberdade financeira e futuro.' }
];

const BUCKET_ICONS: Record<string, any> = {
  fixed: Shield,
  comfort: Heart,
  goals: Target,
  leisure: Smile,
  invest: TrendingUp,
};

const BUCKET_COLORS = ['#64748B', '#EC4899', '#8B5CF6', '#F59E0B', '#10B981', '#06B6D4'];

export const BucketCalculator: React.FC = () => {
  const { user } = useAuth();
  const [incomeStr, setIncomeStr] = useState<string>('');
  const [userProfileIncome, setUserProfileIncome] = useState<number>(0);
  const [buckets, setBuckets] = useState<BucketItem[]>(DEFAULT_BUCKET_RATES);
  const [copied, setCopied] = useState(false);
  const [isSimulatingCustom, setIsSimulatingCustom] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('financial_profiles')
          .select('monthly_income, buckets')
          .eq('user_id', user.id)
          .single();

        if (data) {
          if (data.monthly_income > 0) {
            setUserProfileIncome(data.monthly_income);
            setIncomeStr(data.monthly_income.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
          }
          if (data.buckets && Array.isArray(data.buckets) && data.buckets.length > 0) {
            const mapped = data.buckets.map((b: any, idx: number) => ({
              id: b.type || b.id || `b_${idx}`,
              label: b.label || 'Categoria',
              percentage: b.percentage || 0,
              color: b.color || BUCKET_COLORS[idx % BUCKET_COLORS.length],
              description: DEFAULT_BUCKET_RATES.find(d => d.label === b.label)?.description || 'Distribuição planejada de renda.'
            }));
            setBuckets(mapped);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar perfil para calculadora:', err);
      }
    };
    fetchProfile();
  }, [user]);

  const parsedIncome = useMemo(() => {
    return parseFloat(incomeStr.replace(/\./g, '').replace(',', '.')) || 0;
  }, [incomeStr]);

  const totalPercentage = useMemo(() => {
    return buckets.reduce((acc, b) => acc + (Number(b.percentage) || 0), 0);
  }, [buckets]);

  const handlePercentageChange = (id: string, newPct: number) => {
    setIsSimulatingCustom(true);
    setBuckets(prev => prev.map(b => b.id === id ? { ...b, percentage: Math.max(0, Math.min(100, newPct)) } : b));
  };

  const handleResetPercentages = () => {
    setIsSimulatingCustom(false);
    setBuckets(DEFAULT_BUCKET_RATES);
  };

  const handleCopyBreakdown = () => {
    if (parsedIncome <= 0) return;
    const textLines = buckets.map(b => {
      const amt = parsedIncome * (b.percentage / 100);
      return `• ${b.label} (${b.percentage}%): ${amt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    });
    const fullText = `📊 *Divisão de Baldes Financeiros*\nValor Total: ${parsedIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n\n` + textLines.join('\n');
    
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success('Divisão copiada para a área de transferência!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Dynamic Header */}
      <Card style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(59,130,246,0.05) 100%)', border: '1px solid var(--border-brand)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="afic-badge afic-badge--brand" style={{ marginBottom: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <Sparkles size={13} /> Calculadora Inteligente
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Divisão de Baldes Financeiros
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem', maxWidth: '600px' }}>
              Insira o valor da sua Renda ou de uma entrada extra (Bônus, 13º, Freelance) para ver a alocação perfeita conforme sua estratégia.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {userProfileIncome > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIncomeStr(userProfileIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
              >
                Minha Renda
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIncomeStr('1.000,00')}
            >
              Ex: R$ 1.000
            </Button>
          </div>
        </div>

        {/* Input Area */}
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label className="afic-label" style={{ fontSize: '0.875rem' }}>Valor a Ser Simulado / Dividido</label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <MoneyInput 
                value={incomeStr}
                onChange={(v) => setIncomeStr(v)}
                placeholder="0,00"
              />
            </div>
            {parsedIncome > 0 && (
              <Button variant="outline" onClick={handleCopyBreakdown} style={{ whiteSpace: 'nowrap' }}>
                {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                {copied ? 'Copiado!' : 'Copiar Resumo'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {parsedIncome > 0 && (
        <>
          {/* Stacked Visual Bar */}
          <Card style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={16} color="var(--brand-primary)" /> Distribuição Visual Proporcional
              </span>
              <span style={{ 
                fontSize: '0.8125rem', 
                fontWeight: 700, 
                color: totalPercentage === 100 ? 'var(--success)' : totalPercentage > 100 ? 'var(--danger)' : 'var(--warning)',
                background: 'var(--bg-input)',
                padding: '0.25rem 0.625rem',
                borderRadius: 'var(--r-full)'
              }}>
                Total Alocado: {totalPercentage}%
              </span>
            </div>

            {/* Visual Bar Container */}
            <div style={{ 
              display: 'flex', 
              height: '14px', 
              borderRadius: 'var(--r-full)', 
              overflow: 'hidden', 
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)' 
            }}>
              {buckets.map((b) => {
                if (b.percentage <= 0) return null;
                return (
                  <div 
                    key={b.id} 
                    style={{ 
                      width: `${b.percentage}%`, 
                      background: b.color,
                      transition: 'width var(--ease-std)'
                    }} 
                    title={`${b.label}: ${b.percentage}%`}
                  />
                );
              })}
            </div>

            {isSimulatingCustom && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                <button 
                  onClick={handleResetPercentages}
                  style={{ background: 'transparent', border: 'none', color: 'var(--brand-primary)', fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600 }}
                >
                  <RotateCcw size={14} /> Restaurar Porcentagens Padrão
                </button>
              </div>
            )}
          </Card>

          {/* Cards de cada Balde */}
          <div className="afic-grid-2">
            {buckets.map((b) => {
              const Icon = BUCKET_ICONS[b.id] || Calculator;
              const amount = parsedIncome * (b.percentage / 100);

              return (
                <Card 
                  key={b.id}
                  style={{ 
                    borderLeft: `4px solid ${b.color}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    gap: '1rem',
                    transition: 'all var(--ease-std)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ 
                          background: `${b.color}20`, 
                          color: b.color, 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: 'var(--r-md)',
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'center'
                        }}>
                          <Icon size={18} />
                        </div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{b.label}</h4>
                      </div>

                      <span style={{ 
                        fontSize: '0.8125rem', 
                        fontWeight: 700, 
                        color: b.color, 
                        background: `${b.color}15`,
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--r-md)'
                      }}>
                        {b.percentage}%
                      </span>
                    </div>

                    <p style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '1rem' }}>
                      {b.description}
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg-input)', padding: '0.875rem', borderRadius: 'var(--r-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Valor calculado:</span>
                    <strong style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                      {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </strong>
                  </div>

                  {/* Interatividade de ajuste de porcentagem */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ajustar %:</span>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={b.percentage}
                      onChange={(e) => handlePercentageChange(b.id, Number(e.target.value))}
                      style={{ flex: 1, accentColor: b.color, cursor: 'pointer' }}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {parsedIncome <= 0 && (
        <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Info size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
          <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
            Digite um valor acima para simular a divisão em baldes.
          </p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Você também pode clicar em "Minha Renda" no topo para preencher com o seu salário cadastrado.
          </p>
        </Card>
      )}
    </div>
  );
};
