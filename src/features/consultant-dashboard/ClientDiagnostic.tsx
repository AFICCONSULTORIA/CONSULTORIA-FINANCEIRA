import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Target, Shield, User, Loader2, Plus, CheckCircle, Circle, Trash2, X, Edit2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { TransactionManager } from '../client-dashboard/components/TransactionManager';
import { GoalTracker } from '../client-dashboard/components/GoalTracker';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { calculateHealthScore, getScoreStatus } from '../../utils/scoreCalculator';

interface ActionPlan {
  id: string;
  title: string;
  description?: string;
  category?: 'urgent' | 'organization' | 'growth';
  due_date?: string;
  status: 'pending' | 'completed';
}

interface Bucket {
  type: string;
  label: string;
  percentage: number;
}

const DEFAULT_BUCKETS: Bucket[] = [
  { type: 'fixed', label: 'Custo Fixo', percentage: 50 },
  { type: 'comfort', label: 'Conforto', percentage: 10 },
  { type: 'goals', label: 'Metas', percentage: 20 },
  { type: 'leisure', label: 'Lazer', percentage: 10 },
  { type: 'invest', label: 'Investimento', percentage: 10 },
];

export const ClientDiagnostic: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [loading, setLoading] = useState(true);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [savingPlan, setSavingPlan] = useState(false);

  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<'urgent'|'organization'|'growth'>('organization');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDesc, setEditTaskDesc] = useState('');
  const [editTaskCategory, setEditTaskCategory] = useState<'urgent'|'organization'|'growth'>('organization');
  const [editTaskDate, setEditTaskDate] = useState('');
  
  const [buckets, setBuckets] = useState<Bucket[]>(DEFAULT_BUCKETS);

  const [isRawDataModalOpen, setIsRawDataModalOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [manualScore, setManualScore] = useState<number>(0);
  const [savingScore, setSavingScore] = useState(false);

  useEffect(() => {
    if (id) fetchClientData(id);
  }, [id]);

  const fetchClientData = async (clientId: string) => {
    try {
      const [userRes, profileRes, planRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', clientId).single(),
        supabase.from('financial_profiles').select('*').eq('user_id', clientId).single(),
        supabase.from('action_plans').select('*').eq('user_id', clientId).order('created_at', { ascending: true })
      ]);

      if (userRes.data) setClientInfo(userRes.data);
      if (profileRes.data) {
        setProfile(profileRes.data);
        if (profileRes.data.buckets && Array.isArray(profileRes.data.buckets)) {
          setBuckets(profileRes.data.buckets);
        }
      }
      if (planRes.data) {
        setActionPlans(planRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !id) return;
    try {
      const { data, error } = await supabase.from('action_plans').insert({
        user_id: id,
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim() || null,
        category: newTaskCategory,
        due_date: newTaskDate || null,
        status: 'pending'
      }).select().single();
      
      if (data && !error) {
        setActionPlans([...actionPlans, data]);
        setNewTaskTitle('');
        setNewTaskDesc('');
        setNewTaskCategory('organization');
        setNewTaskDate('');
        setIsAddingTask(false);
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao adicionar tarefa.');
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    try {
      const { error } = await supabase.from('action_plans').update({ status: newStatus }).eq('id', taskId);
      if (!error) {
        setActionPlans(actionPlans.map(t => t.id === taskId ? { ...t, status: newStatus as 'pending'|'completed' } : t));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from('action_plans').delete().eq('id', taskId);
      if (!error) {
        setActionPlans(actionPlans.filter(t => t.id !== taskId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditClick = (task: ActionPlan) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskDesc(task.description || '');
    setEditTaskCategory(task.category || 'organization');
    setEditTaskDate(task.due_date ? task.due_date.split('T')[0] : '');
  };

  const handleUpdateTask = async () => {
    if (!editTaskTitle.trim() || !editingTaskId) return;
    try {
      const { error } = await supabase.from('action_plans').update({
        title: editTaskTitle.trim(),
        description: editTaskDesc.trim() || null,
        category: editTaskCategory,
        due_date: editTaskDate || null
      }).eq('id', editingTaskId);
      
      if (!error) {
        setActionPlans(actionPlans.map(t => t.id === editingTaskId ? {
          ...t, 
          title: editTaskTitle.trim(),
          description: editTaskDesc.trim() || undefined,
          category: editTaskCategory,
          due_date: editTaskDate || undefined
        } : t));
        setEditingTaskId(null);
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar tarefa.');
    }
  };

  const handleBucketChange = (type: string, value: number) => {
    setBuckets(buckets.map(b => b.type === type ? { ...b, percentage: value } : b));
  };

  const handleResetDiagnostic = async () => {
    if (!id) return;
    if (!window.confirm('Tem certeza? Isso fará com que o cliente tenha que preencher o diagnóstico novamente na próxima vez que acessar o painel.')) return;
    
    try {
      const { error } = await supabase.from('users').update({ has_completed_onboarding: false }).eq('id', id);
      if (error) throw error;
      toast.success('Diagnóstico redefinido com sucesso! O cliente preencherá novamente no próximo acesso.');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao redefinir diagnóstico. Verifique as permissões (RLS).');
    }
  };

  const handleSaveBuckets = async () => {
    if (!id) return;
    setSavingPlan(true);
    try {
      const { data, error } = await supabase.from('financial_profiles').update({ buckets }).eq('user_id', id).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Acesso bloqueado pelas políticas de segurança (RLS) do Supabase.');
      toast.success('Estratégia salva com sucesso! O cliente já pode ver a nova distribuição.');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar estratégia.');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleOpenScoreModal = () => {
    setManualScore(profile.health_score || 0);
    setIsScoreModalOpen(true);
  };

  const handleAutoCalculateScore = () => {
    if (!profile) return;
    const score = calculateHealthScore(
      profile.monthly_income || 0,
      profile.fixed_costs || 0,
      profile.total_debt || 0,
      profile.total_equity || 0
    );
    setManualScore(score);
    toast.success('Score auto-calculado com base nos dados!');
  };

  const handleSaveScore = async () => {
    if (!id) return;
    setSavingScore(true);
    try {
      const newStatus = getScoreStatus(manualScore);
      const { data, error } = await supabase.from('financial_profiles').update({ health_score: manualScore, status: newStatus }).eq('user_id', id).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Acesso bloqueado pelas políticas de segurança (RLS) do Supabase.');
      
      setProfile({ ...profile, health_score: manualScore, status: newStatus });
      setIsScoreModalOpen(false);
      toast.success('Health Score e Status atualizados com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar score.');
    } finally {
      setSavingScore(false);
    }
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
  const totalAllocated = buckets.reduce((acc, b) => acc + b.percentage, 0);

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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
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

            {profile.raw_onboarding_data && (
              <Button variant="outline" fullWidth onClick={() => setIsRawDataModalOpen(true)}>
                Ver Detalhamento Completo (Lançamentos)
              </Button>
            )}

            <Button variant="outline" fullWidth onClick={handleResetDiagnostic} style={{ marginTop: '0.75rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
              Redefinir Diagnóstico (Liberar para o cliente refazer)
            </Button>
          </Card>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={18} color="var(--info)" /> Plano de Ação Estratégico
              </h3>
              <Button variant="outline" size="sm" onClick={() => setIsAddingTask(!isAddingTask)}>
                {isAddingTask ? 'Cancelar' : <><Plus size={14} /> Nova Tarefa</>}
              </Button>
            </div>

            {isAddingTask && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', background: 'var(--bg-app)', padding: '1.25rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)' }}>
                <div>
                  <label className="afic-label">Título da Tarefa *</label>
                  <input 
                    type="text" 
                    value={newTaskTitle} 
                    onChange={e => setNewTaskTitle(e.target.value)} 
                    placeholder="Ex: Cancelar assinatura X"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
                <div>
                  <label className="afic-label">Categoria / Prioridade</label>
                  <select 
                    value={newTaskCategory}
                    onChange={e => setNewTaskCategory(e.target.value as any)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="urgent">🔴 Prioridade Alta (Urgente)</option>
                    <option value="organization">🟡 Curto Prazo (Organização)</option>
                    <option value="growth">🟢 Longo Prazo (Crescimento)</option>
                  </select>
                </div>
                <div>
                  <label className="afic-label">Como Fazer (Dica do Consultor)</label>
                  <textarea 
                    value={newTaskDesc}
                    onChange={e => setNewTaskDesc(e.target.value)}
                    placeholder="Instruções detalhadas de como o cliente deve executar esta ação..."
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', minHeight: '80px' }}
                  />
                </div>
                <div>
                  <label className="afic-label">Data Limite Sugerida (Opcional)</label>
                  <input 
                    type="date" 
                    value={newTaskDate} 
                    onChange={e => setNewTaskDate(e.target.value)} 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <Button variant="outline" onClick={() => setIsAddingTask(false)}>Cancelar</Button>
                  <Button onClick={handleAddTask}>Salvar Tarefa</Button>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {actionPlans.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', padding: '1rem' }}>Nenhuma tarefa criada para este cliente ainda. Adicione as primeiras ações do planejamento.</p>
              ) : (
                actionPlans.map(task => (
                  editingTaskId === task.id ? (
                    <div key={task.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-app)', padding: '1.25rem', borderRadius: 'var(--r-md)', border: '1px solid var(--brand-primary-light)' }}>
                      <div>
                        <label className="afic-label">Título da Tarefa *</label>
                        <input type="text" value={editTaskTitle} onChange={e => setEditTaskTitle(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }} />
                      </div>
                      <div>
                        <label className="afic-label">Categoria / Prioridade</label>
                        <select value={editTaskCategory} onChange={e => setEditTaskCategory(e.target.value as any)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}>
                          <option value="urgent">🔴 Prioridade Alta (Urgente)</option>
                          <option value="organization">🟡 Curto Prazo (Organização)</option>
                          <option value="growth">🟢 Longo Prazo (Crescimento)</option>
                        </select>
                      </div>
                      <div>
                        <label className="afic-label">Como Fazer (Dica do Consultor)</label>
                        <textarea value={editTaskDesc} onChange={e => setEditTaskDesc(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', minHeight: '80px' }} />
                      </div>
                      <div>
                        <label className="afic-label">Data Limite Sugerida (Opcional)</label>
                        <input type="date" value={editTaskDate} onChange={e => setEditTaskDate(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <Button variant="outline" onClick={() => setEditingTaskId(null)}>Cancelar</Button>
                        <Button onClick={handleUpdateTask}>Salvar Edição</Button>
                      </div>
                    </div>
                  ) : (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--r-md)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', flex: 1 }} onClick={() => handleToggleTask(task.id, task.status)}>
                        <div style={{ marginTop: '0.125rem' }}>
                          {task.status === 'completed' ? (
                            <CheckCircle size={20} color="var(--success)" />
                          ) : (
                            <Circle size={20} color="var(--brand-primary)" />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            {task.category === 'urgent' && <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>URGENTE</span>}
                            {task.category === 'organization' && <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>ORGANIZAÇÃO</span>}
                            {task.category === 'growth' && <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>CRESCIMENTO</span>}
                          </div>
                          <span style={{ color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: task.status === 'completed' ? 'line-through' : 'none', fontWeight: 600, display: 'block' }}>
                            {task.title}
                          </span>
                          {task.description && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button onClick={() => handleEditClick(task)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.5rem' }}>
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteTask(task.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', opacity: 0.7, padding: '0.5rem' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )
                ))
              )}
            </div>
          </Card>

          <Card>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              Lançamentos Financeiros do Cliente
            </h3>
            <TransactionManager targetUserId={id} />
          </Card>

          <Card>
            <GoalTracker targetUserId={id} />
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {buckets.map(b => (
                <div key={b.type}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{b.label}</span>
                    <strong style={{ color: 'var(--brand-primary-light)' }}>{b.percentage}%</strong>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={b.percentage} 
                    onChange={e => handleBucketChange(b.type, parseInt(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }} 
                  />
                </div>
              ))}
            </div>

            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="afic-label" style={{ marginBottom: 0 }}>Total Alocado</span>
              <strong style={{ color: totalAllocated === 100 ? 'var(--success)' : 'var(--danger)' }}>
                {totalAllocated}%
              </strong>
            </div>
            
            {totalAllocated !== 100 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.5rem', textAlign: 'right' }}>
                O total deve ser exatamente 100%.
              </p>
            )}

            <Button fullWidth style={{ marginTop: '1.5rem' }} onClick={handleSaveBuckets} disabled={savingPlan || totalAllocated !== 100}>
              {savingPlan ? 'Salvando...' : 'Aplicar Estratégia'}
            </Button>
          </Card>

          <Card>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Health Score Clínico</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--warning)' }}>{profile.health_score || 0}</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Baseado nos dados informados. 
              </p>
            </div>
            <Button variant="ghost" fullWidth style={{ marginTop: '1rem' }} onClick={handleOpenScoreModal}>
              Recalcular Score Manual
            </Button>
          </Card>
        </div>
      </div>

      {/* Modal de Detalhamento de Lançamentos */}
      {isRawDataModalOpen && profile.raw_onboarding_data && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="anim-fade-up" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--r-xl)', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-color)', position: 'relative' }}>
            <button onClick={() => setIsRawDataModalOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Raio-X Detalhado</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Respostas exatas fornecidas pelo cliente no Onboarding.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Rendas */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--brand-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Rendas e Dependentes</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <DetailItem label="Renda Principal" value={`R$ ${profile.raw_onboarding_data.income || '0,00'}`} />
                  <DetailItem label="Rendas Extras" value={`R$ ${profile.raw_onboarding_data.extraIncome || '0,00'}`} />
                  <DetailItem label="Dependentes" value={profile.raw_onboarding_data.dependents} />
                </div>
              </div>

              {/* Custos */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--info)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Despesas Mapeadas</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <DetailItem label="Moradia" value={`R$ ${profile.raw_onboarding_data.housing || '0,00'}`} />
                  <DetailItem label="Alimentação" value={`R$ ${profile.raw_onboarding_data.food || '0,00'}`} />
                  <DetailItem label="Saúde" value={`R$ ${profile.raw_onboarding_data.health || '0,00'}`} />
                  <DetailItem label="Transporte" value={`R$ ${profile.raw_onboarding_data.transport || '0,00'}`} />
                  <DetailItem label="Contas (Consumo)" value={`R$ ${profile.raw_onboarding_data.bills || '0,00'}`} />
                  <DetailItem label="Lazer / Estilo" value={`R$ ${profile.raw_onboarding_data.leisure || '0,00'}`} />
                </div>
              </div>

              {/* Dívidas */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Dívidas e Financiamentos</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <DetailItem label="Financ. Imóvel" value={`R$ ${profile.raw_onboarding_data.debtImovel || '0,00'}`} />
                  <DetailItem label="Financ. Veículo" value={`R$ ${profile.raw_onboarding_data.debtVeiculo || '0,00'}`} />
                  <DetailItem label="Empréstimos" value={`R$ ${profile.raw_onboarding_data.debtPessoal || '0,00'}`} />
                  <DetailItem label="Cartão Rotativo" value={`R$ ${profile.raw_onboarding_data.debtCartao || '0,00'}`} />
                  <DetailItem label="Cheque Especial/Outros" value={`R$ ${profile.raw_onboarding_data.debtOutros || '0,00'}`} />
                </div>
              </div>

              {/* Patrimônio */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#8B5CF6', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Patrimônio e Liquidez</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <DetailItem label="Conta Corrente/Poupança" value={`R$ ${profile.raw_onboarding_data.equityCC || '0,00'}`} />
                  <DetailItem label="Renda Fixa" value={`R$ ${profile.raw_onboarding_data.equityRendaFixa || '0,00'}`} />
                  <DetailItem label="Ações/FIIs" value={`R$ ${profile.raw_onboarding_data.equityRV || '0,00'}`} />
                  <DetailItem label="Imóveis" value={`R$ ${profile.raw_onboarding_data.equityImoveis || '0,00'}`} />
                  <DetailItem label="Veículos" value={`R$ ${profile.raw_onboarding_data.equityVeiculos || '0,00'}`} />
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--warning)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Sonhos e Metas</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <DetailItem label="Curto Prazo" value={`${profile.raw_onboarding_data.goalShort || '-'} (R$ ${profile.raw_onboarding_data.goalShortValue || '0,00'})`} />
                <DetailItem label="Médio Prazo" value={`${profile.raw_onboarding_data.goalMedium || '-'} (R$ ${profile.raw_onboarding_data.goalMediumValue || '0,00'})`} />
                <DetailItem label="Longo Prazo" value={profile.raw_onboarding_data.goalLong || '-'} />
                <DetailItem label="Motivação" value={profile.raw_onboarding_data.motivation || '-'} />
              </div>
            </div>

            <div style={{ marginTop: '3rem' }}>
              <Button onClick={() => setIsRawDataModalOpen(false)} fullWidth>Fechar Detalhamento</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ajuste de Score */}
      {isScoreModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="anim-fade-up" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--r-xl)', width: '100%', maxWidth: '400px', border: '1px solid var(--border-color)', position: 'relative' }}>
            <button onClick={() => setIsScoreModalOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Ajuste de Score</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Defina o Health Score ideal para o momento deste cliente.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--brand-primary-light)', lineHeight: 1 }}>{manualScore}</div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={manualScore} 
                onChange={e => setManualScore(parseInt(e.target.value))}
                style={{ width: '100%', marginTop: '1rem', cursor: 'pointer' }} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Button variant="outline" fullWidth onClick={handleAutoCalculateScore}>
                Auto-Calcular pelo Perfil
              </Button>
              <Button fullWidth onClick={handleSaveScore} disabled={savingScore}>
                {savingScore ? 'Salvando...' : 'Salvar Novo Score'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const DetailItem: React.FC<{label: string, value: string}> = ({label, value}) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
    <strong style={{ color: 'var(--text-primary)' }}>{value}</strong>
  </div>
);
