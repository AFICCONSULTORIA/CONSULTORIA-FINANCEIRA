import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  X, Loader2, ArrowUpRight, Flame
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useCalendarTransactions, type TransactionItem } from '../../../hooks/useTransactions';
import './DailyExpenseCalendar.css';

interface DailyExpenseCalendarProps {
  userId?: string;
}

const WEEKDAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const WEEKDAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export const DailyExpenseCalendar: React.FC<DailyExpenseCalendarProps> = ({ userId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  const today = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth()); // 0-11
  const [activeDateStr, setActiveDateStr] = useState<string | null>(null);

  const popoverRef = useRef<HTMLDivElement>(null);

  // Fechar popover ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActiveDateStr(null);
      }
    }
    if (activeDateStr) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDateStr]);

  // Informações de datas do mês
  const { daysInMonth, startDayOffset } = useMemo(() => {
    const start = new Date(selectedYear, selectedMonth, 1);
    const end = new Date(selectedYear, selectedMonth + 1, 0);

    const dayOfWeek = start.getDay();
    // Segunda-feira como início (Seg=0, ..., Dom=6)
    const offset = (dayOfWeek + 6) % 7;

    return {
      daysInMonth: end.getDate(),
      startDayOffset: offset,
    };
  }, [selectedYear, selectedMonth]);

  // Busca de transações via TanStack Query (reativo e atualizado)
  const { data: monthTransactions = [], isLoading } = useCalendarTransactions(
    effectiveUserId,
    selectedYear,
    selectedMonth
  );

  // Agrupamento de despesas por dia e total do mês
  const { dailyDataMap, totalExpenseMonth } = useMemo(() => {
    const map: Record<string, { totalExpense: number; expenseCount: number; items: TransactionItem[] }> = {};
    let totalExpense = 0;

    for (const tx of monthTransactions) {
      if (tx.type === 'expense') {
        const dateKey = tx.date;
        if (!map[dateKey]) {
          map[dateKey] = { totalExpense: 0, expenseCount: 0, items: [] };
        }

        const amt = Number(tx.amount) || 0;
        map[dateKey].totalExpense += amt;
        map[dateKey].expenseCount += 1;
        map[dateKey].items.push(tx);
        totalExpense += amt;
      }
    }

    return {
      dailyDataMap: map,
      totalExpenseMonth: totalExpense,
    };
  }, [monthTransactions]);

  // Navegação de meses
  const handlePrevMonth = () => {
    setActiveDateStr(null);
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    setActiveDateStr(null);
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleGoToToday = () => {
    setActiveDateStr(null);
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
  };

  const isCurrentMonth = selectedYear === today.getFullYear() && selectedMonth === today.getMonth();

  const monthLabel = useMemo(() => {
    const dateObj = new Date(selectedYear, selectedMonth, 1);
    return dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [selectedYear, selectedMonth]);

  // Níveis de calor visual
  const getHeatLevel = (amount: number): 0 | 1 | 2 | 3 | 4 => {
    if (amount <= 0) return 0;
    if (amount <= 100) return 1;
    if (amount <= 300) return 2;
    if (amount <= 700) return 3;
    return 4;
  };

  const formatCompactCurrency = (val: number): string => {
    if (val >= 1000) {
      return `R$ ${(val / 1000).toFixed(1).replace('.', ',')}k`;
    }
    return `R$ ${Math.round(val)}`;
  };

  const formatFullCurrency = (val: number): string => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const activeDayDetails = activeDateStr ? dailyDataMap[activeDateStr] : null;

  return (
    <div className="expense-calendar-card anim-fade-up">
      {/* Header do Mapa de Gastos */}
      <div className="expense-calendar__header">
        <div className="expense-calendar__title-group">
          <div className="expense-calendar__icon-badge">
            <CalendarIcon size={22} />
          </div>
          <div>
            <h3 className="expense-calendar__title">Mapa de Gastos Diários</h3>
            <p className="expense-calendar__subtitle">
              Visualize claramente em quais dias do mês ocorreram suas maiores saídas
            </p>
          </div>
        </div>

        {/* Controles de Navegação e Totalizador */}
        <div className="expense-calendar__controls">
          <div className="expense-calendar__summary-pill">
            <span className="expense-calendar__summary-label">Total Gasto no Mês</span>
            <span className="expense-calendar__summary-val">
              {formatFullCurrency(totalExpenseMonth)}
            </span>
          </div>

          <div className="expense-calendar__nav">
            <button
              onClick={handlePrevMonth}
              className="expense-calendar__nav-btn"
              title="Mês Anterior"
              aria-label="Mês Anterior"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="expense-calendar__month-display">
              <span className="expense-calendar__current-month">{monthLabel}</span>
              {isLoading && (
                <Loader2 size={14} className="expense-calendar__loading-spinner anim-spin" />
              )}
            </div>

            <button
              onClick={handleNextMonth}
              className="expense-calendar__nav-btn"
              title="Próximo Mês"
              aria-label="Próximo Mês"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {!isCurrentMonth && (
            <button onClick={handleGoToToday} className="expense-calendar__today-btn">
              Mês Atual
            </button>
          )}
        </div>
      </div>

      {/* Grid do Calendário com Células Espaçosas */}
      <div className="expense-calendar__grid">
        {WEEKDAYS_SHORT.map((wd) => (
          <div key={wd} className="expense-calendar__weekday">
            {wd}
          </div>
        ))}

        {/* Células vazias de offset */}
        {Array.from({ length: startDayOffset }).map((_, idx) => (
          <div key={`empty-${idx}`} className="expense-calendar__day expense-calendar__day--empty" />
        ))}

        {/* Células dos dias do mês */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const pad = (n: number) => String(n).padStart(2, '0');
          const dateStr = `${selectedYear}-${pad(selectedMonth + 1)}-${pad(dayNum)}`;

          const isToday =
            today.getFullYear() === selectedYear &&
            today.getMonth() === selectedMonth &&
            today.getDate() === dayNum;

          const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
          const isYesterday =
            yesterday.getFullYear() === selectedYear &&
            yesterday.getMonth() === selectedMonth &&
            yesterday.getDate() === dayNum;

          const dayData = dailyDataMap[dateStr];
          const expenseAmount = dayData?.totalExpense || 0;
          const heatLevel = getHeatLevel(expenseAmount);
          const isSelected = activeDateStr === dateStr;

          return (
            <div
              key={dateStr}
              onClick={() => {
                if (expenseAmount > 0) {
                  setActiveDateStr(activeDateStr === dateStr ? null : dateStr);
                }
              }}
              className={`expense-calendar__day ${isToday ? 'expense-calendar__day--today' : ''} ${
                isYesterday ? 'expense-calendar__day--yesterday' : ''
              } ${isSelected ? 'expense-calendar__day--selected' : ''} ${
                heatLevel > 0 ? `expense-calendar__day--heat-${heatLevel}` : ''
              }`}
            >
              <div className="expense-calendar__day-top">
                <span className="expense-calendar__day-number">{dayNum}</span>
                {isToday && <span className="expense-calendar__today-badge">Hoje</span>}
                {isYesterday && <span className="expense-calendar__yesterday-badge">Ontem</span>}
                {heatLevel > 0 && (
                  <span className={`expense-calendar__heat-dot expense-calendar__heat-dot--level-${heatLevel}`} />
                )}
              </div>

              {/* Valor em destaque bem visível */}
              {expenseAmount > 0 ? (
                <div className="expense-calendar__day-amount-badge">
                  <span className="expense-calendar__day-amount-text">
                    {formatCompactCurrency(expenseAmount)}
                  </span>
                </div>
              ) : (
                <div className="expense-calendar__day-amount-empty">—</div>
              )}

              {/* Barra inferior de calor colorida */}
              {heatLevel > 0 && (
                <div className={`expense-calendar__heat-bar expense-calendar__heat-bar--level-${heatLevel}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Popover Flutuante Detalhado ao Clicar */}
      {activeDateStr && activeDayDetails && (
        <div ref={popoverRef} className="expense-calendar__popover">
          <div className="expense-calendar__popover-header">
            <div>
              <div className="expense-calendar__popover-date">
                {new Date(activeDateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </div>
              <div className="expense-calendar__popover-total">
                Total gasto no dia: <strong>{formatFullCurrency(activeDayDetails.totalExpense)}</strong>
              </div>
            </div>
            <button
              onClick={() => setActiveDateStr(null)}
              className="expense-calendar__popover-close"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          <div className="expense-calendar__popover-list">
            {activeDayDetails.items.map((item) => (
              <div key={item.id} className="expense-calendar__popover-item">
                <div style={{ minWidth: 0 }}>
                  <div className="expense-calendar__popover-item-desc" title={item.description}>
                    {item.description}
                  </div>
                  <div className="expense-calendar__popover-item-cat">
                    {item.category || 'Despesa'} {item.payment_method ? `• ${item.payment_method}` : ''}
                  </div>
                </div>

                <div className="expense-calendar__popover-item-val">
                  -{formatFullCurrency(Number(item.amount))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/client/expenses')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--brand-primary)',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer'
              }}
            >
              Gerenciar em Lançamentos <ArrowUpRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Legenda de Níveis de Gasto Grande e Legível */}
      <div className="expense-calendar__legend">
        <span className="expense-calendar__legend-label">Escala de Gastos:</span>
        <div className="expense-calendar__legend-item">
          <span className="expense-calendar__heat-dot expense-calendar__heat-dot--level-1" />
          <span>Até R$ 100</span>
        </div>
        <div className="expense-calendar__legend-item">
          <span className="expense-calendar__heat-dot expense-calendar__heat-dot--level-2" />
          <span>R$ 100 a R$ 300</span>
        </div>
        <div className="expense-calendar__legend-item">
          <span className="expense-calendar__heat-dot expense-calendar__heat-dot--level-3" />
          <span>R$ 300 a R$ 700</span>
        </div>
        <div className="expense-calendar__legend-item">
          <span className="expense-calendar__heat-dot expense-calendar__heat-dot--level-4" />
          <span>Acima de R$ 700</span>
        </div>
      </div>
    </div>
  );
};
