import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, CheckCircle, Target, Shield, AlertTriangle, User } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { mockClient } from '../../services/mockData';

// Em um cenário real, faríamos um fetch() buscando pelo ID
export const ClientDiagnostic: React.FC = () => {
  const navigate = useNavigate();
  const [clientData] = useState(mockClient); // Mock
  const { financialData: fd } = clientData;

  const [savingPlan, setSavingPlan] = useState(false);

  const handleSave = () => {
    setSavingPlan(true);
    setTimeout(() => {
      setSavingPlan(false);
      alert('Plano atualizado com sucesso e notificação enviada ao cliente!');
    }, 1000);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/consultor')} style={{ padding: '0.5rem' }}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Análise de Cliente</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{clientData.name} • {clientData.email}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        
        {/* ── Left Column: Onboarding Data ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <Card>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} color="var(--brand-primary)" /> Dados do Onboarding
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--r-md)' }}>
                <span className="afic-label">Renda Mensal Principal</span>
                <strong style={{ fontSize: '1.25rem' }}>{fd.monthlyIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--r-md)' }}>
                <span className="afic-label">Dependentes</span>
                <strong style={{ fontSize: '1.25rem' }}>2</strong>
              </div>
            </div>

            <hr className="afic-divider" style={{ margin: '1.5rem 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <span className="afic-label">Custos Fixos Estimados</span>
                <p>R$ 6.000,00 (60%)</p>
              </div>
              <div>
                <span className="afic-label">Dívidas Críticas</span>
                <p style={{ color: 'var(--danger)' }}>R$ 2.500,00 (Cartão rotativo)</p>
              </div>
              <div>
                <span className="afic-label">Patrimônio Líquido Estimado</span>
                <p>R$ 15.000,00 (Poupança)</p>
              </div>
              <div>
                <span className="afic-label">Sonho Principal</span>
                <p>Quitar dívidas / Viagem 2027</p>
              </div>
            </div>
          </Card>

          {/* Strategy Builder (Action Plan) */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={18} color="var(--info)" /> Plano de Ação Estratégico
              </h3>
              <Button variant="outline" size="sm"><Edit3 size={14} /> Nova Tarefa</Button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {fd.actionPlan.map(task => (
                <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)' }}>
                  {task.status === 'completed' ? <CheckCircle size={18} color="var(--success)" /> : <AlertTriangle size={18} color="var(--warning)" />}
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{task.title}</strong>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{task.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </div>

        {/* ── Right Column: Strategy Builder (Buckets) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <Card variant="brand">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} /> Ajuste de Baldes (Recomendação)
            </h3>
            
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Defina os percentuais ideais para o cliente seguir neste ciclo.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {fd.buckets.map(b => (
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
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--warning)' }}>{fd.healthScore.score}</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Baseado nos dados informados, o cliente requer atenção na taxa de endividamento.
              </p>
            </div>
            <Button variant="ghost" fullWidth style={{ marginTop: '1rem' }}>Recalcular Score Manual</Button>
          </Card>

        </div>
      </div>

    </div>
  );
};
