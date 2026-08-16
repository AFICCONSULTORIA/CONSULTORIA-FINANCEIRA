import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Target, Shield, User, Loader2, Plus, CheckCircle, 
  Circle, Trash2, X, Edit2, MessageSquare, Send, Calendar, 
  FileText, Printer, Copy, Check, MessageCircle, Sparkles, Activity
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { TransactionManager } from '../client-dashboard/components/TransactionManager';
import { GoalTracker } from '../client-dashboard/components/GoalTracker';
import { ClientPortfolioManager } from '../portfolio/ClientPortfolioManager';
import { PortfolioInvestmentSimulatorModal } from '../portfolio/PortfolioInvestmentSimulatorModal';
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

interface ClientMessage {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface MeetingNote {
  id: string;
  meeting_date: string;
  title: string;
  summary?: string;
  decisions?: string;
  next_steps?: string;
  private_notes?: string;
  created_at: string;
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

const MESSAGE_TEMPLATES = [
  {
    title: '💸 Aporte Mensal Disponível',
    text: 'Olá! Analisei sua carteira e seu orçamento deste mês. Recomendo realizarmos os novos aportes seguindo a alocação recomendada na aba Carteira da sua plataforma AFIC. Qualquer dúvida nas compras, estou à disposição!'
  },
  {
    title: '🔄 Rebalanceamento de Carteira',
    text: 'Olá! Identifiquei que podemos fazer um ajuste estratégico na sua carteira para otimizar os dividendos e a segurança dos seus ativos. Acesse a plataforma para visualizar a nova alocação sugerida!'
  },
  {
    title: '🛡️ Reserva de Emergência',
    text: 'Olá! Como alinhamos em nosso planejamento, o foco principal no momento é fortalecer sua reserva de liquidez com risco zero (Tesouro Selic / CDB 100% CDI) antes de aumentarmos a exposição em renda variável.'
  },
  {
    title: '🎯 Parabéns pela Meta!',
    text: 'Parabéns pelo progresso! Você deu um passo gigantesco no seu planejamento financeiro. Vamos manter a consistência para alcançar a próxima meta do plano!'
  },
  {
    title: '📅 Lembrete de Reunião de Acompanhamento',
    text: 'Olá! Está chegando a hora da nossa reunião mensal de alinhamento financeiro. Por favor, atualize seus lançamentos e saldo de investimentos na plataforma para que possamos traçar os próximos passos.'
  }
];

export const ClientDiagnostic: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'diagnostic' | 'portfolio' | 'action_plan' | 'messages' | 'crm' | 'report'>('diagnostic');

  const [loading, setLoading] = useState(true);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [savingPlan, setSavingPlan] = useState(false);

  // Action Plans state
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
  
  // Buckets state
  const [buckets, setBuckets] = useState<Bucket[]>(DEFAULT_BUCKETS);

