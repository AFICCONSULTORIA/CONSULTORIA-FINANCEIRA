import React, { useEffect, useState } from 'react';
import { Target, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { MoneyInput } from '../../../components/ui/MoneyInput';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
}

interface GoalTrackerProps {
  targetUserId?: string;
  readOnly?: boolean;
}

export const GoalTracker: React.FC<GoalTrackerProps> = ({ targetUserId, readOnly = false }) => {
  const { user } = useAuth();
  const effectiveUserId = targetUserId || user?.id;

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formTarget, setFormTarget] = useState('');
  const [formCurrent, setFormCurrent] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (effectiveUserId) {
      fetchGoals();
    }
  }, [effectiveUserId]);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_goals')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setGoals(data || []);
    } catch (err) {
      console.error('Erro ao buscar metas:', err);
      toast.error('Erro ao carregar suas metas.');
    } finally {
      setLoading(false);
    }
  };

  const importFromDiagnostic = async () => {
    setLoading(true);
    try {
      const { data: profile, error } = await supabase.from('financial_profiles').select('raw_onboarding_data').eq('user_id', effectiveUserId).single();
      if (error) throw error;
      
      const raw = profile?.raw_onboarding_data;
      if (!raw) {
        toast.error('Nenhum dado de diagnóstico encontrado.');
        setLoading(false);
        return;
      }

      const parseMoney = (val: string) => {
        if (!val) return 0;
        return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
      };

      const newGoals = [];
      if (raw.goalShort && raw.goalShort.trim() !== '') {
        newGoals.push({ user_id: effectiveUserId, title: raw.goalShort, target_amount: parseMoney(raw.goalShortValue), current_amount: 0 });
      }
      if (raw.goalMedium && raw.goalMedium.trim() !== '') {
        newGoals.push({ user_id: effectiveUserId, title: raw.goalMedium, target_amount: parseMoney(raw.goalMediumValue), current_amount: 0 });
      }
      if (raw.goalLong && raw.goalLong.trim() !== '') {
        newGoals.push({ user_id: effectiveUserId, title: raw.goalLong, target_amount: 0, current_amount: 0 });
      }

      if (newGoals.length === 0) {
        toast.error('Nenhuma meta encontrada no diagnóstico.');
        setLoading(false);
        return;
      }

      const { error: insertErr } = await supabase.from('client_goals').insert(newGoals);
      if (insertErr) throw insertErr;

      toast.success('Metas importadas com sucesso!');
      fetchGoals();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message?.includes('security policy') ? 'Erro de Permissão (RLS): O consultor precisa ter permissão no banco para inserir metas.' : 'Erro ao importar metas.');
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingGoal(null);
    setFormTitle('');
    setFormTarget('');
    setFormCurrent('');
    setFormDeadline('');
    setIsModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setFormTitle(goal.title);
    setFormTarget(goal.target_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    setFormCurrent(goal.current_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    setFormDeadline(goal.deadline || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error('Informe o nome da meta.');
      return;
    }
    const targetNum = parseFloat(formTarget.replace(/\./g, '').replace(',', '.'));
    const currentNum = parseFloat(formCurrent.replace(/\./g, '').replace(',', '.')) || 0;

    if (isNaN(targetNum) || targetNum < 0) {
      toast.error('Informe um valor de meta válido.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        user_id: effectiveUserId,
        title: formTitle.trim(),
        target_amount: targetNum,
        current_amount: currentNum,
        deadline: formDeadline || null
      };

      if (editingGoal) {
        const { error } = await supabase.from('client_goals').update(payload).eq('id', editingGoal.id);
        if (error) throw error;
        toast.success('Meta atualizada!');
      } else {
        const { error } = await supabase.from('client_goals').insert([payload]);
        if (error) throw error;
        toast.success('Nova meta criada!');
      }

      setIsModalOpen(false);
      fetchGoals();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message?.includes('security policy') ? 'Erro de Permissão (RLS): Você não tem permissão para editar metas.' : 'Erro ao salvar a meta.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta meta?')) return;
    try {
      const { error } = await supabase.from('client_goals').delete().eq('id', id);
      if (error) throw error;
      toast.success('Meta excluída!');
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message?.includes('security policy') ? 'Erro de Permissão (RLS)' : 'Erro ao excluir meta.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={20} color="var(--brand-primary)" /> Suas Metas e Sonhos
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Acompanhe o progresso de tudo que você quer conquistar.
          </p>
        </div>
        {!readOnly && (
          <Button onClick={openCreateModal}>
            <Plus size={18} /> Nova Meta
          </Button>
        )}
      </div>

      {loading ? (
        <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Carregando metas...
        </Card>
      ) : goals.length === 0 ? (
        <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <AlertCircle size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
          <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
            Nenhuma meta cadastrada.
          </p>
          {!readOnly ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
              <p style={{ fontSize: '0.875rem' }}>
                Clique em "Nova Meta" para criar seu primeiro sonho ou puxe do seu diagnóstico inicial!
              </p>
              <Button variant="outline" onClick={importFromDiagnostic}>
                Importar Metas do Diagnóstico
              </Button>
            </div>
          ) : (
            <div style={{ marginTop: '1rem' }}>
              <Button variant="outline" onClick={importFromDiagnostic}>
                Importar Metas do Diagnóstico
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {goals.map(goal => {
            const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
            
            return (
              <Card key={goal.id} style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{goal.title}</h3>
                    {goal.deadline && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Prazo: {new Date(goal.deadline + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                  {!readOnly && (
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button onClick={() => openEditModal(goal)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(goal.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                  {goal.target_amount > 0 ? (
                    <>
                      <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-primary)', letterSpacing: '-0.02em' }}>
                        {progress.toFixed(1)}%
                      </span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        de {Number(goal.target_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      Valor a Definir
                    </span>
                  )}
                </div>

                {goal.target_amount > 0 && (
                  <div className="afic-progress" style={{ height: '8px', marginBottom: '1rem' }}>
                    <div className="afic-progress__bar" style={{ width: `${progress}%`, background: 'var(--grad-brand)' }} />
                  </div>
                )}

                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--r-md)', textAlign: 'center', marginTop: goal.target_amount === 0 ? '1rem' : '0' }}>
                  Acumulado: <strong>{Number(goal.current_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="anim-fade-up" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--r-xl)', width: '100%', maxWidth: '400px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {editingGoal ? 'Editar Meta' : 'Nova Meta'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="afic-label">Nome do Sonho / Meta *</label>
                <input 
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  placeholder="Ex: Reserva de Emergência, Carro..."
                />
              </div>

              <div>
                <label className="afic-label">Valor Total Necessário *</label>
                <MoneyInput 
                  value={formTarget}
                  onChange={v => setFormTarget(v)}
                />
              </div>

              <div>
                <label className="afic-label">Valor Já Acumulado</label>
                <MoneyInput 
                  value={formCurrent}
                  onChange={v => setFormCurrent(v)}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Atualize este valor conforme você for guardando dinheiro.
                </p>
              </div>

              <div>
                <label className="afic-label">Prazo Final (Opcional)</label>
                <input 
                  type="date"
                  value={formDeadline}
                  onChange={e => setFormDeadline(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
