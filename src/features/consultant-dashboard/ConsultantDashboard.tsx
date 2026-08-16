import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, Activity, ArrowRight, Loader2, X, Trash2, 
  TrendingUp, AlertTriangle, ShieldCheck, DollarSign, MessageCircle, 
  Sparkles
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { calculateHealthScore, getScoreStatus } from '../../utils/scoreCalculator';

const statusColors: Record<string, string> = {
  excellent: 'var(--success)',
  good: '#60A5FA',
  attention: 'var(--warning)',
  critical: 'var(--danger)'
};

const statusLabels: Record<string, string> = {
  excellent: 'Excelente',
  good: 'Bom',
  attention: 'Atenção',
  critical: 'Crítico'
};

export const ConsultantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'attention_critical' | 'good_excellent' | 'high_equity'>('all');
  const [clients, setClients] = useState<any[]>([]);
  const [clientAssetsMap, setClientAssetsMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPassword, setNewClientPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Delete Confirmation State
  const [clientToDelete, setClientToDelete] = useState<{ id: string, name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const [usersRes, assetsRes] = await Promise.all([
        supabase
          .from('users')
          .select(`
            id, 
            full_name,
            created_at,
            financial_profiles (
              health_score,
              status,
              monthly_income,
              fixed_costs,
              total_debt,
              total_equity,
              goal_long
            )
          `)
          .eq('role', 'client'),
        supabase
          .from('client_assets')
          .select('user_id, total_value')
      ]);
        
      if (usersRes.data && !usersRes.error) {
        setClients(usersRes.data);
      } else if (usersRes.error) {
        console.error("Erro no Supabase (users):", usersRes.error);
        toast.error(`Erro ao buscar clientes: ${usersRes.error.message}`);
      }

      if (assetsRes.data && !assetsRes.error) {
        const map: Record<string, number> = {};
        assetsRes.data.forEach((item: any) => {
          map[item.user_id] = (map[item.user_id] || 0) + (Number(item.total_value) || 0);
        });
        setClientAssetsMap(map);
      } else if (assetsRes.error) {
        console.error("Erro no Supabase (assets):", assetsRes.error);
      }
    } catch (err) {
      console.error('Erro ao buscar clientes', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setModalMessage('');

    try {
      const { error } = await supabase.auth.signUp({
        email: newClientEmail,
        password: newClientPassword,
        options: {
          data: {
            full_name: newClientName,
          }
        }
      });

      if (error) throw error;

      setModalMessage('Cliente criado com sucesso! Devido a regras de segurança, o sistema deslogou você. Você será redirecionado para o login em 3 segundos.');
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 3500);
      
    } catch (err: any) {
      setModalMessage(`Erro: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;
    setDeleting(true);
    
    try {
      const { error } = await supabase.from('users').delete().eq('id', clientToDelete.id);
      if (error) throw error;
      
      toast.success('Cliente removido com sucesso.');
      setClients(clients.filter(c => c.id !== clientToDelete.id));
      setClientToDelete(null);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir cliente. Verifique suas permissões.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSyncScores = async () => {
    setSyncing(true);
    try {
      const { data: profiles, error: fetchErr } = await supabase.from('financial_profiles').select('*');
      if (fetchErr) throw fetchErr;

      if (profiles && profiles.length > 0) {
        let successCount = 0;
        for (const p of profiles) {
          const newScore = calculateHealthScore(
            p.monthly_income || 0,
            p.fixed_costs || 0,
            p.total_debt || 0,
            p.total_equity || 0
          );
          const newStatus = getScoreStatus(newScore);
          const { data } = await supabase.from('financial_profiles').update({ health_score: newScore, status: newStatus }).eq('user_id', p.user_id).select();
          if (data && data.length > 0) successCount++;
        }
        
        if (successCount === 0) {
           throw new Error('Nenhum score foi atualizado. Verifique as políticas de segurança (RLS) do Supabase.');
        }
        
        toast.success(`Scores de ${successCount} clientes atualizados com a nova regra!`);
        fetchClients();
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao sincronizar scores.');
    } finally {
      setSyncing(false);
    }
  };

  // Helper metrics
  const { totalAUM, avgScore, attentionCount, totalMonthlySurplus, criticalClients } = useMemo(() => {
    let totalEquitySum = 0;
    let totalScoreSum = 0;
    let attention = 0;
    let surplus = 0;
    const criticalList: any[] = [];

    clients.forEach(c => {
      const profile = Array.isArray(c.financial_profiles) ? c.financial_profiles[0] : c.financial_profiles;
      const equity = Number(profile?.total_equity || 0);
      const assetsVal = Number(clientAssetsMap[c.id] || 0);
      totalEquitySum += Math.max(equity, assetsVal);

      const score = profile?.health_score || 0;
      totalScoreSum += score;

      const income = Number(profile?.monthly_income || 0);
      const fixed = Number(profile?.fixed_costs || 0);
      if (income > fixed) {
        surplus += (income - fixed);
      }

      if (['attention', 'critical'].includes(profile?.status) || score < 50) {
        attention++;
        criticalList.push({
          id: c.id,
          name: c.full_name,
          score,
          status: profile?.status,
          fixedCostRatio: income > 0 ? (fixed / income) * 100 : 0
        });
      }
    });

    return {
      totalAUM: totalEquitySum,
      avgScore: clients.length > 0 ? Math.round(totalScoreSum / clients.length) : 0,
      attentionCount: attention,
      totalMonthlySurplus: surplus,
      criticalClients: criticalList
    };
  }, [clients, clientAssetsMap]);

  // Filtering
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.email?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      const profile = Array.isArray(c.financial_profiles) ? c.financial_profiles[0] : c.financial_profiles;
      const score = profile?.health_score || 0;
      const equity = Number(profile?.total_equity || 0);

      if (statusFilter === 'attention_critical') {
        return ['attention', 'critical'].includes(profile?.status) || score < 50;
      }
      if (statusFilter === 'good_excellent') {
        return ['good', 'excellent'].includes(profile?.status) && score >= 50;
      }
      if (statusFilter === 'high_equity') {
        return equity >= 100000;
      }
      return true;
    });
  }, [clients, searchTerm, statusFilter]);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="anim-spin" size={40} color="var(--brand-primary)" />
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem 1.25rem 5.5rem', maxWidth: '1280px', margin: '0 auto' }}>
      
      {/* Top Header Cockpit */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: 800, 
              padding: '0.2rem 0.6rem', 
              borderRadius: 'var(--r-sm)', 
              background: 'rgba(59, 130, 246, 0.15)', 
              color: '#3b82f6',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Cockpit do Consultor AFIC
            </span>
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Painel Executivo de Clientes
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Acompanhamento 360°, gestão de patrimônio, alertas de rebalanceamento e produtividade.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={handleSyncScores} disabled={syncing} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {syncing ? <Loader2 className="anim-spin" size={18} /> : <Activity size={18} />} Recalcular Scores
          </Button>
          <Button variant="primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(234, 179, 8, 0.25)' }}>
            <Plus size={18} /> Novo Cliente
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        
        {/* AUM Card */}
        <Card style={{ padding: '1.25rem', borderLeft: '4px solid var(--brand-primary)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Patrimônio Sob Consultoria (AUM)
              </span>
              <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem' }}>
                {totalAUM.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </h3>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--r-md)', background: 'rgba(234, 179, 8, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
              <DollarSign size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <TrendingUp size={14} color="var(--success)" />
            <span>Consolidado de {clients.length} cliente(s)</span>
          </div>
        </Card>

        {/* Score Médio */}
        <Card style={{ padding: '1.25rem', borderLeft: '4px solid #60A5FA' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Score Médio da Carteira
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.35rem' }}>
                <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#60A5FA' }}>
                  {avgScore}
                </h3>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>/ 100</span>
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--r-md)', background: 'rgba(96, 165, 250, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA' }}>
              <ShieldCheck size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Índice Geral: <strong>{getScoreStatus(avgScore).toUpperCase()}</strong></span>
          </div>
        </Card>

        {/* Atenção Requerida */}
        <Card style={{ padding: '1.25rem', borderLeft: `4px solid ${attentionCount > 0 ? 'var(--danger)' : 'var(--success)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Atenção Prioritária
              </span>
              <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: attentionCount > 0 ? 'var(--danger)' : 'var(--success)', marginTop: '0.35rem' }}>
                {attentionCount} {attentionCount === 1 ? 'Cliente' : 'Clientes'}
              </h3>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--r-md)', background: attentionCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: attentionCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
              <AlertTriangle size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>{attentionCount > 0 ? 'Exigem intervenção e plano de ação' : 'Toda a carteira em dia'}</span>
          </div>
        </Card>

        {/* Potencial de Aporte Mensal */}
        <Card style={{ padding: '1.25rem', borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Capacidade Mensal de Aporte
              </span>
              <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.35rem' }}>
                {totalMonthlySurplus.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </h3>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--r-md)', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
              <Sparkles size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Sobra orçamentária para novos investimentos</span>
          </div>
        </Card>

      </div>

      {/* Radar de Ações do Dia (Se houver clientes críticos) */}
      {criticalClients.length > 0 && (
        <Card style={{ padding: '1.25rem', marginBottom: '2rem', background: 'rgba(239, 68, 68, 0.04)', borderColor: 'rgba(239, 68, 68, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <AlertTriangle size={18} color="var(--danger)" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--danger)' }}>
              Radar de Prioridades do Dia ({criticalClients.length} clientes requerem ação rápida)
            </h4>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {criticalClients.map(c => (
              <div 
                key={c.id}
                onClick={() => navigate(`/consultor/client/${c.id}`)}
                style={{ 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border-color)', 
                  padding: '0.75rem 1rem', 
                  borderRadius: 'var(--r-md)',
                  minWidth: '240px',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, border-color 0.15s ease'
                }}
                className="hover-card"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{c.name}</strong>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--danger)' }}>Score {c.score}</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {c.fixedCostRatio > 70 ? `Custos Fixos Altos (${c.fixedCostRatio.toFixed(0)}% da renda)` : 'Necessita plano de ação'}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main Table Container */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
        
        {/* Table Toolbar & Filters */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Search */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou e-mail..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '100%', borderRadius: 'var(--r-md)' }}
            />
          </div>

          {/* Quick Segment Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
            <button
              onClick={() => setStatusFilter('all')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--r-md)',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: '1px solid',
                borderColor: statusFilter === 'all' ? 'var(--brand-primary)' : 'var(--border-color)',
                background: statusFilter === 'all' ? 'var(--brand-primary)' : 'transparent',
                color: statusFilter === 'all' ? '#000' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Todos ({clients.length})
            </button>

            <button
              onClick={() => setStatusFilter('attention_critical')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--r-md)',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: '1px solid',
                borderColor: statusFilter === 'attention_critical' ? 'var(--danger)' : 'var(--border-color)',
                background: statusFilter === 'attention_critical' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                color: statusFilter === 'attention_critical' ? 'var(--danger)' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              🔴 Atenção / Crítico ({attentionCount})
            </button>

            <button
              onClick={() => setStatusFilter('good_excellent')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--r-md)',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: '1px solid',
                borderColor: statusFilter === 'good_excellent' ? 'var(--success)' : 'var(--border-color)',
                background: statusFilter === 'good_excellent' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: statusFilter === 'good_excellent' ? 'var(--success)' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              🟢 Saudáveis ({clients.length - attentionCount})
            </button>

            <button
              onClick={() => setStatusFilter('high_equity')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--r-md)',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: '1px solid',
                borderColor: statusFilter === 'high_equity' ? '#3b82f6' : 'var(--border-color)',
                background: statusFilter === 'high_equity' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: statusFilter === 'high_equity' ? '#3b82f6' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              💎 Patrimônio 100k+
            </button>
          </div>

        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <tr>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Cliente</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Patrimônio / Carteira</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Renda / Custos</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Health Score</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 700, textAlign: 'right' }}>Ações Rápidas</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => {
                const p = Array.isArray(client.financial_profiles) ? client.financial_profiles[0] : client.financial_profiles;
                const score = p?.health_score || 0;
                const statusStr = p?.status || 'good';
                const income = Number(p?.monthly_income || 0);
                const fixed = Number(p?.fixed_costs || 0);
                const equity = Number(p?.total_equity || 0);
                const assetsVal = Number(clientAssetsMap[client.id] || 0);
                const displayEquity = Math.max(equity, assetsVal);
                const fixedPct = income > 0 ? Math.round((fixed / income) * 100) : 0;
                
                const statusColor = statusColors[statusStr] || statusColors['good'];
                const statusLabel = statusLabels[statusStr] || statusLabels['good'];

                // Format WhatsApp message link
                const firstName = client.full_name?.split(' ')[0] || 'Cliente';
                const waMessage = encodeURIComponent(`Olá ${firstName}, tudo bem? Aqui é o seu consultor financeiro da AFIC. Gostaria de alinhar nossos próximos passos do seu planejamento financeiro.`);
                const waUrl = `https://api.whatsapp.com/send?text=${waMessage}`;

                return (
                  <tr key={client.id} style={{ borderTop: '1px solid var(--border-color)', transition: 'background var(--ease-fast)' }} className="table-row-hover">
                    
                    {/* Cliente Info */}
                    <td style={{ padding: '1.1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{ 
                          width: '42px', 
                          height: '42px', 
                          borderRadius: '50%', 
                          background: 'rgba(234, 179, 8, 0.12)', 
                          color: 'var(--brand-primary)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontWeight: 800, 
                          fontSize: '1rem',
                          border: '1px solid rgba(234, 179, 8, 0.3)' 
                        }}>
                          {client.full_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{client.full_name}</p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{client.email || 'Cliente AFIC'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Patrimônio / Carteira */}
                    <td style={{ padding: '1.1rem 1.25rem' }}>
                      <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem', display: 'block' }}>
                        {displayEquity > 0 ? displayEquity.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : 'R$ 0'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {assetsVal > 0 ? `R$ ${assetsVal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} em ativos` : 'Sem carteira cadastrada'}
                      </span>
                    </td>

                    {/* Renda & Custos */}
                    <td style={{ padding: '1.1rem 1.25rem' }}>
                      <div style={{ fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          Renda: {income > 0 ? income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : 'N/D'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                          <span style={{ fontSize: '0.75rem', color: fixedPct > 70 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                            Fixo: {fixedPct}% ({fixed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })})
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Health Score */}
                    <td style={{ padding: '1.1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: statusColor }}>{score}</span>
                            <span style={{ 
                              display: 'inline-block', 
                              padding: '0.15rem 0.45rem', 
                              borderRadius: '999px', 
                              fontSize: '0.65rem', 
                              fontWeight: 700, 
                              background: `${statusColor}20`, 
                              color: statusColor,
                              textTransform: 'uppercase'
                            }}>
                              {statusLabel}
                            </span>
                          </div>
                          <div style={{ width: '80px', height: '5px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, Math.max(5, score))}%`, height: '100%', background: statusColor }} />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Ações Rápidas */}
                    <td style={{ padding: '1.1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        
                        {/* WhatsApp Quick Action */}
                        <a 
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '0.45rem',
                            borderRadius: 'var(--r-md)',
                            background: 'rgba(34, 197, 94, 0.1)',
                            color: 'var(--success)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textDecoration: 'none'
                          }}
                          title="Enviar WhatsApp Rápido"
                        >
                          <MessageCircle size={17} />
                        </a>

                        {/* Botão Diagnóstico 360 */}
                        <Button 
                          variant="primary" 
                          size="sm" 
                          onClick={() => navigate(`/consultor/client/${client.id}`)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                        >
                          Atendimento 360° <ArrowRight size={14} />
                        </Button>

                        {/* Excluir */}
                        <button 
                          onClick={() => setClientToDelete({ id: client.id, name: client.full_name })}
                          style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.45rem', opacity: 0.7 }}
                          title="Excluir Cliente"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
              
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      Nenhum cliente encontrado
                    </p>
                    <p style={{ fontSize: '0.85rem' }}>Tente ajustar a busca ou os filtros acima.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal Criar Cliente */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="anim-fade-up" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--r-xl)', width: '100%', maxWidth: '450px', border: '1px solid var(--border-color)', position: 'relative' }}>
            <button onClick={() => !creating && setIsModalOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>Cadastrar Novo Cliente</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Crie o acesso para seu cliente iniciar o Onboarding financeiro.</p>
            
            <form onSubmit={handleCreateClient} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="afic-label">Nome Completo</label>
                <input type="text" required value={newClientName} onChange={e => setNewClientName(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="afic-label">E-mail</label>
                <input type="email" required value={newClientEmail} onChange={e => setNewClientEmail(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="afic-label">Senha Inicial</label>
                <input type="password" required minLength={6} value={newClientPassword} onChange={e => setNewClientPassword(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Mínimo 6 caracteres.</p>
              </div>

              {modalMessage && (
                <div style={{ padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--r-md)', fontSize: '0.875rem', color: modalMessage.includes('Erro') ? 'var(--danger)' : 'var(--success)' }}>
                  {modalMessage}
                </div>
              )}

              <Button type="submit" fullWidth disabled={creating} style={{ marginTop: '1rem' }}>
                {creating ? 'Cadastrando...' : 'Criar Cliente'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {clientToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="anim-fade-up" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--r-xl)', width: '100%', maxWidth: '420px', border: '1px solid var(--danger)', position: 'relative', textAlign: 'center' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <Trash2 size={28} color="var(--danger)" />
            </div>
            
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Excluir Cliente?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
              Tem certeza que deseja excluir <strong>{clientToDelete.name}</strong>? Essa ação é permanente e removerá todos os dados, metas e lançamentos vinculados.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Button variant="outline" onClick={() => setClientToDelete(null)} disabled={deleting}>
                Cancelar
              </Button>
              <Button onClick={confirmDeleteClient} disabled={deleting} style={{ background: 'var(--danger)', color: '#fff', border: 'none' }}>
                {deleting ? 'Excluindo...' : 'Sim, Excluir'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