  // Score Modal state
  const [isRawDataModalOpen, setIsRawDataModalOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [manualScore, setManualScore] = useState<number>(0);
  const [savingScore, setSavingScore] = useState(false);

  // Messages state
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // CRM Meeting Notes state
  const [meetingNotes, setMeetingNotes] = useState<MeetingNote[]>([]);
  const [isAddingMeeting, setIsAddingMeeting] = useState(false);
  const [meetingDate, setMeetingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingSummary, setMeetingSummary] = useState('');
  const [meetingDecisions, setMeetingDecisions] = useState('');
  const [meetingNextSteps, setMeetingNextSteps] = useState('');
  const [meetingPrivateNotes, setMeetingPrivateNotes] = useState('');
  const [savingMeeting, setSavingMeeting] = useState(false);

  // Simulator Modal state
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState<number | null>(null);

  // Phone Edit state
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editPhoneValue, setEditPhoneValue] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    if (id) fetchClientData(id);
  }, [id]);

  const fetchClientData = async (clientId: string) => {
    try {
      const [userRes, profileRes, planRes, messagesRes, notesRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', clientId).single(),
        supabase.from('financial_profiles').select('*').eq('user_id', clientId).single(),
        supabase.from('action_plans').select('*').eq('user_id', clientId).order('created_at', { ascending: true }),
        supabase.from('client_messages').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
        supabase.from('consultant_meeting_notes').select('*').eq('client_id', clientId).order('meeting_date', { ascending: false })
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
      if (messagesRes.data) {
        setMessages(messagesRes.data);
      }
      if (notesRes.data) {
        setMeetingNotes(notesRes.data);
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
        toast.success('Tarefa adicionada ao plano do cliente!');
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao adicionar tarefa.');
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const finalMsg = textToSend || newMessage;
    if (!finalMsg.trim() || !id) return;
    setSendingMessage(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('client_messages').insert({
        client_id: id,
        consultant_id: userData?.user?.id,
        message: finalMsg.trim(),
        is_read: false
      }).select().single();
      
      if (data && !error) {
        setMessages([data, ...messages]);
        if (!textToSend) setNewMessage('');
        toast.success('Mensagem enviada com sucesso!');
      } else {
        throw error;
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao enviar mensagem.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSaveMeetingNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim() || !id) return;
    setSavingMeeting(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('consultant_meeting_notes').insert({
        client_id: id,
        consultant_id: userData?.user?.id,
        meeting_date: meetingDate,
        title: meetingTitle.trim(),
        summary: meetingSummary.trim() || null,
        decisions: meetingDecisions.trim() || null,
        next_steps: meetingNextSteps.trim() || null,
        private_notes: meetingPrivateNotes.trim() || null
      }).select().single();

      if (error) throw error;

      if (data) {
        setMeetingNotes([data, ...meetingNotes]);
        setMeetingTitle('');
        setMeetingSummary('');
        setMeetingDecisions('');
        setMeetingNextSteps('');
        setMeetingPrivateNotes('');
        setIsAddingMeeting(false);
        toast.success('Ata de reunião registrada com sucesso!');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao salvar ata de reunião. Verifique a tabela no banco.');
    } finally {
      setSavingMeeting(false);
    }
  };

  const handleDeleteMeetingNote = async (noteId: string) => {
    if (!window.confirm('Deseja excluir este registro de reunião?')) return;
    try {
      const { error } = await supabase.from('consultant_meeting_notes').delete().eq('id', noteId);
      if (!error) {
        setMeetingNotes(meetingNotes.filter(n => n.id !== noteId));
        toast.success('Registro de reunião removido.');
      }
    } catch (e) {
      console.error(e);
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
        toast.success('Tarefa removida.');
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
        toast.success('Tarefa atualizada!');
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
    if (!window.confirm('Tem certeza? Isso fará com que o cliente tenha que preencher o diagnóstico novamente no próximo acesso.')) return;
    
    try {
      const { error } = await supabase.from('users').update({ has_completed_onboarding: false }).eq('id', id);
      if (error) throw error;
      toast.success('Diagnóstico redefinido com sucesso! O cliente preencherá novamente no próximo acesso.');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao redefinir diagnóstico.');
    }
  };

  const handleSaveBuckets = async () => {
    if (!id) return;
    setSavingPlan(true);
    try {
      const { data, error } = await supabase.from('financial_profiles').update({ buckets }).eq('user_id', id).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Acesso bloqueado por RLS.');
      toast.success('Estratégia salva com sucesso! O cliente já visualiza a nova distribuição.');
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
      if (!data || data.length === 0) throw new Error('Acesso bloqueado por RLS.');
      
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

  const copyTemplateToClipboard = (templateText: string, index: number) => {
    const firstName = clientInfo?.full_name?.split(' ')[0] || 'Cliente';
    const personalized = templateText.replace(/\[Nome\]/g, firstName);
    navigator.clipboard.writeText(personalized);
    setCopiedTemplate(index);
    toast.success('Modelo copiado!');
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  const handleSavePhone = async () => {
    if (!id) return;
    setSavingPhone(true);
    try {
      const { error } = await supabase.from('users').update({ phone: editPhoneValue }).eq('id', id);
      if (error) throw error;
      setClientInfo({ ...clientInfo, phone: editPhoneValue });
      setIsEditingPhone(false);
      toast.success('Telefone atualizado com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar telefone. O usuário pode não ter permissão.');
    } finally {
      setSavingPhone(false);
    }
  };

  const startEditingPhone = () => {
    setEditPhoneValue(clientInfo?.phone || '');
    setIsEditingPhone(true);
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
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Cliente não encontrado ou Onboarding pendente</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>O cliente ainda não completou os dados iniciais de perfil.</p>
        <Button onClick={() => navigate('/consultor')}>Voltar para Meus Clientes</Button>
      </div>
    );
  }

  const fixedCostPct = profile.monthly_income > 0 ? ((profile.fixed_costs / profile.monthly_income) * 100).toFixed(0) : '0';
  const totalAllocatedBuckets = buckets.reduce((acc, b) => acc + b.percentage, 0);

  // WhatsApp quick url
  const firstName = clientInfo.full_name?.split(' ')[0] || 'Cliente';
  const waMessage = encodeURIComponent(`Olá ${firstName}, tudo bem? Aqui é o seu consultor financeiro da AFIC. Atualizei as orientações e análises do seu plano financeiro na plataforma!`);
  let waUrl = `https://api.whatsapp.com/send?text=${waMessage}`;
  
  if (clientInfo.phone) {
    const cleanPhone = clientInfo.phone.replace(/\D/g, '');
    if (cleanPhone) {
      const fullPhone = cleanPhone.length <= 11 && !cleanPhone.startsWith('55') ? `55${cleanPhone}` : cleanPhone;
      waUrl = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${waMessage}`;
    }
  }

  return (
    <div style={{ padding: '1.5rem 1.25rem 5.5rem', maxWidth: '1280px', margin: '0 auto' }}>
      
      {/* Top Header com Visão Rápida do Cliente */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/consultor')} style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {clientInfo.full_name}
              </h1>
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: 700, 
                padding: '0.2rem 0.6rem', 
                borderRadius: '999px', 
                background: 'rgba(234, 179, 8, 0.15)', 
                color: 'var(--brand-primary)' 
              }}>
                Health Score: {profile.health_score || 0}
              </span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              {clientInfo.email} • Diagnóstico 360° • 
              {isEditingPhone ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <input 
                    type="tel" 
                    value={editPhoneValue} 
                    onChange={e => setEditPhoneValue(e.target.value)} 
                    placeholder="(11) 99999-9999" 
                    style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.8rem', width: '120px' }}
                    autoFocus
                  />
                  <button onClick={handleSavePhone} disabled={savingPhone} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--success)' }} title="Salvar">
                    <Check size={14} />
                  </button>
                  <button onClick={() => setIsEditingPhone(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)' }} title="Cancelar">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <span style={{ color: clientInfo.phone ? 'inherit' : 'var(--warning)', fontWeight: clientInfo.phone ? 'normal' : 600 }}>
                    {clientInfo.phone || 'Telefone pendente'}
                  </span>
                  <button onClick={startEditingPhone} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--brand-primary)', opacity: 0.8, padding: 0, display: 'flex' }} title="Editar Telefone">
                    <Edit2 size={12} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <a 
            href={waUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              padding: '0.5rem 0.9rem',
              borderRadius: 'var(--r-md)',
              background: 'rgba(34, 197, 94, 0.15)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              textDecoration: 'none',
              border: '1px solid rgba(34, 197, 94, 0.3)'
            }}
          >
            <MessageCircle size={16} /> WhatsApp Direto
          </a>

          <Button variant="outline" size="sm" onClick={() => setActiveTab('report')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileText size={16} /> Relatório Executivo
          </Button>

          <Button variant="primary" size="sm" onClick={() => setIsSimulatorOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={16} /> Simular Aporte
          </Button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div style={{ 
        display: 'flex', 
        gap: '0.4rem', 
        borderBottom: '1px solid var(--border-color)', 
        marginBottom: '2rem', 
        overflowX: 'auto',
        paddingBottom: '0.25rem'
      }}>
        {[
          { id: 'diagnostic', label: '📊 Raio-X & Baldes', desc: 'Diagnóstico Orçamentário' },
          { id: 'portfolio', label: '💼 Carteira & Ativos', desc: 'Investimentos' },
          { id: 'action_plan', label: '📝 Plano de Ação', desc: 'Checklist Estratégico' },
          { id: 'messages', label: '💬 Mensagens & Templates', desc: 'Comunicação' },
          { id: 'crm', label: '📔 Atas & CRM de Reuniões', desc: 'Histórico' },
          { id: 'report', label: '📄 Relatório em PDF', desc: 'Entrega Final' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--r-md) var(--r-md) 0 0',
              fontWeight: activeTab === tab.id ? 800 : 600,
              fontSize: '0.9rem',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid var(--brand-primary)' : '3px solid transparent',
              background: activeTab === tab.id ? 'rgba(234, 179, 8, 0.08)' : 'transparent',
              color: activeTab === tab.id ? 'var(--brand-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 1: DIAGNÓSTICO & BALDES (RAIO-X) */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'diagnostic' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }} className="anim-fade-up">
          
          {/* Dados do Onboarding & Raio-X */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                  <User size={18} color="var(--brand-primary)" /> Raio-X do Onboarding
                </h3>
                <Button variant="ghost" size="sm" onClick={handleOpenScoreModal} style={{ fontSize: '0.75rem', color: 'var(--brand-primary)' }}>
                  <Activity size={14} /> Ajustar Score
                </Button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--r-md)' }}>
                  <span className="afic-label">Renda Mensal</span>
                  <strong style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}>
                    {Number(profile.monthly_income).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </strong>
                </div>
                <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--r-md)' }}>
                  <span className="afic-label">Health Score</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                    <strong style={{ fontSize: '1.3rem', color: 'var(--brand-primary)' }}>{profile.health_score || 0}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ 100</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <span className="afic-label">Custos Fixos</span>
                  <p style={{ fontWeight: 700, color: Number(fixedCostPct) > 70 ? 'var(--danger)' : 'var(--text-primary)' }}>
                    {Number(profile.fixed_costs).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ({fixedCostPct}%)
                  </p>
                </div>
                <div>
                  <span className="afic-label">Dívidas Totais</span>
                  <p style={{ fontWeight: 700, color: profile.total_debt > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {Number(profile.total_debt).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div>
                  <span className="afic-label">Patrimônio Líquido Declarado</span>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {Number(profile.total_equity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div>
                  <span className="afic-label">Sonho de Longo Prazo</span>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {profile.goal_long || 'Não informado'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {profile.raw_onboarding_data && (
                  <Button variant="outline" fullWidth onClick={() => setIsRawDataModalOpen(true)} style={{ fontSize: '0.85rem' }}>
                    Ver Lançamentos do Onboarding
                  </Button>
                )}
                <Button variant="outline" onClick={handleResetDiagnostic} style={{ color: 'var(--danger)', borderColor: 'var(--danger)', fontSize: '0.85rem' }}>
                  Liberar Refazer
                </Button>
              </div>
            </Card>
          </div>

          {/* Ajuste de Baldes Estratégicos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Card variant="brand">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Shield size={18} /> Estratégia de Baldes (Potes)
                </h3>
                <Button size="sm" onClick={handleSaveBuckets} disabled={savingPlan} style={{ fontSize: '0.8rem' }}>
                  {savingPlan ? 'Salvando...' : 'Salvar Distribuição'}
                </Button>
              </div>
              
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Recomendação de distribuição orçamentária para o cliente seguir.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {buckets.map(b => (
                  <div key={b.type} style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--r-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{b.label}</span>
                      <strong style={{ color: 'var(--brand-primary)', fontSize: '0.95rem' }}>
                        {b.percentage}% ({((profile.monthly_income * b.percentage) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                      </strong>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={b.percentage} 
                      onChange={e => handleBucketChange(b.type, parseInt(e.target.value))}
                      style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--brand-primary)' }} 
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="afic-label" style={{ marginBottom: 0 }}>Total Distribuído:</span>
                <strong style={{ fontSize: '1.1rem', color: totalAllocatedBuckets === 100 ? 'var(--success)' : 'var(--danger)' }}>
                  {totalAllocatedBuckets}% {totalAllocatedBuckets === 100 ? '✓ (Perfeito)' : '(Deve somar 100%)'}
                </strong>
              </div>
            </Card>
          </div>

        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 2: CARTEIRA & SIMULADOR */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'portfolio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="anim-fade-up">
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Carteira de Investimentos do Cliente
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Gerencie os ativos, atualize cotações e simule aportes recomendados.
                </p>
              </div>

              <Button variant="primary" onClick={() => setIsSimulatorOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} /> Abrir Simulador de Aporte com Preços B3
              </Button>
            </div>

            <ClientPortfolioManager targetUserId={id} readOnly={false} />
          </Card>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 3: PLANO DE AÇÃO & METAS */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'action_plan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="anim-fade-up">
          
          {/* Checklist Estratégico */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                  <Target size={20} color="var(--brand-primary)" /> Plano de Ação Estratégico
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Tarefas e missões que o cliente deve executar.</p>
              </div>
              <Button variant="primary" size="sm" onClick={() => setIsAddingTask(!isAddingTask)}>
                {isAddingTask ? 'Cancelar' : <><Plus size={16} /> Nova Tarefa</>}
              </Button>
            </div>

            {isAddingTask && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', background: 'var(--bg-app)', padding: '1.25rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)' }}>
                <div>
                  <label className="afic-label">Título da Ação *</label>
                  <input 
                    type="text" 
                    value={newTaskTitle} 
                    onChange={e => setNewTaskTitle(e.target.value)} 
                    placeholder="Ex: Abrir conta na corretora X ou cortar despesa Y"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="afic-label">Nível de Prioridade</label>
                  <select 
                    value={newTaskCategory}
                    onChange={e => setNewTaskCategory(e.target.value as any)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  >
                    <option value="urgent">🔴 Prioridade Alta (Urgente)</option>
                    <option value="organization">🟡 Curto Prazo (Organização)</option>
                    <option value="growth">🟢 Longo Prazo (Crescimento)</option>
                  </select>
                </div>
                <div>
                  <label className="afic-label">Orientações do Consultor (Como Fazer)</label>
                  <textarea 
                    value={newTaskDesc}
                    onChange={e => setNewTaskDesc(e.target.value)}
                    placeholder="Instruções claras de passo a passo para o cliente..."
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', minHeight: '80px' }}
                  />
                </div>
                <div>
                  <label className="afic-label">Data Limite Sugerida (Opcional)</label>
                  <input 
                    type="date" 
                    value={newTaskDate} 
                    onChange={e => setNewTaskDate(e.target.value)} 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <Button variant="outline" onClick={() => setIsAddingTask(false)}>Cancelar</Button>
                  <Button onClick={handleAddTask}>Salvar no Plano</Button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {actionPlans.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', padding: '1.5rem', textAlign: 'center' }}>Nenhuma tarefa cadastrada ainda.</p>
              ) : (
                actionPlans.map(task => (
                  editingTaskId === task.id ? (
                    <div key={task.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-app)', padding: '1.25rem', borderRadius: 'var(--r-md)', border: '1px solid var(--brand-primary)' }}>
                      <div>
                        <label className="afic-label">Título *</label>
                        <input type="text" value={editTaskTitle} onChange={e => setEditTaskTitle(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} />
                      </div>
                      <div>
                        <label className="afic-label">Prioridade</label>
                        <select value={editTaskCategory} onChange={e => setEditTaskCategory(e.target.value as any)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}>
                          <option value="urgent">🔴 Prioridade Alta (Urgente)</option>
                          <option value="organization">🟡 Curto Prazo (Organização)</option>
                          <option value="growth">🟢 Longo Prazo (Crescimento)</option>
                        </select>
                      </div>
                      <div>
                        <label className="afic-label">Instruções</label>
                        <textarea value={editTaskDesc} onChange={e => setEditTaskDesc(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', minHeight: '80px' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <Button variant="outline" onClick={() => setEditingTaskId(null)}>Cancelar</Button>
                        <Button onClick={handleUpdateTask}>Salvar Edição</Button>
                      </div>
                    </div>
                  ) : (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1rem 1.25rem', background: 'var(--bg-input)', borderRadius: 'var(--r-md)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', flex: 1 }} onClick={() => handleToggleTask(task.id, task.status)}>
                        <div style={{ marginTop: '0.15rem' }}>
                          {task.status === 'completed' ? (
                            <CheckCircle size={20} color="var(--success)" />
                          ) : (
                            <Circle size={20} color="var(--brand-primary)" />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            {task.category === 'urgent' && <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', fontWeight: 800 }}>URGENTE</span>}
                            {task.category === 'organization' && <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', fontWeight: 800 }}>ORGANIZAÇÃO</span>}
                            {task.category === 'growth' && <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', fontWeight: 800 }}>CRESCIMENTO</span>}
                            {task.due_date && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Prazo: {new Date(task.due_date).toLocaleDateString('pt-BR')}</span>}
                          </div>
                          <span style={{ color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: task.status === 'completed' ? 'line-through' : 'none', fontWeight: 700, fontSize: '0.95rem' }}>
                            {task.title}
                          </span>
                          {task.description && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
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

          {/* Metas e Transações */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <Card>
              <GoalTracker targetUserId={id} />
            </Card>
            <Card>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                Lançamentos & Fluxo de Caixa
              </h3>
              <TransactionManager targetUserId={id} />
            </Card>
          </div>

        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 4: MENSAGENS & TEMPLATES RÁPIDOS */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'messages' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }} className="anim-fade-up">
          
          {/* Envio de Mensagens */}
          <Card>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <MessageSquare size={18} color="var(--brand-primary)" /> Enviar Orientação ao Cliente
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <textarea 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Escreva uma orientação, feedback ou recomendação personalizada..."
                style={{ width: '100%', padding: '0.85rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', minHeight: '120px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <a 
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(newMessage || `Olá ${firstName}!`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '0.5rem 0.85rem',
                    borderRadius: 'var(--r-md)',
                    background: 'rgba(34, 197, 94, 0.15)',
                    color: 'var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  <MessageCircle size={16} /> Enviar via WhatsApp
                </a>

                <Button onClick={() => handleSendMessage()} disabled={sendingMessage || !newMessage.trim()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {sendingMessage ? 'Enviando...' : <><Send size={16} /> Salvar no App do Cliente</>}
                </Button>
              </div>
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              Histórico de Mensagens Enviadas ({messages.length})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
              {messages.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', padding: '1rem', textAlign: 'center' }}>Nenhuma mensagem enviada ainda.</p>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--r-md)', borderLeft: `3px solid ${msg.is_read ? 'var(--success)' : 'var(--brand-primary)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {new Date(msg.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span style={{ color: msg.is_read ? 'var(--success)' : 'var(--brand-primary)', fontWeight: 700 }}>
                        {msg.is_read ? '✓ Lida pelo cliente' : '• Não lida'}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{msg.message}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Modelos / Templates Rápidos com 1 Clique */}
          <Card>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <Sparkles size={18} color="var(--brand-primary)" /> Modelos Prontos de Orientação
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Clique para usar o modelo no formulário ou copiar direto para o WhatsApp.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {MESSAGE_TEMPLATES.map((tmpl, idx) => (
                <div key={idx} style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{tmpl.title}</strong>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        onClick={() => copyTemplateToClipboard(tmpl.text, idx)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                        title="Copiar texto"
                      >
                        {copiedTemplate === idx ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                      </button>
                      <button
                        onClick={() => setNewMessage(tmpl.text.replace(/\[Nome\]/g, firstName))}
                        style={{ background: 'rgba(234, 179, 8, 0.12)', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', padding: '0.2rem 0.5rem', borderRadius: 'var(--r-sm)', fontSize: '0.75rem', fontWeight: 700 }}
                      >
                        Inserir
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {tmpl.text.replace(/\[Nome\]/g, firstName)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 5: CRM & ATAS DE REUNIÃO */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'crm' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="anim-fade-up">
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={20} color="var(--brand-primary)" /> Atas e Registro de Reuniões de Consultoria
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Histórico confidencial de alinhamentos, decisões e perfil comportamental do cliente.
                </p>
              </div>

              <Button variant="primary" size="sm" onClick={() => setIsAddingMeeting(!isAddingMeeting)}>
                {isAddingMeeting ? 'Cancelar' : <><Plus size={16} /> Nova Ata de Reunião</>}
              </Button>
            </div>

            {isAddingMeeting && (
              <form onSubmit={handleSaveMeetingNote} style={{ background: 'var(--bg-app)', padding: '1.5rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label className="afic-label">Data da Reunião *</label>
                    <input type="date" required value={meetingDate} onChange={e => setMeetingDate(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label className="afic-label">Título da Reunião / Pauta Principal *</label>
                    <input type="text" required value={meetingTitle} onChange={e => setMeetingTitle(e.target.value)} placeholder="Ex: Alinhamento de Metas 2026 / Revisão de Carteira" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} />
                  </div>
                </div>

                <div>
                  <label className="afic-label">Resumo dos Tópicos Abordados</label>
                  <textarea value={meetingSummary} onChange={e => setMeetingSummary(e.target.value)} placeholder="O que foi discutido com o cliente..." style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', minHeight: '80px' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="afic-label">Decisões Tomadas</label>
                    <textarea value={meetingDecisions} onChange={e => setMeetingDecisions(e.target.value)} placeholder="Ex: Aportar R$ 2.000 em Selic e renegociar seguro..." style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', minHeight: '70px' }} />
                  </div>
                  <div>
                    <label className="afic-label">Próximos Passos Acordados</label>
                    <textarea value={meetingNextSteps} onChange={e => setMeetingNextSteps(e.target.value)} placeholder="Ex: Cliente enviará extrato até sexta-feira..." style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', minHeight: '70px' }} />
                  </div>
                </div>

                <div>
                  <label className="afic-label">Anotações Confidenciais do Consultor (Privado)</label>
                  <textarea value={meetingPrivateNotes} onChange={e => setMeetingPrivateNotes(e.target.value)} placeholder="Insights comportamentais, anseios e notas internas..." style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', minHeight: '60px' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <Button variant="outline" type="button" onClick={() => setIsAddingMeeting(false)}>Cancelar</Button>
                  <Button type="submit" disabled={savingMeeting}>
                    {savingMeeting ? 'Salvando...' : 'Registrar Ata de Reunião'}
                  </Button>
                </div>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {meetingNotes.length === 0 ? (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Calendar size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                  <p style={{ fontWeight: 600 }}>Nenhuma reunião registrada ainda.</p>
                  <p style={{ fontSize: '0.85rem' }}>Registre as atas dos encontros para manter o histórico transparente e profissional.</p>
                </div>
              ) : (
                meetingNotes.map(note => (
                  <div key={note.id} style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: 'var(--r-md)', borderLeft: '4px solid var(--brand-primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
                          📅 {new Date(note.meeting_date).toLocaleDateString('pt-BR')}
                        </span>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                          {note.title}
                        </h4>
                      </div>
                      <button onClick={() => handleDeleteMeetingNote(note.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.7 }} title="Excluir ata">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {note.summary && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Resumo:</span>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>{note.summary}</p>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', margin: '0.75rem 0', background: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--r-sm)' }}>
                      {note.decisions && (
                        <div>
                          <strong style={{ fontSize: '0.75rem', color: 'var(--success)', textTransform: 'uppercase' }}>Decisões:</strong>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{note.decisions}</p>
                        </div>
                      )}
                      {note.next_steps && (
                        <div>
                          <strong style={{ fontSize: '0.75rem', color: '#3b82f6', textTransform: 'uppercase' }}>Próximos Passos:</strong>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{note.next_steps}</p>
                        </div>
                      )}
                    </div>

                    {note.private_notes && (
                      <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(234, 179, 8, 0.08)', borderRadius: 'var(--r-sm)', border: '1px dashed rgba(234, 179, 8, 0.3)' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-primary)' }}>🔒 Nota Privada do Consultor:</span>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{note.private_notes}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 6: RELATÓRIO EXECUTIVO / PDF */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'report' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="anim-fade-up">
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button variant="primary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Printer size={18} /> Imprimir / Salvar em PDF
            </Button>
          </div>

          <Card style={{ padding: '2.5rem', background: '#fff', color: '#1e293b', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
            
            {/* Header do Relatório */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>AFIC CONSULTORIA</h2>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0' }}>Relatório Executivo de Planejamento & Diagnóstico Financeiro</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block' }}>Cliente: {clientInfo.full_name}</strong>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Data: {new Date().toLocaleDateString('pt-BR')}</span>
              </div>
            </div>

            {/* Score & Resumo Geral */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Health Score</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0284c7', margin: '0.25rem 0 0' }}>{profile.health_score || 0}/100</h3>
              </div>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Renda Mensal</span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0 0' }}>
                  {Number(profile.monthly_income).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </h3>
              </div>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Custos Fixos</span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0 0' }}>
                  {Number(profile.fixed_costs).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ({fixedCostPct}%)
                </h3>
              </div>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Patrimônio Líquido</span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#16a34a', margin: '0.25rem 0 0' }}>
                  {Number(profile.total_equity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </h3>
              </div>
            </div>

            {/* Estratégia de Baldes Recomendada */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                1. Estratégia de Alocação de Potes (Orçamento Ideal)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
                {buckets.map(b => (
                  <div key={b.type} style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <strong style={{ fontSize: '0.85rem', color: '#334155', display: 'block' }}>{b.label}</strong>
                    <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0284c7', display: 'block', margin: '0.25rem 0' }}>{b.percentage}%</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {((profile.monthly_income * b.percentage) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Plano de Ação Estratégico */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                2. Plano de Ação & Próximos Passos
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {actionPlans.map((task, i) => (
                  <div key={task.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.85rem' }}>{i + 1}.</span>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>{task.title}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: task.status === 'completed' ? '#dcfce7' : '#fef3c7', color: task.status === 'completed' ? '#166534' : '#92400e' }}>
                      {task.status === 'completed' ? 'Concluída' : 'Em andamento'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assinatura do Consultor */}
            <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>AFIC Consultoria Financeira • Gestão Patrimonial</p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Documento emitido para fins de consultoria estratégica.</p>
              </div>
              <div style={{ textAlign: 'center', minWidth: '200px' }}>
                <div style={{ borderBottom: '1px solid #334155', marginBottom: '0.25rem', height: '30px' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>Consultor Financeiro AFIC</span>
              </div>
            </div>

          </Card>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL SIMULADOR DE APORTE */}
      {/* ────────────────────────────────────────────────────────── */}
      <PortfolioInvestmentSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        targetUserId={id}
        initialProfileId="moderado"
        onSuccess={() => {
          toast.success('Carteira do cliente atualizada com sucesso!');
        }}
      />

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL RAW ONBOARDING DATA */}
      {/* ────────────────────────────────────────────────────────── */}
      {isRawDataModalOpen && profile.raw_onboarding_data && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="anim-fade-up" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--r-xl)', width: '100%', maxWidth: '650px', maxHeight: '85vh', overflowY: 'auto', border: '1px solid var(--border-color)', position: 'relative' }}>
            <button onClick={() => setIsRawDataModalOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1rem' }}>Detalhamento do Onboarding</h2>
            <pre style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--r-md)', fontSize: '0.85rem', color: 'var(--text-primary)', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(profile.raw_onboarding_data, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL AJUSTAR SCORE MANUALMENTE */}
      {/* ────────────────────────────────────────────────────────── */}
      {isScoreModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="anim-fade-up" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--r-xl)', width: '100%', maxWidth: '450px', border: '1px solid var(--border-color)', position: 'relative' }}>
            <button onClick={() => setIsScoreModalOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>Ajustar Health Score</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Defina o score manualmente ou use a regra algorítmica do sistema.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label className="afic-label" style={{ marginBottom: 0 }}>Score (0 a 100):</label>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--brand-primary)' }}>{manualScore}</strong>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={manualScore} 
                  onChange={e => setManualScore(Number(e.target.value))} 
                  style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--brand-primary)' }}
                />
              </div>

              <Button variant="outline" fullWidth onClick={handleAutoCalculateScore} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                <Activity size={16} /> Recalcular Automaticamente pelos Lançamentos
              </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Button variant="outline" onClick={() => setIsScoreModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveScore} disabled={savingScore}>
                {savingScore ? 'Salvando...' : 'Salvar Score'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
