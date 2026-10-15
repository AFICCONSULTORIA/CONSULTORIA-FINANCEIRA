import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, ArrowDownRight, ArrowRight, Plus, 
  Clock, Calendar, Trash2 
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { 
  useRecentTransactions, 
  useTransactionMutations, 
  type TransactionItem 
} from '../../../hooks/useTransactions';
import { QuickTransactionModal } from './QuickTransactionModal';

interface RecentTransactionsWidgetProps {
  userId?: string;
  limit?: number;
}

export const RecentTransactionsWidget: React.FC<RecentTransactionsWidgetProps> = ({ 
  userId, 
  limit = 5 
}) => {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: transactions = [], isLoading } = useRecentTransactions(effectiveUserId, limit);
  const { deleteTransaction } = useTransactionMutations();

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const today = new Date();
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dateZero = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffTime = todayZero.getTime() - dateZero.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Deseja excluir este lançamento?')) {
      await deleteTransaction.mutateAsync(id);
    }
  };

  return (
    <div className="dash-card anim-fade-up">
      {/* Header do Widget */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div 
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: 'var(--r-md)', 
              background: 'rgba(234, 179, 8, 0.12)', 
              color: 'var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={16} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Últimas Movimentações
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Seus registros mais recentes
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              color: 'var(--brand-primary)',
              borderRadius: 'var(--r-md)',
              padding: '0.35rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={14} /> Novo
          </button>

          <Link
            to="/client/expenses"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
          >
            Ver Extrato <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Lista de Transações */}
      {isLoading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Carregando movimentações...
        </div>
      ) : transactions.length === 0 ? (
        <div 
          style={{ 
            padding: '2rem 1rem', 
            textAlign: 'center', 
            background: 'var(--bg-input)', 
            borderRadius: 'var(--r-lg)',
            border: '1px dashed var(--border-color)',
          }}
        >
          <Calendar size={28} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', opacity: 0.5 }} />
          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Nenhum lançamento registrado
          </p>
          <p style={{ margin: '0.25rem 0 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Comece cadastrando suas primeiras entradas ou despesas.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'var(--brand-primary)',
              color: '#000',
              border: 'none',
              borderRadius: 'var(--r-md)',
              padding: '0.45rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            <Plus size={15} /> Cadastrar Lançamento
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {transactions.map((tx) => {
            const isExp = tx.type === 'expense';
            return (
              <div
                key={tx.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 0.85rem',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--r-md)',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--r-sm)',
                      background: isExp ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                      color: isExp ? 'var(--danger)' : 'var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isExp ? <ShoppingBag size={15} /> : <ArrowDownRight size={15} />}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '180px',
                      }}
                      title={tx.description}
                    >
                      {tx.description}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <span>{tx.category || (isExp ? 'Despesa' : 'Receita')}</span>
                      <span>•</span>
                      {(() => {
                        const lbl = formatDateLabel(tx.date);
                        if (lbl === 'Hoje') {
                          return <span style={{ color: '#FACC15', fontWeight: 700 }}>Hoje</span>;
                        }
                        if (lbl === 'Ontem') {
                          return <span style={{ color: '#22D3EE', fontWeight: 700 }}>Ontem</span>;
                        }
                        return <span>{lbl}</span>;
                      })()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      color: isExp ? 'var(--danger)' : 'var(--success)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isExp ? '-' : '+'}{formatCurrency(Number(tx.amount))}
                  </span>

                  <button
                    onClick={(e) => handleDelete(tx.id, e)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '0.2rem',
                      borderRadius: 'var(--r-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Excluir"
                    aria-label="Excluir lançamento"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <QuickTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={effectiveUserId}
      />
    </div>
  );
};
