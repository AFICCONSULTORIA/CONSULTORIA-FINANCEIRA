import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Plus, Users, Search, Loader2, LayoutDashboard, Briefcase, 
  Key, RefreshCw, Copy, Check, AlertTriangle, CheckCircle2, X, Lock, Eye, EyeOff,
  CreditCard, Sparkles, UserMinus, UserCheck, AlertOctagon
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface ManagedUser {
  id: string;
  full_name: string;
  email: string | null;
  role: 'client' | 'consultant' | 'admin';
  phone?: string | null;
  must_change_password?: boolean;
  has_portfolio_access?: boolean;
  subscription_status?: 'active' | 'cancelled' | 'inactive' | string;
  subscription_canceled_at?: string | null;
  subscription_cancel_reason?: string | null;
  created_at?: string;
}

export const AdminDashboard: React.FC = () => {
  const { signOut, user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Lista de Usuários
  const [usersList, setUsersList] = useState<ManagedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'client' | 'consultant' | 'admin'>('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState<'all' | 'active' | 'cancelled' | 'inactive'>('all');
  const [onlyPendingReset, setOnlyPendingReset] = useState(false);

  // Cadastro de Novo Consultor
  const [consultantName, setConsultantName] = useState('');
  const [consultantEmail, setConsultantEmail] = useState('');
  const [consultantPassword, setConsultantPassword] = useState('Afic@123');
  const [forceFirstChange, setForceFirstChange] = useState(true);
  const [creatingConsultant, setCreatingConsultant] = useState(false);
  const [consultantMsg, setConsultantMsg] = useState('');

  // Modal de Redefinição de Senha
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [tempPassword, setTempPassword] = useState('Afic@123');
  const [showTempPassword, setShowTempPassword] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [rpcErrorHelper, setRpcErrorHelper] = useState<string | null>(null);

  // Modal / Ação de Gerenciamento de Assinatura
  const [subscriptionModalUser, setSubscriptionModalUser] = useState<{ user: ManagedUser; targetStatus: boolean } | null>(null);
  const [subscriptionChangeReason, setSubscriptionChangeReason] = useState('');
  const [updatingSubscription, setUpdatingSubscription] = useState(false);
  const [cancellingViniciusErik, setCancellingViniciusErik] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setRpcErrorHelper(null);

    try {
      // 1. Tenta buscar via RPC completa admin_get_all_users (se a migration 18/19 estiver aplicada)
      const { data: rpcData, error: rpcErr } = await supabase.rpc('admin_get_all_users');

      if (!rpcErr && rpcData) {
        setUsersList(rpcData);
        setLoadingUsers(false);
        return;
      }

      // 2. Fallback: Consulta direta na tabela public.users
      const { data: dbUsers, error: dbErr } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbErr) {
        console.error('Erro ao buscar usuários:', dbErr);
        toast.error('Erro ao carregar usuários.');
      } else if (dbUsers) {
        setUsersList(dbUsers);
      }
    } catch (err: any) {
      console.error('Erro geral ao listar usuários:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Criação de consultor sem deslogar o admin atual
  const handleCreateConsultant = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingConsultant(true);
    setConsultantMsg('');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jjizfczhilevxzunwqgj.supabase.co';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_TleVNZ3XheqNbE97NWMCOQ_WAh_ypJO';

      // Cliente temporário com persistSession: false para não afetar o cookie/token do Admin
      const tempAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });

      const { data: authData, error: authErr } = await tempAuthClient.auth.signUp({
        email: consultantEmail,
        password: consultantPassword
      });

      if (authErr) throw authErr;

      if (authData.user) {
        const { error: dbErr } = await supabase.from('users').insert({
          id: authData.user.id,
          full_name: consultantName,
          email: consultantEmail,
          role: 'consultant',
          must_change_password: forceFirstChange
        });

        if (dbErr) {
          console.warn('Erro ao inserir perfil do consultor:', dbErr);
        }

        toast.success(`Consultor ${consultantName} cadastrado com sucesso!`);
        setConsultantMsg(`Consultor ${consultantName} cadastrado com sucesso! O acesso está liberado.`);
        setConsultantName('');
        setConsultantEmail('');
        setConsultantPassword('Afic@123');
        fetchUsers();
      }
    } catch (err: any) {
      console.error(err);
      setConsultantMsg(`Erro: ${err.message}`);
      toast.error(`Erro ao cadastrar consultor: ${err.message}`);
    } finally {
      setCreatingConsultant(false);
    }
  };

  // Abertura do modal de reset de senha
  const handleOpenResetModal = (targetUser: ManagedUser) => {
    setSelectedUser(targetUser);
    setTempPassword('Afic@123');
    setShowTempPassword(false);
    setResetSuccess(false);
    setCopiedMessage(false);
    setRpcErrorHelper(null);
  };

  // Confirmação de reset de senha pelo admin
  const handleConfirmReset = async () => {
    if (!selectedUser) return;
    setResetting(true);
    setRpcErrorHelper(null);

    try {
      // Dispara a RPC no Supabase
      const { error } = await supabase.rpc('admin_reset_user_password', {
        target_user_id: selectedUser.id,
        new_password: tempPassword
      });

      if (error) {
        console.error('Erro na RPC admin_reset_user_password:', error);
        
        if (error.message?.toLowerCase().includes('function') && error.message?.toLowerCase().includes('does not exist')) {
          setRpcErrorHelper('A função "admin_reset_user_password" precisa ser criada no banco de dados. Execute o arquivo "supabase/migrations/18_admin_password_reset.sql" no SQL Editor do Supabase.');
        } else {
          setRpcErrorHelper(`Erro: ${error.message}`);
        }
        toast.error('Não foi possível redefinir a senha.');
        return;
      }

      // Sucesso!
      toast.success('Senha redefinida com sucesso!');
      setResetSuccess(true);

      // Atualiza a lista localmente
      setUsersList(prev => prev.map(u => u.id === selectedUser.id ? { ...u, must_change_password: true } : u));
    } catch (err: any) {
      console.error(err);
      setRpcErrorHelper(`Falha na requisição: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  // Copia mensagem pronta para envio ao cliente/consultor
  const handleCopyMessage = () => {
    if (!selectedUser) return;
    const loginUrl = `${window.location.origin}/login`;
    const text = `Olá, ${selectedUser.full_name || 'Usuário'}! 🔐\n\nSua senha de acesso à plataforma AFIC Consultoria foi redefinida pelo administrador.\n\n🔑 Senha temporária: ${tempPassword}\n🌐 Acesse aqui: ${loginUrl}\n\nAo entrar com esta senha, você será solicitado(a) a cadastrar sua nova senha pessoal definitiva.`;
    
    navigator.clipboard.writeText(text);
    setCopiedMessage(true);
    toast.success('Mensagem copiada para a área de transferência!');
    setTimeout(() => setCopiedMessage(false), 3000);
  };

  // Abertura do modal de alteração de assinatura (cancelamento ou ativação)
  const handleOpenSubscriptionModal = (user: ManagedUser, targetStatus: boolean) => {
    setSubscriptionModalUser({ user, targetStatus });
    setSubscriptionChangeReason(targetStatus ? '' : 'Cancelamento solicitado pela administração');
  };

  // Confirmação de alteração de assinatura
  const handleConfirmSubscriptionChange = async () => {
    if (!subscriptionModalUser) return;
    const { user, targetStatus } = subscriptionModalUser;
    setUpdatingSubscription(true);

    try {
      // 1. Tenta RPC admin_update_user_subscription
      const { error: rpcErr } = await supabase.rpc('admin_update_user_subscription', {
        target_user_id: user.id,
        access_status: targetStatus,
        reason: targetStatus ? null : (subscriptionChangeReason || 'Cancelado pelo administrador')
      });

      if (rpcErr) {
        console.warn('RPC admin_update_user_subscription falhou, usando fallback direto:', rpcErr);
        // 2. Fallback direto
        const updatePayload: any = {
          has_portfolio_access: targetStatus,
          subscription_status: targetStatus ? 'active' : 'cancelled'
        };
        if (!targetStatus) {
          updatePayload.subscription_canceled_at = new Date().toISOString();
          updatePayload.subscription_cancel_reason = subscriptionChangeReason || 'Cancelado pelo administrador';
        }

        const { error: dbErr } = await supabase
          .from('users')
          .update(updatePayload)
          .eq('id', user.id);

        if (dbErr) {
          // Fallback básico somente com has_portfolio_access
          const { error: basicErr } = await supabase
            .from('users')
            .update({ has_portfolio_access: targetStatus })
            .eq('id', user.id);

          if (basicErr) throw basicErr;
        }
      }

      toast.success(
        targetStatus 
          ? `Assinatura de ${user.full_name || 'cliente'} ativada com sucesso!` 
          : `Assinatura de ${user.full_name || 'cliente'} cancelada com sucesso!`
      );

      // Atualiza localmente o estado da lista
      setUsersList(prev => prev.map(u => u.id === user.id ? {
        ...u,
        has_portfolio_access: targetStatus,
        subscription_status: targetStatus ? 'active' : 'cancelled',
        subscription_canceled_at: targetStatus ? null : new Date().toISOString(),
        subscription_cancel_reason: targetStatus ? null : subscriptionChangeReason
      } : u));

      setSubscriptionModalUser(null);
    } catch (err: any) {
      console.error('Erro ao atualizar assinatura:', err);
      toast.error(`Erro ao atualizar assinatura: ${err.message}`);
    } finally {
      setUpdatingSubscription(false);
    }
  };

  // Cancelamento rápido e em massa para os clientes Vinicius e Erik
  const handleQuickCancelViniciusAndErik = async () => {
    setCancellingViniciusErik(true);
    try {
      // 1. Atualização via filtro OR no Supabase
      const { error } = await supabase
        .from('users')
        .update({
          has_portfolio_access: false,
          subscription_status: 'cancelled',
          subscription_canceled_at: new Date().toISOString(),
          subscription_cancel_reason: 'Cancelamento administrativo solicitado (Vinicius e Erik)'
        })
        .or('full_name.ilike.%vinicius%,full_name.ilike.%erik%,email.ilike.%vinicius%,email.ilike.%erik%');

      if (error) {
        // Fallback básico
        await supabase
          .from('users')
          .update({ has_portfolio_access: false })
          .or('full_name.ilike.%vinicius%,full_name.ilike.%erik%,email.ilike.%vinicius%,email.ilike.%erik%');
      }

      toast.success('Cancelamento de Vinicius e Erik processado com sucesso!');
      await fetchUsers();
    } catch (err: any) {
      console.error(err);
      toast.error(`Erro ao cancelar: ${err.message}`);
    } finally {
      setCancellingViniciusErik(false);
    }
  };

  // Filtros aplicados
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = 
      (u.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (u.phone || '').includes(searchTerm);

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesPending = !onlyPendingReset || u.must_change_password === true;

    const isSubActive = u.has_portfolio_access === true || u.subscription_status === 'active';
    const isSubCancelled = !isSubActive && (u.subscription_status === 'cancelled' || Boolean(u.subscription_canceled_at));
    const isSubInactive = !isSubActive && !isSubCancelled;

    const matchesSubscription = 
      subscriptionFilter === 'all' ||
      (subscriptionFilter === 'active' && isSubActive) ||
      (subscriptionFilter === 'cancelled' && isSubCancelled) ||
      (subscriptionFilter === 'inactive' && isSubInactive);

    return matchesSearch && matchesRole && matchesPending && matchesSubscription;
  });

  // Estatísticas rápidas
  const totalUsers = usersList.length;
  const totalClients = usersList.filter(u => u.role === 'client').length;
  const totalConsultants = usersList.filter(u => u.role === 'consultant').length;
  const totalPendingReset = usersList.filter(u => u.must_change_password).length;

  const totalActiveSubscribers = usersList.filter(u => 
    u.role === 'client' && (u.has_portfolio_access === true || u.subscription_status === 'active')
  ).length;

  const totalCancelledSubscribers = usersList.filter(u => 
    u.role === 'client' && (!u.has_portfolio_access && (u.subscription_status === 'cancelled' || Boolean(u.subscription_canceled_at)))
  ).length;

  // Localizar Vinicius e Erik na lista
  const specialClients = usersList.filter(u => {
    const name = (u.full_name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    return name.includes('vinicius') || name.includes('erik') || email.includes('vinicius') || email.includes('erik');
  });

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-app)', padding: '1.25rem 1rem 5rem' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        
        {/* Header do Admin */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '0.875rem', borderRadius: 'var(--r-md)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <Shield size={28} color="var(--brand-primary)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{ fontSize: '1.625rem', fontWeight: 800 }}>Painel Master (Admin)</h1>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--info)' }}>
                  SUPERADMIN
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                Gestão Global de Acessos, Assinaturas, Usuários e Credenciais
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Button variant="outline" onClick={fetchUsers} disabled={loadingUsers} style={{ gap: '0.5rem' }}>
              <RefreshCw size={16} className={loadingUsers ? 'anim-spin' : ''} />
              Atualizar Dados
            </Button>
            <Button variant="outline" onClick={signOut}>Sair</Button>
          </div>
        </header>

        {/* Atalhos e Estatísticas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <Card style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => navigate('/consultor')}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '50%' }}>
              <Briefcase size={24} color="var(--brand-primary)" />
            </div>
            <div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Acesso Direto</span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Painel do Consultor</h3>
            </div>
          </Card>

          <Card style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => navigate('/client')}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '50%' }}>
              <LayoutDashboard size={24} color="var(--info)" />
            </div>
            <div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Visão do Cliente</span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Dashboard do Cliente</h3>
            </div>
          </Card>

          {/* Assinantes Ativos */}
          <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Assinantes Ativos (Carteiras)</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-primary)' }}>{totalActiveSubscribers}</h3>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '0.75rem', borderRadius: '50%' }}>
              <CreditCard size={24} color="var(--brand-primary)" />
            </div>
          </Card>

          {/* Assinaturas Canceladas */}
          <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Assinaturas Canceladas</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: totalCancelledSubscribers > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                {totalCancelledSubscribers}
              </h3>
            </div>
            <div style={{ background: 'rgba(239, 68, 68, 0.12)', padding: '0.75rem', borderRadius: '50%' }}>
              <UserMinus size={24} color="var(--danger)" />
            </div>
          </Card>

          {/* Total de Contas */}
          <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Total de Contas</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{totalUsers}</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.75rem' }}>
              <span style={{ background: 'var(--bg-input)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>{totalClients} Clientes</span>
              <span style={{ background: 'var(--bg-input)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>{totalConsultants} Consultores</span>
            </div>
          </Card>

          {/* Senhas Temporárias */}
          <Card style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            border: totalPendingReset > 0 ? '1px solid rgba(234, 179, 8, 0.4)' : undefined,
            background: totalPendingReset > 0 ? 'rgba(234, 179, 8, 0.04)' : undefined
          }}>
            <div>
              <span style={{ fontSize: '0.8125rem', color: totalPendingReset > 0 ? '#facc15' : 'var(--text-secondary)' }}>
                Senhas Temporárias
              </span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: totalPendingReset > 0 ? '#facc15' : 'var(--text-primary)' }}>
                {totalPendingReset}
              </h3>
            </div>
            <div style={{ background: totalPendingReset > 0 ? 'rgba(234, 179, 8, 0.15)' : 'var(--bg-input)', padding: '0.75rem', borderRadius: '50%' }}>
              <Key size={24} color={totalPendingReset > 0 ? '#facc15' : 'var(--text-muted)'} />
            </div>
          </Card>
        </div>

        {/* Card Especial de Ação: Cancelamento de Vinicius e Erik */}
        <Card style={{ marginBottom: '1.75rem', border: '1px solid rgba(234, 179, 8, 0.3)', background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.04) 0%, rgba(239, 68, 68, 0.03) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{ background: 'rgba(234, 179, 8, 0.15)', padding: '0.75rem', borderRadius: 'var(--r-md)', color: '#facc15' }}>
                <AlertOctagon size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Ação Solicitada: Cancelamento de Assinaturas (Vinicius & Erik)
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Suspender o acesso às Carteiras Recomendadas e marcar status como cancelado.
                </p>
              </div>
            </div>

            <Button 
              onClick={handleQuickCancelViniciusAndErik}
              disabled={cancellingViniciusErik}
              style={{
                background: 'rgba(239, 68, 68, 0.85)',
                color: '#ffffff',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {cancellingViniciusErik ? (
                <>
                  <Loader2 size={16} className="anim-spin" /> Processando Cancelamento...
                </>
              ) : (
                <>
                  <UserMinus size={16} /> Executar Cancelamento (Vinicius & Erik)
                </>
              )}
            </Button>
          </div>

          {/* Exibição dos clientes Vinicius e Erik encontrados */}
          {specialClients.length > 0 && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {specialClients.map(client => {
                const isActive = client.has_portfolio_access === true || client.subscription_status === 'active';
                return (
                  <div 
                    key={client.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--r-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.9rem', display: 'block' }}>{client.full_name || 'Sem nome'}</strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{client.email}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {isActive ? (
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--brand-primary)', fontWeight: 700 }}>
                          Ativa
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', fontWeight: 700 }}>
                          Cancelada
                        </span>
                      )}

                      {isActive && (
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenSubscriptionModal(client, false)}
                          style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--danger)', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Layout Principal: Gestão de Usuários + Cadastro de Consultores */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* Seção 1: Tabela / Lista de Gestão de Usuários e Assinaturas */}
          <Card style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={20} color="var(--brand-primary)" /> Gestão de Usuários & Assinaturas
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Gerencie acessos às carteiras, redefina senhas e controle o status das assinaturas.
                </p>
              </div>

              {/* Busca */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-input)', padding: '0.5rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', minWidth: '240px' }}>
                <Search size={16} color="var(--text-muted)" />
                <input 
                  type="text" 
                  placeholder="Buscar por nome ou e-mail..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ border: 'none', background: 'transparent', padding: 0, width: '100%', fontSize: '0.875rem' }} 
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Filtros rápidos: Papel e Assinatura */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              
              {/* Filtro por Papel */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginRight: '0.25rem' }}>
                    Papel:
                  </span>
                  {(['all', 'client', 'consultant', 'admin'] as const).map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setRoleFilter(role)}
                      style={{
                        padding: '0.3rem 0.75rem',
                        borderRadius: 'var(--r-full, 9999px)',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        border: '1px solid',
                        borderColor: roleFilter === role ? 'var(--brand-primary)' : 'var(--border-color)',
                        background: roleFilter === role ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-input)',
                        color: roleFilter === role ? 'var(--brand-primary)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {role === 'all' ? 'Todos' : role === 'client' ? 'Clientes' : role === 'consultant' ? 'Consultores' : 'Admins'}
                    </button>
                  ))}
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={onlyPendingReset} 
                    onChange={e => setOnlyPendingReset(e.target.checked)} 
                    style={{ width: 'auto', cursor: 'pointer' }}
                  />
                  Apenas com senha temporária ativa
                </label>
              </div>

              {/* Filtro por Assinatura */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginRight: '0.25rem' }}>
                  Assinatura:
                </span>
                {(['all', 'active', 'cancelled', 'inactive'] as const).map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSubscriptionFilter(status)}
                    style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--r-full, 9999px)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: subscriptionFilter === status ? '#facc15' : 'var(--border-color)',
                      background: subscriptionFilter === status ? 'rgba(234, 179, 8, 0.12)' : 'var(--bg-input)',
                      color: subscriptionFilter === status ? '#facc15' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {status === 'all' ? 'Todas Assinaturas' : status === 'active' ? 'Ativas (Premium)' : status === 'cancelled' ? 'Canceladas' : 'Inativas'}
                  </button>
                ))}
              </div>

            </div>

            {/* Lista de Usuários */}
            {loadingUsers ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', gap: '0.75rem', color: 'var(--text-muted)' }}>
                <Loader2 size={28} className="anim-spin" color="var(--brand-primary)" />
                <span>Carregando usuários do sistema...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <Users size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <p style={{ fontWeight: 600 }}>Nenhum usuário encontrado</p>
                <p style={{ fontSize: '0.8125rem' }}>Tente alterar os termos da busca ou os filtros aplicados.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredUsers.map(u => {
                  const isCurrentAdmin = u.id === currentUser?.id;
                  const isPending = Boolean(u.must_change_password);
                  const isSubActive = u.has_portfolio_access === true || u.subscription_status === 'active';
                  const isSubCancelled = !isSubActive && (u.subscription_status === 'cancelled' || Boolean(u.subscription_canceled_at));

                  return (
                    <div 
                      key={u.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        padding: '1rem',
                        background: 'var(--bg-input)',
                        borderRadius: 'var(--r-md)',
                        border: isPending ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid var(--border-color)',
                        transition: 'border-color 0.2s'
                      }}
                    >
                      {/* Dados do Usuário */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <div 
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: u.role === 'admin' 
                              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))' 
                              : u.role === 'consultant' 
                              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))' 
                              : 'rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            color: u.role === 'admin' ? 'var(--info)' : u.role === 'consultant' ? 'var(--brand-primary)' : 'var(--text-primary)',
                            border: '1px solid var(--border-color)'
                          }}
                        >
                          {(u.full_name || u.email || 'U').charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <strong style={{ color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                              {u.full_name || 'Sem nome cadastrado'}
                            </strong>
                            {isCurrentAdmin && (
                              <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--brand-primary)', fontWeight: 700 }}>
                                VOCÊ
                              </span>
                            )}
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            <span>{u.email || 'E-mail não informado'}</span>
                            {u.phone && <span>• {u.phone}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Badges de Papel, Assinatura e Ações */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        
                        {/* Badge de Papel */}
                        <div 
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.25rem 0.625rem',
                            borderRadius: '1rem',
                            background: u.role === 'admin' 
                              ? 'rgba(59, 130, 246, 0.1)' 
                              : u.role === 'consultant' 
                              ? 'rgba(16, 185, 129, 0.1)' 
                              : 'rgba(255, 255, 255, 0.05)',
                            color: u.role === 'admin' ? 'var(--info)' : u.role === 'consultant' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                            border: '1px solid var(--border-color)'
                          }}
                        >
                          {u.role === 'admin' ? 'Administrador' : u.role === 'consultant' ? 'Consultor AFIC' : 'Cliente'}
                        </div>

                        {/* Badge de Assinatura (Apenas para Clientes) */}
                        {u.role === 'client' && (
                          isSubActive ? (
                            <div 
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: 'var(--brand-primary)',
                                background: 'rgba(16, 185, 129, 0.12)',
                                padding: '0.25rem 0.625rem',
                                borderRadius: '1rem',
                                border: '1px solid rgba(16, 185, 129, 0.3)'
                              }}
                              title="Cliente possui acesso liberado às Carteiras Recomendadas"
                            >
                              <Sparkles size={12} />
                              Assinante Ativo
                            </div>
                          ) : isSubCancelled ? (
                            <div 
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: 'var(--danger)',
                                background: 'rgba(239, 68, 68, 0.12)',
                                padding: '0.25rem 0.625rem',
                                borderRadius: '1rem',
                                border: '1px solid rgba(239, 68, 68, 0.3)'
                              }}
                              title="Assinatura cancelada"
                            >
                              <UserMinus size={12} />
                              Cancelada
                            </div>
                          ) : (
                            <div 
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                background: 'rgba(255, 255, 255, 0.04)',
                                padding: '0.25rem 0.625rem',
                                borderRadius: '1rem',
                                border: '1px solid var(--border-color)'
                              }}
                            >
                              Sem Assinatura
                            </div>
                          )
                        )}

                        {/* Status da Senha */}
                        {isPending ? (
                          <div 
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: '#facc15',
                              background: 'rgba(234, 179, 8, 0.12)',
                              padding: '0.25rem 0.625rem',
                              borderRadius: '1rem',
                              border: '1px solid rgba(234, 179, 8, 0.3)'
                            }}
                            title="O usuário possui uma senha temporária ativa e será obrigado a redefinir ao fazer login"
                          >
                            <AlertTriangle size={13} />
                            Senha Temporária
                          </div>
                        ) : (
                          <div 
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)',
                              padding: '0.25rem 0.5rem'
                            }}
                          >
                            <CheckCircle2 size={13} color="var(--brand-primary)" />
                            Senha Pessoal
                          </div>
                        )}

                        {/* Botão de Redefinição de Senha */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenResetModal(u)}
                          style={{
                            gap: '0.375rem',
                            fontSize: '0.8125rem',
                            borderColor: 'rgba(16, 185, 129, 0.4)',
                            color: 'var(--brand-primary)'
                          }}
                        >
                          <Key size={14} />
                          Senha
                        </Button>

                        {/* Botão de Cancelar / Ativar Assinatura (Para Clientes) */}
                        {u.role === 'client' && (
                          isSubActive ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenSubscriptionModal(u, false)}
                              style={{
                                gap: '0.375rem',
                                fontSize: '0.8125rem',
                                borderColor: 'rgba(239, 68, 68, 0.4)',
                                color: 'var(--danger)'
                              }}
                            >
                              <UserMinus size={14} />
                              Cancelar Assinatura
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenSubscriptionModal(u, true)}
                              style={{
                                gap: '0.375rem',
                                fontSize: '0.8125rem',
                                borderColor: 'rgba(16, 185, 129, 0.4)',
                                color: 'var(--brand-primary)'
                              }}
                            >
                              <UserCheck size={14} />
                              Ativar Assinatura
                            </Button>
                          )
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Seção 2: Cadastro de Novo Consultor */}
          <Card>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={20} color="var(--brand-primary)" /> Cadastrar Consultor
            </h2>

            <form onSubmit={handleCreateConsultant} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="afic-label">Nome do Consultor</label>
                <input 
                  type="text" 
                  value={consultantName} 
                  onChange={e => setConsultantName(e.target.value)} 
                  placeholder="Ex: Roberto Silva"
                  required 
                />
              </div>
              <div>
                <label className="afic-label">E-mail Profissional</label>
                <input 
                  type="email" 
                  value={consultantEmail} 
                  onChange={e => setConsultantEmail(e.target.value)} 
                  placeholder="consultor@afic.com"
                  required 
                />
              </div>
              <div>
                <label className="afic-label">Senha Inicial / Temporária</label>
                <input 
                  type="text" 
                  value={consultantPassword} 
                  onChange={e => setConsultantPassword(e.target.value)} 
                  required 
                  minLength={6}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', cursor: 'pointer', marginTop: '0.25rem' }}>
                <input 
                  type="checkbox" 
                  checked={forceFirstChange} 
                  onChange={e => setForceFirstChange(e.target.checked)} 
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                Exigir troca de senha no primeiro login
              </label>
              
              <Button style={{ marginTop: '0.75rem' }} disabled={creatingConsultant}>
                {creatingConsultant ? <Loader2 className="anim-spin" size={18} /> : 'Cadastrar Consultor'}
              </Button>

              {consultantMsg && (
                <div style={{ marginTop: '0.75rem', padding: '0.875rem', background: 'var(--bg-input)', borderRadius: 'var(--r-md)', fontSize: '0.8125rem', color: consultantMsg.includes('Erro') ? 'var(--danger)' : 'var(--success)' }}>
                  {consultantMsg}
                </div>
              )}
            </form>
          </Card>

        </div>
      </div>

      {/* Modal de Redefinição de Senha */}
      {selectedUser && (
        <div className="tx-modal-overlay">
          <div className="tx-modal anim-fade-up" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.625rem', borderRadius: '50%', color: 'var(--brand-primary)' }}>
                  <Key size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Redefinir Senha de Acesso</h3>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {selectedUser.full_name || selectedUser.email}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => !resetting && setSelectedUser(null)} 
                disabled={resetting}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {!resetSuccess ? (
              <>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  Defina a senha temporária para <strong>{selectedUser.full_name || 'o usuário'}</strong>. Ele(a) será obrigado(a) a cadastrar uma nova senha logo no primeiro login.
                </p>

                {/* Campo da Senha Temporária */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="afic-label">Senha Temporária</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showTempPassword ? 'text' : 'password'} 
                      value={tempPassword} 
                      onChange={e => setTempPassword(e.target.value)} 
                      required 
                      minLength={6}
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowTempPassword(!showTempPassword)}
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      {showTempPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Alerta de Obrigatoriedade */}
                <div 
                  style={{
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    padding: '0.875rem',
                    borderRadius: 'var(--r-md)',
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    marginBottom: '1.5rem',
                    display: 'flex',
                    gap: '0.625rem'
                  }}
                >
                  <Lock size={18} color="var(--info)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: 'var(--info)', display: 'block', marginBottom: '0.25rem' }}>Troca Obrigatória no Primeiro Acesso</strong>
                    Ao fazer login com esta senha, o sistema exibirá automaticamente um popup bloqueando o painel até que o usuário defina sua nova senha definitiva.
                  </div>
                </div>

                {/* Mensagem de Ajuda caso a RPC não esteja aplicada no banco */}
                {rpcErrorHelper && (
                  <div 
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      padding: '0.875rem',
                      borderRadius: 'var(--r-md)',
                      fontSize: '0.8125rem',
                      color: 'var(--danger)',
                      lineHeight: 1.5,
                      marginBottom: '1.5rem'
                    }}
                  >
                    <strong>Atenção:</strong> {rpcErrorHelper}
                  </div>
                )}

                {/* Ações */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <Button variant="outline" onClick={() => setSelectedUser(null)} disabled={resetting}>
                    Cancelar
                  </Button>
                  <Button onClick={handleConfirmReset} disabled={resetting || !tempPassword || tempPassword.length < 6}>
                    {resetting ? <><Loader2 className="anim-spin" size={16} /> Redefinindo...</> : 'Confirmar Redefinição'}
                  </Button>
                </div>
              </>
            ) : (
              /* Tela de Sucesso */
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div 
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem',
                      color: 'var(--brand-primary)'
                    }}
                  >
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Senha Redefinida com Sucesso!
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.375rem' }}>
                    A senha do usuário foi alterada para a senha padrão temporária.
                  </p>
                </div>

                <div 
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    padding: '1rem',
                    borderRadius: 'var(--r-md)',
                    marginBottom: '1.5rem',
                    fontSize: '0.875rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
                      Senha Temporária Definida
                    </span>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--brand-primary)', letterSpacing: '0.05em' }}>
                      {tempPassword}
                    </strong>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Assim que entrar com esta credencial, o sistema exigirá que {selectedUser.full_name || 'o usuário'} crie uma nova senha.
                  </p>
                </div>

                {/* Botão de Copiar Mensagem Pronta */}
                <Button 
                  fullWidth 
                  onClick={handleCopyMessage}
                  style={{ 
                    gap: '0.5rem', 
                    marginBottom: '0.75rem',
                    height: '46px',
                    fontSize: '0.9375rem'
                  }}
                >
                  {copiedMessage ? <Check size={18} /> : <Copy size={18} />}
                  {copiedMessage ? 'Mensagem Copiada!' : 'Copiar Mensagem para WhatsApp / E-mail'}
                </Button>

                <Button 
                  variant="outline" 
                  fullWidth 
                  onClick={() => setSelectedUser(null)}
                >
                  Concluir e Voltar
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Alteração de Assinatura */}
      {subscriptionModalUser && (
        <div className="tx-modal-overlay">
          <div className="tx-modal anim-fade-up" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  background: subscriptionModalUser.targetStatus ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                  padding: '0.625rem', 
                  borderRadius: '50%', 
                  color: subscriptionModalUser.targetStatus ? 'var(--brand-primary)' : 'var(--danger)' 
                }}>
                  {subscriptionModalUser.targetStatus ? <UserCheck size={22} /> : <UserMinus size={22} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                    {subscriptionModalUser.targetStatus ? 'Ativar Assinatura' : 'Cancelar Assinatura'}
                  </h3>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {subscriptionModalUser.user.full_name || subscriptionModalUser.user.email}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => !updatingSubscription && setSubscriptionModalUser(null)} 
                disabled={updatingSubscription}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              {subscriptionModalUser.targetStatus ? (
                <>
                  Deseja liberar o acesso premium às <strong>Carteiras Recomendadas AFIC</strong> para o cliente <strong>{subscriptionModalUser.user.full_name || 'selecionado'}</strong>?
                </>
              ) : (
                <>
                  Tem certeza que deseja cancelar a assinatura de <strong>{subscriptionModalUser.user.full_name || 'cliente'}</strong>? O cliente perderá acesso imediato às carteiras recomendadas.
                </>
              )}
            </p>

            {!subscriptionModalUser.targetStatus && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="afic-label">Motivo do Cancelamento (opcional)</label>
                <input 
                  type="text"
                  value={subscriptionChangeReason}
                  onChange={e => setSubscriptionChangeReason(e.target.value)}
                  placeholder="Ex: Cancelamento solicitado pelo cliente via WhatsApp"
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button 
                variant="outline" 
                onClick={() => setSubscriptionModalUser(null)} 
                disabled={updatingSubscription}
              >
                Voltar
              </Button>
              <Button 
                onClick={handleConfirmSubscriptionChange} 
                disabled={updatingSubscription}
                style={{
                  background: subscriptionModalUser.targetStatus ? undefined : 'var(--danger)',
                  borderColor: subscriptionModalUser.targetStatus ? undefined : 'var(--danger)'
                }}
              >
                {updatingSubscription ? (
                  <>
                    <Loader2 className="anim-spin" size={16} /> Processando...
                  </>
                ) : subscriptionModalUser.targetStatus ? (
                  'Confirmar Ativação'
                ) : (
                  'Confirmar Cancelamento'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
