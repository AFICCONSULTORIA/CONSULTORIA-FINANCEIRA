import React, { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, Plus, Zap, RefreshCw, Trash2, Edit2, 
  Home, Car, Briefcase, AlertTriangle, ShieldCheck, 
  Calculator, CheckCircle, TrendingDown, DollarSign, 
  Calendar, Building2, ArrowRight, X
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { openFinanceService } from '../../../services/openFinanceService';
import type { ClientDebt } from '../../../types/openFinance';
import { OpenFinanceModal } from './OpenFinanceModal';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { MoneyInput } from '../../../components/ui/MoneyInput';
import toast from 'react-hot-toast';
import './DebtManager.css';

interface DebtManagerProps {
  targetUserId?: string;
  readOnly?: boolean;
}

const DEBT_TYPES: { id: ClientDebt['type']; label: string; icon: any; color: string }[] = [
  { id: 'imovel', label: 'Imobiliário', icon: Home, color: '#3B82F6' },
  { id: 'veiculo', label: 'Veículo', icon: Car, color: '#10B981' },
  { id: 'consignado', label: 'Consignado', icon: Briefcase, color: '#8B5CF6' },
  { id: 'cartao', label: 'Cartão de Crédito', icon: CreditCard, color: '#EF4444' },
  { id: 'cheque_especial', label: 'Cheque Especial', icon: AlertTriangle, color: '#F59E0B' },
  { id: 'pessoal', label: 'Empréstimo Pessoal', icon: DollarSign, color: '#EC4899' },
  { id: 'outros', label: 'Outras Dívidas', icon: CreditCard, color: '#6B7280' },
];

export const DebtManager: React.FC<DebtManagerProps> = ({
  targetUserId,
  readOnly = false
}) => {
  const [debts, setDebts] = useState<ClientDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('todos');
  const [isOpenFinanceOpen, setIsOpenFinanceOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Modal manual CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<ClientDebt | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<ClientDebt['type']>('pessoal');
  const [formTotalAmount, setFormTotalAmount] = useState('');
  const [formOutstanding, setFormOutstanding] = useState('');
  const [formInstallment, setFormInstallment] = useState('');
  const [formInstallmentsTotal, setFormInstallmentsTotal] = useState('');
  const [formInstallmentsPaid, setFormInstallmentsPaid] = useState('');
  const [formInterestRate, setFormInterestRate] = useState('');
  const [formInstitution, setFormInstitution] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Simulador de Amortização
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simSelectedDebtId, setSimSelectedDebtId] = useState<string>('');
  const [simExtraPayment, setSimExtraPayment] = useState<string>('500');

  useEffect(() => {
    fetchDebts();
  }, [targetUserId]);

  const fetchDebts = async () => {
    setLoading(true);
    try {
      let uid = targetUserId;
      if (!uid) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          uid = authData.user.id;
          setCurrentUserId(authData.user.id);
        }
      } else {
        setCurrentUserId(uid);
      }

      if (uid) {
        const data = await openFinanceService.getUserDebts(uid);
        setDebts(data);
      }
    } catch (err) {
      console.error('Erro ao carregar dívidas:', err);
    } finally {
      setLoading(false);
    }
  };

  const effectiveUserId = targetUserId || currentUserId;

  // Cálculos de Totais
  const totalOutstanding = useMemo(() => {
    return debts.reduce((sum, d) => sum + (Number(d.outstanding_balance) || 0), 0);
  }, [debts]);

  const totalMonthlyPayment = useMemo(() => {
    return debts.reduce((sum, d) => sum + (Number(d.installment_amount) || 0), 0);
  }, [debts]);

  const weightedInterestRate = useMemo(() => {
    if (totalOutstanding === 0) return 0;
    const weightedSum = debts.reduce((sum, d) => {
      const balance = Number(d.outstanding_balance) || 0;
      const rate = Number(d.interest_rate) || 0;
      return sum + (balance * rate);
    }, 0);
    return weightedSum / totalOutstanding;
  }, [debts, totalOutstanding]);

  // Filtro
  const filteredDebts = useMemo(() => {
    if (selectedType === 'todos') return debts;
    return debts.filter(d => d.type === selectedType);
  }, [debts, selectedType]);

  // Handlers CRUD
  const handleOpenCreate = () => {
    setEditingDebt(null);
    setFormName('');
    setFormType('pessoal');
    setFormTotalAmount('');
    setFormOutstanding('');
    setFormInstallment('');
    setFormInstallmentsTotal('12');
    setFormInstallmentsPaid('0');
    setFormInterestRate('');
    setFormInstitution('');
    setFormDueDate('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (debt: ClientDebt) => {
    setEditingDebt(debt);
    setFormName(debt.name);
    setFormType(debt.type);
    setFormTotalAmount(debt.total_amount ? String(debt.total_amount) : '');
    setFormOutstanding(String(debt.outstanding_balance));
    setFormInstallment(debt.installment_amount ? String(debt.installment_amount) : '');
    setFormInstallmentsTotal(String(debt.installments_total || ''));
    setFormInstallmentsPaid(String(debt.installments_paid || '0'));
    setFormInterestRate(debt.interest_rate ? String(debt.interest_rate) : '');
    setFormInstitution(debt.institution || '');
    setFormDueDate(debt.due_date || '');
    setFormNotes(debt.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formOutstanding) {
      toast.error('Informe o nome e o saldo devedor da dívida.');
      return;
    }

    setSaving(true);
    try {
      const parse = (v: string) => {
        if (!v) return 0;
        const clean = v.replace(/\./g, '').replace(',', '.');
        return parseFloat(clean) || 0;
      };

      const outstanding = parse(formOutstanding);
      const totalAmount = parse(formTotalAmount) || outstanding;
      const installment = parse(formInstallment);
      const instTotal = parseInt(formInstallmentsTotal) || 1;
      const instPaid = parseInt(formInstallmentsPaid) || 0;
      const instRemaining = Math.max(0, instTotal - instPaid);

      const payload: Partial<ClientDebt> = {
        id: editingDebt?.id,
        user_id: effectiveUserId,
        name: formName.trim(),
        type: formType,
        total_amount: totalAmount,
        outstanding_balance: outstanding,
        installment_amount: installment,
        installments_total: instTotal,
        installments_paid: instPaid,
        installments_remaining: instRemaining,
        interest_rate: parseFloat(formInterestRate) || 0,
        institution: formInstitution.trim() || undefined,
        due_date: formDueDate || undefined,
        notes: formNotes.trim() || undefined,
      };

      await openFinanceService.saveDebt(effectiveUserId, payload);
      toast.success(editingDebt ? 'Dívida atualizada com sucesso!' : 'Dívida cadastrada!');
      setIsModalOpen(false);
      await fetchDebts();
    } catch (err: any) {
      console.error(err);
      toast.error(`Erro ao salvar dívida: ${err.message || 'Tente novamente.'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDebt = async (debt: ClientDebt) => {
    if (!window.confirm(`Deseja realmente excluir ou registrar a quitação de "${debt.name}"?`)) {
      return;
    }

    try {
      await openFinanceService.deleteDebt(debt.id, effectiveUserId);
      toast.success('Dívida removida!');
      await fetchDebts();
    } catch {
      toast.error('Erro ao excluir dívida.');
    }
  };

  // Cálculo Simulação Amortização
  const simDebt = useMemo(() => {
    return debts.find(d => d.id === simSelectedDebtId) || debts[0];
  }, [debts, simSelectedDebtId]);

  const simResult = useMemo(() => {
    if (!simDebt) return null;
    const balance = Number(simDebt.outstanding_balance) || 0;
    const installment = Number(simDebt.installment_amount) || 1;
    const extra = parseFloat(simExtraPayment) || 0;

    const currentMonthsLeft = simDebt.installments_remaining > 0 
      ? simDebt.installments_remaining 
      : Math.ceil(balance / installment);

    const newMonthly = installment + extra;
    const acceleratedMonths = newMonthly > 0 ? Math.ceil(balance / newMonthly) : currentMonthsLeft;
    const monthsSaved = Math.max(0, currentMonthsLeft - acceleratedMonths);

    // Estimativa de juros poupados
    const monthlyRate = (Number(simDebt.interest_rate) || 12) / 12 / 100;
    const estimatedInterestSaved = (balance * monthlyRate * monthsSaved) * 0.75;

    return {
      currentMonthsLeft,
      acceleratedMonths,
      monthsSaved,
      estimatedInterestSaved
    };
  }, [simDebt, simExtraPayment]);

  return (
    <div className="debt-manager anim-fade-up">
      {/* ── Header ── */}
      <div className="debt-manager__header">
        <div className="debt-manager__title-group">
          <h1 className="debt-manager__title">
            <CreditCard size={28} color="var(--brand-primary)" />
            Mapa de Dívidas & Financiamentos
          </h1>
          <p className="debt-manager__subtitle">
            Controle de contratos, saldo devedor e estratégia de amortização com dados integrados via Open Finance
          </p>
        </div>

        {!readOnly && (
          <div className="debt-manager__actions">
            <Button
              onClick={() => setIsOpenFinanceOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(234, 179, 8, 0.12)',
                border: '1px solid var(--brand-primary)',
                color: 'var(--brand-primary)',
                fontWeight: 700
              }}
            >
              <Zap size={16} /> Open Finance (Auto)
            </Button>

            {debts.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setIsSimulatorOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Calculator size={16} /> Simular Amortização
              </Button>
            )}

            <Button onClick={handleOpenCreate} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} /> Adicionar Dívida
            </Button>
          </div>
        )}
      </div>

      {/* ── Overview KPIs ── */}
      <div className="debt-overview-grid">
        <div className={`debt-kpi-card ${totalOutstanding > 0 ? 'debt-kpi-card--danger' : 'debt-kpi-card--success'}`}>
          <div className="debt-kpi-top">
            <span>Saldo Devedor Total</span>
            <TrendingDown size={18} color={totalOutstanding > 0 ? 'var(--danger)' : 'var(--success)'} />
          </div>
          <div className="debt-kpi-val" style={{ color: totalOutstanding > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {totalOutstanding.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className="debt-kpi-sub">
            {debts.length} contrato(s) ativo(s) mapeado(s)
          </div>
        </div>

        <div className="debt-kpi-card debt-kpi-card--warning">
          <div className="debt-kpi-top">
            <span>Parcelas Mensais</span>
            <Calendar size={18} color="var(--warning)" />
          </div>
          <div className="debt-kpi-val" style={{ color: 'var(--warning)' }}>
            {totalMonthlyPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className="debt-kpi-sub">
            Impacto mensal no seu fluxo de caixa
          </div>
        </div>

        <div className="debt-kpi-card debt-kpi-card--info">
          <div className="debt-kpi-top">
            <span>Custo Médio de Juros (CET)</span>
            <Building2 size={18} color="var(--info)" />
          </div>
          <div className="debt-kpi-val" style={{ color: 'var(--info)' }}>
            {weightedInterestRate.toFixed(2)}% <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>a.a.</span>
          </div>
          <div className="debt-kpi-sub">
            Média ponderada do custo efetivo total
          </div>
        </div>

        <div className="debt-kpi-card debt-kpi-card--success">
          <div className="debt-kpi-top">
            <span>Score & Liquidez</span>
            <ShieldCheck size={18} color="var(--success)" />
          </div>
          <div className="debt-kpi-val" style={{ color: 'var(--success)' }}>
            {totalOutstanding === 0 ? 'Livre' : 'Controlado'}
          </div>
          <div className="debt-kpi-sub">
            Alinhado ao cálculo de Saúde Financeira
          </div>
        </div>
      </div>

      {/* ── Banner Estratégico de Amortização AFIC ── */}
      {debts.length > 0 && (
        <div className="debt-strategy-banner">
          <div className="debt-strategy-content">
            <div className="debt-strategy-icon">
              <Zap size={22} />
            </div>
            <div>
              <h3 className="debt-strategy-title">
                Método Avalanche AFIC: Priorize as taxas de juros mais altas
              </h3>
              <p className="debt-strategy-desc">
                Quitando primeiro as dívidas com maior custo (como rotativo e empréstimo pessoal), 
                você estanca o pagamento de juros compostos e reduz pela metade o tempo de endividamento.
              </p>
            </div>
          </div>

          <Button 
            onClick={() => setIsSimulatorOpen(true)}
            style={{ 
              background: 'var(--danger)', 
              color: '#ffffff', 
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
            }}
          >
            Calcular Economia com Amortização <ArrowRight size={16} />
          </Button>
        </div>
      )}

      {/* ── Filtros por Categoria ── */}
      <div className="debt-filter-bar">
        <button
          className={`debt-filter-btn ${selectedType === 'todos' ? 'debt-filter-btn--active' : ''}`}
          onClick={() => setSelectedType('todos')}
        >
          Todas ({debts.length})
        </button>

        {DEBT_TYPES.map(t => {
          const count = debts.filter(d => d.type === t.id).length;
          if (count === 0 && selectedType !== t.id) return null;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className={`debt-filter-btn ${selectedType === t.id ? 'debt-filter-btn--active' : ''}`}
              onClick={() => setSelectedType(t.id)}
            >
              <Icon size={14} />
              <span>{t.label} ({count})</span>
            </button>
          );
        })}
      </div>

      {/* ── Grid de Dívidas ── */}
      {loading ? (
        <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
          Carregando contratos de dívidas...
        </Card>
      ) : filteredDebts.length === 0 ? (
        <div className="debt-empty-state">
          <div className="debt-empty-icon">
            <CheckCircle size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {debts.length === 0 ? 'Parabéns! Nenhuma dívida registrada.' : 'Nenhuma dívida nesta categoria.'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '420px', margin: 0 }}>
            {debts.length === 0
              ? 'Conecte seus bancos via Open Finance para mapear financiamentos automaticamente ou adicione manualmente se possuir contratos ativos.'
              : 'Selecione outra categoria no filtro acima para visualizar suas outras pendências.'}
          </p>

          {!readOnly && debts.length === 0 && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
              <Button onClick={() => setIsOpenFinanceOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={16} /> Sincronizar Open Finance
              </Button>
              <Button variant="outline" onClick={handleOpenCreate}>
                + Cadastrar Dívida
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="debt-grid">
          {filteredDebts.map(debt => {
            const config = DEBT_TYPES.find(t => t.id === debt.type) || DEBT_TYPES[6];
            const Icon = config.icon;
            const isOpenFinance = debt.connection_id || debt.external_id || debt.notes?.includes('Open Finance');
            const pctPaid = debt.installments_total > 0 
              ? Math.min(100, (debt.installments_paid / debt.installments_total) * 100) 
              : 0;

            return (
              <div key={debt.id} className="debt-card">
                <div className="debt-card-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span className={`debt-badge-type debt-badge--${debt.type}`}>
                        <Icon size={12} /> {config.label}
                      </span>
                      {isOpenFinance && (
                        <span className="debt-badge-auto">
                          <Zap size={10} /> Open Finance
                        </span>
                      )}
                    </div>
                    <h3 className="debt-card-title">{debt.name}</h3>
                    {debt.institution && (
                      <span className="debt-card-inst">
                        <Building2 size={12} /> {debt.institution}
                      </span>
                    )}
                  </div>

                  {!readOnly && (
                    <div className="debt-card-actions">
                      <button className="debt-action-btn" onClick={() => handleOpenEdit(debt)} title="Editar">
                        <Edit2 size={15} />
                      </button>
                      <button className="debt-action-btn debt-action-btn--delete" onClick={() => handleDeleteDebt(debt)} title="Quitar/Excluir">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Métricas Principais */}
                <div className="debt-metrics-row">
                  <div className="debt-metric-item">
                    <span className="debt-metric-lbl">Saldo Devedor Atual</span>
                    <span className="debt-metric-val" style={{ color: 'var(--danger)' }}>
                      {Number(debt.outstanding_balance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>

                  <div className="debt-metric-item">
                    <span className="debt-metric-lbl">Valor da Parcela</span>
                    <span className="debt-metric-val">
                      {Number(debt.installment_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>

                  <div className="debt-metric-item">
                    <span className="debt-metric-lbl">Taxa de Juros</span>
                    <span className="debt-metric-val" style={{ color: Number(debt.interest_rate) > 20 ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {debt.interest_rate ? `${debt.interest_rate}% a.a.` : 'Não informada'}
                    </span>
                  </div>

                  <div className="debt-metric-item">
                    <span className="debt-metric-lbl">Valor Original Contratado</span>
                    <span className="debt-metric-val" style={{ color: 'var(--text-muted)' }}>
                      {Number(debt.total_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>

                {/* Progresso das Parcelas */}
                {debt.installments_total > 1 && (
                  <div className="debt-installments-box">
                    <div className="debt-installments-info">
                      <span>Progresso de Pagamento</span>
                      <strong>{debt.installments_paid} de {debt.installments_total} parcelas ({pctPaid.toFixed(0)}%)</strong>
                    </div>
                    <div className="debt-progress-bar">
                      <div className="debt-progress-fill" style={{ width: `${pctPaid}%` }} />
                    </div>
                  </div>
                )}

                {/* Footer do Card */}
                <div className="debt-card-footer">
                  <span style={{ color: 'var(--text-muted)' }}>
                    {debt.due_date ? `Vencimento: dia ${debt.due_date}` : 'Parcelas em dia'}
                  </span>
                  {debt.installments_remaining > 0 && (
                    <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Faltam {debt.installments_remaining}x
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal Cadastro / Edição Manual ── */}
      {isModalOpen && (
        <div className="tx-modal-overlay">
          <div className="tx-modal anim-fade-up" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {editingDebt ? 'Editar Dívida / Contrato' : 'Cadastrar Nova Dívida'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDebt} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Nome da Dívida / Contrato *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Financiamento Imobiliário Caixa, Empréstimo Pessoal..."
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Tipo de Dívida
                  </label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value as any)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }}
                  >
                    {DEBT_TYPES.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Instituição / Banco
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Caixa, Bradesco, Nubank..."
                    value={formInstitution}
                    onChange={e => setFormInstitution(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Saldo Devedor Atual (R$) *
                  </label>
                  <MoneyInput
                    value={formOutstanding}
                    onChange={setFormOutstanding}
                    placeholder="R$ 0,00"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Valor da Parcela Mensal (R$)
                  </label>
                  <MoneyInput
                    value={formInstallment}
                    onChange={setFormInstallment}
                    placeholder="R$ 0,00"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Total Parcelas
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="12"
                    value={formInstallmentsTotal}
                    onChange={e => setFormInstallmentsTotal(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Parcelas Pagas
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formInstallmentsPaid}
                    onChange={e => setFormInstallmentsPaid(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Taxa Juros (% a.a.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 12.5"
                    value={formInterestRate}
                    onChange={e => setFormInterestRate(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Observações / Notas
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Financiamento SAC com amortização semestral..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Dívida'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Simulador de Amortização ── */}
      {isSimulatorOpen && simDebt && (
        <div className="tx-modal-overlay">
          <div className="tx-modal anim-fade-up" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calculator size={20} color="var(--brand-primary)" />
                  Simulador de Amortização Extraordinária
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Veja o poder de quitar parcelas antecipadas no prazo e nos juros
                </span>
              </div>
              <button onClick={() => setIsSimulatorOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Selecione o Contrato para Simulação:
                </label>
                <select
                  value={simSelectedDebtId || simDebt.id}
                  onChange={e => setSimSelectedDebtId(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }}
                >
                  {debts.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} (Saldo: {Number(d.outstanding_balance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Aporte Extraordinário Mensal Adicional (R$):
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['200', '500', '1000', '2000'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSimExtraPayment(val)}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: 'var(--r-md)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        border: '1px solid',
                        borderColor: simExtraPayment === val ? 'var(--brand-primary)' : 'var(--border-color)',
                        background: simExtraPayment === val ? 'rgba(234, 179, 8, 0.15)' : 'var(--bg-app)',
                        color: simExtraPayment === val ? 'var(--brand-primary)' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      + R$ {val}
                    </button>
                  ))}
                </div>
              </div>

              {simResult && (
                <div style={{
                  padding: '1.25rem',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: 'var(--r-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Prazo original restante:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{simResult.currentMonthsLeft} meses ({Math.ceil(simResult.currentMonthsLeft / 12)} anos)</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Novo prazo com amortização:</span>
                    <strong style={{ color: 'var(--success)' }}>{simResult.acceleratedMonths} meses ({Math.ceil(simResult.acceleratedMonths / 12)} anos)</strong>
                  </div>

                  <div style={{ height: '1px', background: 'rgba(16, 185, 129, 0.2)' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Tempo antecipado:
                    </span>
                    <strong style={{ color: 'var(--brand-primary)', fontSize: '1.1rem' }}>
                      {simResult.monthsSaved} meses mais rápido!
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Economia estimada em juros:
                    </span>
                    <strong style={{ color: 'var(--success)', fontSize: '1.2rem' }}>
                      ~ {simResult.estimatedInterestSaved.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </strong>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <Button onClick={() => setIsSimulatorOpen(false)}>
                  Entendi, aplicar na minha estratégia
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Open Finance Brasil ── */}
      <OpenFinanceModal
        userId={effectiveUserId}
        isOpen={isOpenFinanceOpen}
        onClose={() => setIsOpenFinanceOpen(false)}
        onSuccess={() => {
          fetchDebts();
        }}
      />
    </div>
  );
};
