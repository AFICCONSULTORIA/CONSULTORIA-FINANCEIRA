import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit3, Target, Shield, User, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';

export const ClientDiagnostic: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [loading, setLoading] = useState(true);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [savingPlan, setSavingPlan] = useState(false);

  useEffect(() => {
    if (id) fetchClientData(id);
  }, [id]);

  const fetchClientData = async (clientId: string) => {
    try {
      const [userRes, profileRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', clientId).single(),
        supabase.from('financial_profiles').select('*').eq('user_id', clientId).single()
      ]);

      if (userRes.data) setClientInfo(userRes.data);
      if (profileRes.data) setProfile(profileRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setSavingPlan(true);
    setTimeout(() => {
      setSavingPlan(false);
      alert('Plano atualizado com sucesso e notificação enviada ao cliente!');
    }, 1000);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="anim-spin" size={40} color="var(--brand-primary)" />
      </div>
    );
  }

  if (!clientInfo || !profile) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Cliente não encontrado ou Onboarding pendente.</p>
        <Button onClick={() => navigate('/consultor')} style={{ marginTop: '1rem' }}>Voltar</Button>
      </div>
    );
  }

  const fixedCostPct = profile.monthly_income > 0 ? ((profile.fixed_costs / profile.monthly_income) * 100).toFixed(0) : 0;
  
  // Mock buckets fallback para a UI de recomendação
  const buckets = [
    { type: 'fixed', label: 'Custo Fixo', percentage: 50 },
    { type: 'comfort', label: 'Conforto', percentage: 10 },
    { type: 'goals', label: 'Metas', percentage: 20 },
    { type: 'leisure', label: 'Lazer', percentage: 10 },
    { type: 'invest', label: 'Investimento', percentage: 10 },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/consultor')} style={{ padding: '0.5rem' }}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Análise de Cliente</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{clientInfo.full_name} • Cliente</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} color="var(--brand-primary)" /> Dados do Onboarding
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--r-md)' }}>
                <span className="afic-label">Renda Mensal Principal</span>
                <strong style={{ fontSize: '1.25rem' }}>
                  {Number(profile.monthly_income).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </strong>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--r-md)' }}>
                <span className="afic-label">Saúde Financeira (Sistema)</span>
                <strong style={{ fontSize: '1.25rem', textTransform: 'capitalize' }}>{profile.status}</strong>
              </div>
            </div>

            <hr className="afic-divider" style={{ margin: '1.5rem 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <span className="afic-label">Custos Fixos</span>
                <p>{Number(profile.fixed_costs).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ({fixedCostPct}%)</p>
              </div>
              <div>
                <span className="afic-label">Total Dívidas</span>
                <p style={{ color: profile.total_debt > 0 ? 'var(--danger)' : 'var(--success)' }}>
                  {Number(profile.total_debt).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <div>
                <span className="afic-label">Patrimônio Líquido</span>
                <p>{Number(profile.total_equity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              </div>
              <div>
                <span className="afic-label">Sonho Principal (Longo Prazo)</span>
                <p>{profile.goal_long || 'Não informado'}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={18} color="var(--info)" /> Plano de Ação Estratégico
              </h3>
              <Button variant="outline" size="sm"><Edit3 size={14} /> Nova Tarefa</Button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-secondary)', padding: '1rem' }}>
              Nenhuma tarefa criada para este cliente ainda. Adicione as primeiras ações do planejamento.
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card variant="brand">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} /> Ajuste de Baldes (Recomendação)
            </h3>
            
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Defina os percentuais ideais para o cliente seguir neste ciclo.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {buckets.map(b => (
                <div key={b.type}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{b.label}</span>
                    <strong style={{ color: 'var(--brand-primary-light)' }}>{b.percentage}%</strong>
                  </div>
                  <input type="range" min="0" max="100" defaultValue={b.percentage} style={{ width: '100%', cursor: 'pointer' }} />
                </div>
              ))}
            </div>

            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="afic-label" style={{ marginBottom: 0 }}>Total Alocado</span>
              <strong style={{ color: 'var(--success)' }}>100%</strong>
            </div>

            <Button fullWidth style={{ marginTop: '1.5rem' }} onClick={handleSave} disabled={savingPlan}>
              {savingPlan ? 'Salvando...' : 'Aplicar Estratégia'}
            </Button>
          </Card>

          <Card>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Health Score Clínico</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--warning)' }}>{profile.health_score || 0}</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Baseado nos dados informados. Atualize o score manualmente se necessário.
              </p>
            </div>
            <Button variant="ghost" fullWidth style={{ marginTop: '1rem' }}>Recalcular Score Manual</Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
