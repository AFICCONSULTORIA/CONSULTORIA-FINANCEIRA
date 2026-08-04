import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Activity, ArrowRight, Loader2, X, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPassword, setNewClientPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

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

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o cliente ${clientName}? Essa ação removerá o perfil, lançamentos e metas dele.`)) return;
    
    try {
      const { error } = await supabase.from('users').delete().eq('id', clientId);
      if (error) throw error;
      
      toast.success('Cliente removido com sucesso.');
      setClients(clients.filter(c => c.id !== clientId));
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir cliente. Verifique suas permissões.');
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
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
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
          <thead style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', textAlign: 'left', fontSize: '0.875rem' }}>
            <tr>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Nome Completo</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Score</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'right' }}>Ações</th>
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
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/consultor/client/${client.id}`)}>
                        Análise <ArrowRight size={16} />
                      </Button>
                      <button 
                        onClick={() => handleDeleteClient(client.id, client.full_name)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.5rem', opacity: 0.7 }}
                        title="Excluir Cliente"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
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

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="anim-fade-up" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--r-xl)', width: '100%', maxWidth: '450px', border: '1px solid var(--border-color)', position: 'relative' }}>
            <button onClick={() => !creating && setIsModalOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Cadastrar Novo Cliente</h2>
            
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

    </div>
  );
};
