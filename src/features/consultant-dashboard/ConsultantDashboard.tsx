import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, MoreVertical, Activity, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { mockClient } from '../../services/mockData'; // Usando o mock existente para popular a lista

const mockClients = [
  { ...mockClient, id: '1' },
  { 
    id: '2', 
    name: 'Maria Silva', 
    email: 'maria@example.com', 
    financialData: { 
      ...mockClient.financialData, 
      healthScore: { score: 45, status: 'attention', metrics: { savingRate: 5, emergencyFundMonths: 1 } }
    }
  },
  { 
    id: '3', 
    name: 'Carlos Santos', 
    email: 'carlos@example.com', 
    financialData: { 
      ...mockClient.financialData, 
      healthScore: { score: 92, status: 'excellent', metrics: { savingRate: 25, emergencyFundMonths: 8 } }
    }
  }
];

const statusColors = {
  excellent: 'var(--success)',
  good: '#60A5FA',
  attention: 'var(--warning)',
  critical: 'var(--danger)'
};

const statusLabels = {
  excellent: 'Excelente',
  good: 'Bom',
  attention: 'Atenção',
  critical: 'Crítico'
};

export const ConsultantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = mockClients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '3rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Meus Clientes</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Visão geral da carteira de consultoria e status de saúde financeira.</p>
        </div>
        <Button variant="primary"><Plus size={18} /> Novo Cliente</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card" style={{ background: 'var(--bg-card)' }}>
          <span className="afic-metric-label">Total de Clientes</span>
          <span className="afic-metric-value">{mockClients.length}</span>
        </div>
        <div className="stat-card" style={{ background: 'var(--bg-card)' }}>
          <span className="afic-metric-label">Score Médio da Carteira</span>
          <span className="afic-metric-value text-brand">
            {Math.round(mockClients.reduce((acc, curr) => acc + curr.financialData.healthScore.score, 0) / mockClients.length)}
          </span>
        </div>
        <div className="stat-card" style={{ background: 'var(--bg-card)' }}>
          <span className="afic-metric-label">Atenção Requerida</span>
          <span className="afic-metric-value" style={{ color: 'var(--warning)' }}>
            {mockClients.filter(c => ['attention', 'critical'].includes(c.financialData.healthScore.status)).length}
          </span>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar cliente por nome ou e-mail..." 
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
              const score = client.financialData.healthScore;
              const statusColor = statusColors[score.status as keyof typeof statusColors];
              const statusLabel = statusLabels[score.status as keyof typeof statusLabels];

              return (
                <tr key={client.id} style={{ borderTop: '1px solid var(--border-color)', transition: 'background var(--ease-fast)' }} className="table-row-hover">
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{client.name}</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{client.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: statusColor }}>{score.score}</span>
                      <div style={{ width: '60px', height: '6px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${score.score}%`, height: '100%', background: statusColor }} />
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
