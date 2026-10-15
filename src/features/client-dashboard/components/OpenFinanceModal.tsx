import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, X, RefreshCw, Plus, Trash2, Landmark, 
  Search, CheckCircle2, AlertCircle, ArrowRight, Zap, 
  ExternalLink, Lock, Check
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { 
  openFinanceService, 
  SUPPORTED_BANKS 
} from '../../../services/openFinanceService';
import type { BankConnection, SupportedBank } from '../../../types/openFinance';
import { PluggyConnect } from 'react-pluggy-connect';
import toast from 'react-hot-toast';
import './OpenFinanceModal.css';

interface OpenFinanceModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OpenFinanceModal: React.FC<OpenFinanceModalProps> = ({
  userId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'connections' | 'new'>('connections');
  const [bankSearch, setBankSearch] = useState('');
  
  // Pluggy Connect Real Integration
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [loadingConnectToken, setLoadingConnectToken] = useState(false);

  // Estado do fluxo de autorização interativa / simulação
  const [connectingBank, setConnectingBank] = useState<SupportedBank | null>(null);
  const [connectingStep, setConnectingStep] = useState<number>(1);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleOpenPluggyWidget = async () => {
    setLoadingConnectToken(true);
    try {
      const token = await openFinanceService.getPluggyConnectToken();
      setConnectToken(token);
    } catch (err: any) {
      console.error('Erro ao gerar token da Pluggy:', err);
      toast.error('Erro ao iniciar Pluggy Connect. Verifique suas credenciais.');
    } finally {
      setLoadingConnectToken(false);
    }
  };

  // Carrega conexões
  const loadConnections = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await openFinanceService.getUserConnections(userId);
      setConnections(data);
      if (data.length === 0) {
        setActiveTab('new');
      }
    } catch (err) {
      console.error('Erro ao carregar conexões:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      loadConnections();
    }
  }, [isOpen, userId]);

  // Filtra catálogo de bancos
  const filteredBanks = useMemo(() => {
    if (!bankSearch.trim()) return SUPPORTED_BANKS;
    const q = bankSearch.toLowerCase().trim();
    return SUPPORTED_BANKS.filter(
      b => b.name.toLowerCase().includes(q) || b.code.includes(q)
    );
  }, [bankSearch]);

  // Inicia fluxo de conexão
  const handleStartConnect = (bank: SupportedBank) => {
    setConnectingBank(bank);
    setConnectingStep(1);

    // Passo 1: Negociação de Token
    setTimeout(() => {
      setConnectingStep(2);
    }, 1100);

    // Passo 2: Consentimento do BACEN
    setTimeout(() => {
      setConnectingStep(3);
    }, 2200);

    // Passo 3: Conclusão & Primeira Sincronização
    setTimeout(async () => {
      try {
        const conn = await openFinanceService.connectBank(userId, bank);
        const importedCount = await openFinanceService.syncConnectionTransactions(userId, conn);
        toast.success(`${bank.name} conectado! ${importedCount} lançamentos sincronizados.`);
        setConnectingBank(null);
        await loadConnections();
        setActiveTab('connections');
        onSuccess();
      } catch (err) {
        console.error('Erro ao concluir conexão:', err);
        toast.error('Erro ao conectar com a instituição bancária.');
        setConnectingBank(null);
      }
    }, 3400);
  };

  // Sincronizar individual
  const handleSyncOne = async (conn: BankConnection) => {
    setSyncingId(conn.id);
    try {
      const count = await openFinanceService.syncConnectionTransactions(userId, conn);
      toast.success(`${conn.institution_name} sincronizado com sucesso (+${count} lançamentos)!`);
      await loadConnections();
      onSuccess();
    } catch (err) {
      toast.error('Erro ao sincronizar lançamentos.');
    } finally {
      setSyncingId(null);
    }
  };

  // Sincronizar todas as contas
  const handleSyncAll = async () => {
    if (connections.length === 0) return;
    setIsSyncingAll(true);
    let totalImported = 0;
    try {
      for (const conn of connections) {
        const count = await openFinanceService.syncConnectionTransactions(userId, conn);
        totalImported += count;
      }
      toast.success(`Todas as contas sincronizadas (+${totalImported} novos lançamentos)!`);
      await loadConnections();
      onSuccess();
    } catch (err) {
      toast.error('Erro ao sincronizar todas as contas.');
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Desconectar
  const handleDisconnect = async (conn: BankConnection) => {
    if (!window.confirm(`Deseja revogar o consentimento e desconectar sua conta do ${conn.institution_name}?`)) {
      return;
    }

    try {
      await openFinanceService.disconnectBank(conn.id, userId);
      toast.success(`Conta do ${conn.institution_name} desconectada.`);
      await loadConnections();
    } catch (err) {
      toast.error('Erro ao desconectar conta bancária.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="tx-modal-overlay">
      <div className="tx-modal anim-fade-up open-finance-modal" onClick={e => e.stopPropagation()}>
        {/* ── Header ── */}
        <div className="open-finance-modal__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div className="open-finance-modal__icon">
              <Zap size={22} />
            </div>
            <div>
              <h2 className="open-finance-modal-title">
                Open Finance Brasil
                <span className="open-finance-badge-auto">Sincronização 360°</span>
              </h2>
              <p className="open-finance-modal-sub">
                Conecte seus bancos para sincronizar extratos, investimentos da carteira e dívidas/financiamentos em tempo real
              </p>
            </div>
          </div>
          <button onClick={onClose} className="open-finance-close-btn" title="Fechar">
            <X size={20} />
          </button>
        </div>

        {/* ── 3 Pilares do Open Finance ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.6rem',
          padding: '0.85rem 1.25rem',
          background: 'rgba(234, 179, 8, 0.05)',
          borderBottom: '1px solid rgba(234, 179, 8, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ fontSize: '1rem' }}>💸</span>
            <div>
              <strong style={{ color: 'var(--text-primary)', display: 'block' }}>Lançamentos & Extratos</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Contas correntes e cartões</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ fontSize: '1rem' }}>📈</span>
            <div>
              <strong style={{ color: 'var(--text-primary)', display: 'block' }}>Investimentos & Carteira</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Ações, FIIs, Renda Fixa e Fundos</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ fontSize: '1rem' }}>💳</span>
            <div>
              <strong style={{ color: 'var(--text-primary)', display: 'block' }}>Dívidas & Financiamentos</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Contratos, juros e parcelas</span>
            </div>
          </div>
        </div>

        {/* ── Banner de Segurança BACEN ── */}
        <div className="open-finance-security-banner">
          <div className="open-finance-security-icon">
            <ShieldCheck size={20} />
          </div>
          <div className="open-finance-security-text">
            <strong>Segurança Nível Bancário:</strong> Criptografia de ponta a ponta (AES-256) regulamentada pelo 
            Banco Central do Brasil. Seus dados são <strong>estritamente somente-leitura</strong> e você pode revogar 
            o acesso a qualquer momento.
          </div>
        </div>

        {/* ── Tabs de Navegação ── */}
        <div className="open-finance-nav-tabs">
          <button
            type="button"
            className={`open-finance-tab-btn ${activeTab === 'connections' ? 'open-finance-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('connections')}
          >
            <Landmark size={15} />
            <span>Minhas Contas Conectadas</span>
            <span className="open-finance-tab-badge">{connections.length}</span>
          </button>

          <button
            type="button"
            className={`open-finance-tab-btn ${activeTab === 'new' ? 'open-finance-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('new')}
          >
            <Plus size={15} />
            <span>Conectar Nova Instituição</span>
          </button>
        </div>

        {/* ── Conteúdo da Tab ── */}
        {activeTab === 'connections' ? (
          <div>
            {loading ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                <span>Carregando conexões bancárias...</span>
              </div>
            ) : connections.length === 0 ? (
              <div className="open-finance-empty-state">
                <div className="open-finance-empty-icon">
                  <Landmark size={28} />
                </div>
                <h3 className="open-finance-empty-title">Nenhum banco conectado ainda</h3>
                <p className="open-finance-empty-desc">
                  Conecte sua conta do Nubank, Itaú, Inter ou outros bancos para que seus lançamentos 
                  apareçam automaticamente no sistema todos os dias.
                </p>
                <Button 
                  onClick={() => setActiveTab('new')} 
                  style={{ marginTop: '0.75rem' }}
                >
                  <Plus size={16} /> Conectar Primeiro Banco
                </Button>
              </div>
            ) : (
              <div className="open-finance-connections-list">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {connections.length} {connections.length === 1 ? 'instituição ativa' : 'instituições ativas'}
                  </span>
                  <button
                    type="button"
                    className="open-finance-sync-btn"
                    onClick={handleSyncAll}
                    disabled={isSyncingAll}
                  >
                    <RefreshCw size={13} className={isSyncingAll ? 'spin' : ''} />
                    <span>{isSyncingAll ? 'Sincronizando...' : 'Sincronizar Todas'}</span>
                  </button>
                </div>

                {connections.map((conn) => {
                  const isSyncingThis = syncingId === conn.id;
                  const lastSyncFormatted = conn.last_sync_at 
                    ? new Date(conn.last_sync_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                    : 'Pendente';

                  return (
                    <div key={conn.id} className="open-finance-conn-card">
                      <div className="open-finance-conn-left">
                        <div 
                          className="open-finance-bank-avatar"
                          style={{ 
                            backgroundColor: conn.institution_color || '#EAB308',
                            color: '#FFFFFF'
                          }}
                        >
                          {conn.institution_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="open-finance-conn-info">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="open-finance-conn-name">{conn.institution_name}</span>
                            <span className="open-finance-status-pill open-finance-status-pill--ok">
                              <CheckCircle2 size={11} /> Conectado
                            </span>
                          </div>
                          <div className="open-finance-conn-meta">
                            <span>{conn.account_type === 'credit_card' ? 'Cartão de Crédito' : 'Conta Corrente'}</span>
                            {conn.account_number && <span>• {conn.account_number}</span>}
                            <span>• Última sync: {lastSyncFormatted}</span>
                          </div>
                        </div>
                      </div>

                      <div className="open-finance-conn-actions">
                        <button
                          type="button"
                          className="open-finance-sync-btn"
                          onClick={() => handleSyncOne(conn)}
                          disabled={isSyncingThis}
                          title="Buscar novos lançamentos agora"
                        >
                          <RefreshCw size={13} className={isSyncingThis ? 'spin' : ''} />
                          <span>{isSyncingThis ? 'Atualizando...' : 'Sincronizar'}</span>
                        </button>
                        <button
                          type="button"
                          className="open-finance-disconnect-btn"
                          onClick={() => handleDisconnect(conn)}
                          title="Revogar consentimento e desconectar"
                        >
                          <Trash2 size={13} />
                          <span>Desconectar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ── Visão 2: Seletor de Novo Banco ── */
          <div>
            {/* Banner Oficial Pluggy Connect */}
            <div className="open-finance-pluggy-hero">
              <div className="open-finance-pluggy-hero__left">
                <div className="open-finance-pluggy-hero__icon">
                  <Zap size={24} />
                </div>
                <div>
                  <h3 className="open-finance-pluggy-hero__title">
                    Conectar com Pluggy Connect (Oficial)
                  </h3>
                  <p className="open-finance-pluggy-hero__desc">
                    Autentique com segurança máxima e conecte qualquer banco do Brasil via Open Finance
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="open-finance-pluggy-hero__btn"
                onClick={handleOpenPluggyWidget}
                disabled={loadingConnectToken}
              >
                {loadingConnectToken ? (
                  <>
                    <RefreshCw size={15} className="spin" /> Iniciando...
                  </>
                ) : (
                  <>
                    <Zap size={15} /> Abrir Widget Oficial
                  </>
                )}
              </button>
            </div>

            <div className="open-finance-search-box" style={{ marginBottom: '1rem' }}>
              <Search size={15} className="open-finance-search-icon" />
              <input
                type="text"
                placeholder="Buscar instituição financeira (Nubank, Itaú, Inter, etc)..."
                value={bankSearch}
                onChange={e => setBankSearch(e.target.value)}
                className="open-finance-search-input"
              />
            </div>

            <div className="open-finance-banks-grid">
              {filteredBanks.map((bank) => (
                <div
                  key={bank.id}
                  className={`open-finance-bank-card ${bank.popular ? 'open-finance-bank-card--popular' : ''}`}
                  onClick={() => handleStartConnect(bank)}
                >
                  <div
                    className="open-finance-bank-avatar"
                    style={{ 
                      backgroundColor: bank.color,
                      color: bank.textColor
                    }}
                  >
                    {bank.logoText}
                  </div>
                  <div>
                    <div className="open-finance-bank-name">{bank.name}</div>
                    <div className="open-finance-bank-code">Banco {bank.code}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Overlay de Conexão em Andamento ── */}
        {connectingBank && (
          <div className="open-finance-connecting-overlay">
            <div className="open-finance-connecting-card anim-fade-up">
              <div
                className="open-finance-bank-avatar"
                style={{ 
                  backgroundColor: connectingBank.color,
                  color: connectingBank.textColor,
                  width: '56px',
                  height: '56px',
                  fontSize: '1.25rem'
                }}
              >
                {connectingBank.logoText}
              </div>

              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Conectando ao {connectingBank.name}
                </h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Estabelecendo túnel criptografado via Open Finance BACEN
                </p>
              </div>

              <div className="open-finance-connecting-steps">
                <div className={`open-finance-step-item ${connectingStep > 1 ? 'open-finance-step-item--done' : 'open-finance-step-item--active'}`}>
                  {connectingStep > 1 ? <Check size={14} /> : <RefreshCw size={14} className="spin" />}
                  <span>1. Inicializando chave de consentimento</span>
                </div>

                <div className={`open-finance-step-item ${connectingStep > 2 ? 'open-finance-step-item--done' : connectingStep === 2 ? 'open-finance-step-item--active' : ''}`}>
                  {connectingStep > 2 ? <Check size={14} /> : connectingStep === 2 ? <RefreshCw size={14} className="spin" /> : <Lock size={14} />}
                  <span>2. Autorização de extratos e contas</span>
                </div>

                <div className={`open-finance-step-item ${connectingStep === 3 ? 'open-finance-step-item--active' : ''}`}>
                  {connectingStep === 3 ? <RefreshCw size={14} className="spin" /> : <Lock size={14} />}
                  <span>3. Sincronizando primeiros lançamentos...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Rodapé ── */}
        <div className="open-finance-modal-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Lock size={13} style={{ color: '#34D399' }} />
            <span>Compatível com APIs Pluggy, Belvo e Diretório BACEN</span>
          </div>

          <Button type="button" variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>

        {/* ── Widget Oficial Pluggy Connect ── */}
        {connectToken && (
          <PluggyConnect
            connectToken={connectToken}
            includeSandbox={true}
            onSuccess={async (data) => {
              setConnectToken(null);
              toast.loading('Sincronizando extratos, carteira e dívidas...', { id: 'pluggy-sync' });
              try {
                const result = await openFinanceService.handlePluggyItemSuccess(userId, data.item);
                const summaryParts: string[] = [];
                if (result.importedTransactions > 0) summaryParts.push(`${result.importedTransactions} lançamentos`);
                if (result.importedInvestments > 0) summaryParts.push(`${result.importedInvestments} ativos`);
                if (result.importedDebts > 0) summaryParts.push(`${result.importedDebts} dívidas`);

                const summaryStr = summaryParts.length > 0 ? ` (+${summaryParts.join(', ')})` : '';
                toast.success(`${result.connection.institution_name} conectado com sucesso!${summaryStr}`, { id: 'pluggy-sync', duration: 5000 });
                await loadConnections();
                setActiveTab('connections');
                onSuccess();
              } catch (err) {
                console.error('Erro pós-conexão Pluggy:', err);
                toast.error('Erro ao salvar dados da instituição conectada.', { id: 'pluggy-sync' });
              }
            }}
            onError={(err) => {
              console.error('Pluggy Connect Error:', err);
              toast.error('Ocorreu um erro no widget da Pluggy.');
            }}
            onClose={() => {
              setConnectToken(null);
            }}
          />
        )}
      </div>
    </div>
  );
};
