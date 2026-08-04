import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Activity, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

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
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, 
          full_name,
          financial_profiles (
            health_score,
            status
          )
        `)
        .eq('role', 'client');
        
      if (data && !error) {
        setClients(data);
      }
    } catch (err) {
      console.error('Erro ao buscar clientes', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalClients = clients.length;
  let totalScore = 0;
  let attentionCount = 0;
  
  clients.forEach(c => {
    const profile = c.financial_profiles?.[0] || c.financial_profiles; // array or object depending on relation
    const profData = Array.isArray(profile) ? profile[0] : profile;
    if (profData) {
      totalScore += profData.health_score || 0;
      if (['attention', 'critical'].includes(profData.status)) attentionCount++;
    }
  });

  const avgScore = totalClients > 0 ? Math.round(totalScore / totalClients) : 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="anim-spin" size={40} color="var(--brand-primary)" />
      </div>
    );
  }

  return (
    <div style={{ padding: '3rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Meus Clientes</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Visão geral da carteira de consultoria e status de saúde financeira.</p>
        </div>
        <Button variant="primary" onClick={() => alert('Para adicionar um novo cliente, envie o link do sistema para ele se cadastrar, ou crie uma conta manualmente acessando a página de registro sem estar logado.')}>
          <Plus size={18} /> Novo Cliente
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card" style={{ background: 'var(--bg-card)' }}>
          <span className="afic-metric-label">Total de Clientes</span>
          <span className="afic-metric-value">{totalClients}</span>
        </div>
        <div className="stat-card" style={{ background: 'var(--bg-card)' }}>
          <span className="afic-metric-label">Score Médio da Carteira</span>
          <span className="afic-metric-value text-brand">{avgScore}</span>
        </div>
        <div className="stat-card" style={{ background: 'var(--bg-card)' }}>
          <span className="afic-metric-label">Atenção Requerida</span>
          <span className="afic-metric-value" style={{ color: 'var(--warning)' }}>{attentionCount}</span>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar cliente por nome..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Cliente</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Health Score</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => {
              const p = Array.isArray(client.financial_profiles) ? client.financial_profiles[0] : client.financial_profiles;
              const score = p?.health_score || 0;
              const statusStr = p?.status || 'good';
              
              const statusColor = statusColors[statusStr] || statusColors['good'];
              const statusLabel = statusLabels[statusStr] || statusLabels['good'];

              return (
                <tr key={client.id} style={{ borderTop: '1px solid var(--border-color)', transition: 'background var(--ease-fast)' }} className="table-row-hover">
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                        {client.full_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{client.full_name}</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Cliente</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: statusColor }}>{score}</span>
                      <div style={{ width: '60px', height: '6px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${score}%`, height: '100%', background: statusColor }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: `${statusColor}20`, color: statusColor }}>
                      <Activity size={12} /> {statusLabel}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate(`/consultor/client/${client.id}`)}
                      style={{ fontSize: '0.875rem' }}
                    >
                      Analisar <ArrowRight size={16} />
                    </Button>
                  </td>
                </tr>
              );
            })}
            
            {filteredClients.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
