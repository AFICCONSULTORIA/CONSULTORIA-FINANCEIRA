import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Upload, X, Check, FileText, TrendingUp, TrendingDown, 
  RefreshCw, Landmark, Filter, Search, Tag, AlertTriangle, 
  CheckSquare, Square, Layers, ArrowRight
} from 'lucide-react';
import { 
  parseOfx, 
  extractOfxMetadata, 
  type ParsedOfxTransaction, 
  type OfxMetadata 
} from '../../../utils/ofxParser';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../../../components/ui/Button';
import './OfxImporterModal.css';

interface OfxImporterModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  'Custo Fixo',
  'Conforto',
  'Lazer',
  'Investimento',
  'Reserva',
  'Metas & Sonhos',
  'Alimentação',
  'Moradia',
  'Transporte',
  'Saúde',
  'Educação',
  'Salário / Renda Principal',
  'Renda Extra',
  'Outros'
];

export const OfxImporterModal: React.FC<OfxImporterModalProps> = ({
  userId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [parsedItems, setParsedItems] = useState<ParsedOfxTransaction[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [metadata, setMetadata] = useState<OfxMetadata | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtros internos da pré-visualização do OFX
  const [previewFilter, setPreviewFilter] = useState<'all' | 'income' | 'expense' | 'selected'>('all');
  const [previewSearch, setPreviewSearch] = useState('');
  const [bulkCategory, setBulkCategory] = useState(CATEGORIES[0]);

  // Checagem de duplicatas existentes no banco
  const [existingSignatures, setExistingSignatures] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen || !userId) return;

    // Busca transações recentes para alertar sobre duplicatas
    const fetchExisting = async () => {
      try {
        const { data } = await supabase
          .from('transactions')
          .select('date, amount, type')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(500);

        if (data) {
          const sigs = new Set(data.map(d => `${d.date}_${Number(d.amount).toFixed(2)}_${d.type}`));
          setExistingSignatures(sigs);
        }
      } catch (err) {
        console.warn('Erro ao carregar transações para verificação de duplicidade:', err);
      }
    };

    fetchExisting();
  }, [isOpen, userId]);

  /**
   * Leitura inteligente do arquivo com detecção de codificação UTF-8 ou ISO-8859-1 (comum em bancos brasileiros)
   */
  const handleFileRead = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.ofx')) {
      toast.error('Por favor, selecione um arquivo válido com extensão .ofx');
      return;
    }

    setLoading(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) throw new Error('Arquivo vazio');

        // Testa UTF-8 primeiro
        let text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);

        // Se detectar declaração de codificação ISO-8859-1 ou CHARSET:1252 no cabeçalho
        if (/CHARSET:(?:1252|ISO-8859-1)/i.test(text) || /ENCODING:USASCII/i.test(text)) {
          try {
            text = new TextDecoder('iso-8859-1').decode(buffer);
          } catch (e) {
            // mantém UTF-8 se falhar
          }
        }

        const meta = extractOfxMetadata(text);
        const result = parseOfx(text);

        if (result.length === 0) {
          toast.error('Nenhum lançamento válido foi encontrado neste arquivo OFX.');
          setParsedItems([]);
          setMetadata(null);
        } else {
          setMetadata(meta);
          setParsedItems(result);
          toast.success(`${result.length} lançamentos encontrados no extrato!`);
        }
      } catch (err) {
        console.error('Erro ao ler OFX:', err);
        toast.error('Falha ao processar a leitura do arquivo OFX.');
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      toast.error('Erro ao ler o arquivo no dispositivo.');
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileRead(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileRead(e.dataTransfer.files[0]);
    }
  };

  // Controles de seleção
  const handleToggleSelectAll = (checked: boolean) => {
    setParsedItems(prev => prev.map(item => ({ ...item, selected: checked })));
  };

  const handleSelectByType = (type: 'income' | 'expense') => {
    setParsedItems(prev => prev.map(item => ({
      ...item,
      selected: item.type === type ? true : item.selected
    })));
  };

  const handleDeselectByType = (type: 'income' | 'expense') => {
    setParsedItems(prev => prev.map(item => ({
      ...item,
      selected: item.type === type ? false : item.selected
    })));
  };

  const handleToggleItem = (id: string) => {
    setParsedItems(prev =>
      prev.map(item => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleCategoryChange = (id: string, newCategory: string) => {
    setParsedItems(prev =>
      prev.map(item => (item.id === id ? { ...item, category: newCategory } : item))
    );
  };

  const handleDescriptionChange = (id: string, newDesc: string) => {
    setParsedItems(prev =>
      prev.map(item => (item.id === id ? { ...item, description: newDesc } : item))
    );
  };

  // Aplicação de categoria em massa nos selecionados
  const handleApplyBulkCategory = () => {
    const count = parsedItems.filter(i => i.selected).length;
    if (count === 0) {
      toast.error('Selecione ao menos um item para aplicar a categoria.');
      return;
    }
    setParsedItems(prev =>
      prev.map(item => (item.selected ? { ...item, category: bulkCategory } : item))
    );
    toast.success(`Categoria "${bulkCategory}" aplicada a ${count} itens!`);
  };

  // Totais do OFX
  const summary = useMemo(() => {
    let incomeTotal = 0;
    let expenseTotal = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    let selectedIncome = 0;
    let selectedExpense = 0;

    parsedItems.forEach(item => {
      const amt = Number(item.amount) || 0;
      if (item.type === 'income') {
        incomeTotal += amt;
        incomeCount++;
        if (item.selected) selectedIncome += amt;
      } else {
        expenseTotal += amt;
        expenseCount++;
        if (item.selected) selectedExpense += amt;
      }
    });

    return {
      incomeTotal,
      expenseTotal,
      balance: incomeTotal - expenseTotal,
      incomeCount,
      expenseCount,
      totalCount: parsedItems.length,
      selectedCount: parsedItems.filter(i => i.selected).length,
      selectedBalance: selectedIncome - selectedExpense,
    };
  }, [parsedItems]);

  // Itens filtrados para exibição na tabela de conferência
  const visibleItems = useMemo(() => {
    return parsedItems.filter(item => {
      if (previewFilter === 'income' && item.type !== 'income') return false;
      if (previewFilter === 'expense' && item.type !== 'expense') return false;
      if (previewFilter === 'selected' && !item.selected) return false;

      if (previewSearch.trim()) {
        const query = previewSearch.toLowerCase();
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesCat = (item.category || '').toLowerCase().includes(query);
        const matchesAmt = item.amount.toString().includes(query);
        if (!matchesDesc && !matchesCat && !matchesAmt) return false;
      }

      return true;
    });
  }, [parsedItems, previewFilter, previewSearch]);

  const handleConfirmImport = async () => {
    const itemsToImport = parsedItems.filter(i => i.selected);

    if (itemsToImport.length === 0) {
      toast.error('Selecione ao menos um lançamento para importar.');
      return;
    }

    setImporting(true);
    try {
      const payloads = itemsToImport.map(item => ({
        user_id: userId,
        type: item.type,
        description: item.description.trim() || 'Lançamento OFX',
        amount: item.amount,
        category: item.category || 'Outros',
        payment_method: item.paymentMethod || 'Extrato Bancário',
        status: 'completed',
        date: item.date,
        notes: metadata?.bankName ? `Importado via OFX (${metadata.bankName})` : 'Importado via OFX'
      }));

      const { error } = await supabase.from('transactions').insert(payloads);

      if (error) throw error;

      toast.success(`${payloads.length} lançamentos importados com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['transactions_calendar'] });
      queryClient.invalidateQueries({ queryKey: ['transactions_summary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions_recent'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erro ao importar lançamentos:', err);
      toast.error('Erro ao salvar os lançamentos no banco de dados.');
    } finally {
      setImporting(false);
    }
  };

  const handleResetFile = () => {
    setParsedItems([]);
    setFileName('');
    setMetadata(null);
    setPreviewSearch('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (!isOpen) return null;

  return (
    <div className="tx-modal-overlay">
      <div className="tx-modal anim-fade-up ofx-importer-modal">
        {/* ── Header do Modal ── */}
        <div className="ofx-importer-modal__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="ofx-importer-modal__icon">
              <Landmark size={22} />
            </div>
            <div>
              <h2 className="ofx-modal-title">
                Importação Inteligente de Extrato (.OFX)
              </h2>
              <p className="ofx-modal-sub">
                Conciliação bancária automática com limpeza e categorização assistida
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ofx-close-btn"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Corpo: Passo 1 (Upload) ou Passo 2 (Revisão & Edição) ── */}
        {parsedItems.length === 0 ? (
          <div className="ofx-upload-step">
            <div
              className={`ofx-dropzone ${isDragOver ? 'ofx-dropzone--active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".ofx"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <div className="ofx-dropzone__icon-box">
                {loading ? <RefreshCw className="spin" size={32} /> : <Upload size={32} />}
              </div>
              <h3 className="ofx-dropzone-title">
                {loading ? 'Processando e Decodificando Extrato...' : 'Arraste ou clique para selecionar seu arquivo .OFX'}
              </h3>
              <p className="ofx-dropzone-desc">
                Compatível com extratos de conta corrente e faturas de cartão de crédito de todos os bancos do Brasil:
                <br />
                <strong>Nubank, Itaú, Bradesco, Santander, Banco do Brasil, Inter, C6 Bank, Caixa, PicPay, etc.</strong>
              </p>
              <Button type="button" variant="outline" style={{ marginTop: '1.25rem' }}>
                <Upload size={16} /> Selecionar Arquivo do Dispositivo
              </Button>
            </div>
          </div>
        ) : (
          <div className="ofx-preview-step">
            {/* Banner com Dados do Banco Detectado */}
            <div className="ofx-bank-banner">
              <div className="ofx-bank-banner-left">
                <div className="ofx-bank-icon-badge">
                  <Landmark size={18} />
                </div>
                <div>
                  <div className="ofx-bank-name">
                    {metadata?.bankName || 'Instituição Bancária'}
                  </div>
                  <div className="ofx-bank-meta">
                    <span>{fileName}</span>
                    {metadata?.accountType === 'credit_card' && <span>• Cartão de Crédito</span>}
                    {metadata?.accountNumber && <span>• Conta: {metadata.accountNumber}</span>}
                    {metadata?.startDate && metadata?.endDate && (
                      <span>• Período: {metadata.startDate.split('-').reverse().join('/')} até {metadata.endDate.split('-').reverse().join('/')}</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="ofx-switch-file-btn"
                onClick={handleResetFile}
                title="Trocar arquivo"
              >
                <RefreshCw size={14} /> Trocar Arquivo
              </button>
            </div>

            {/* Faixa de KPIs Executivos do Extrato */}
            <div className="ofx-kpi-strip">
              <div className="ofx-kpi-item ofx-kpi-item--income">
                <span className="ofx-kpi-label">Entradas ({summary.incomeCount})</span>
                <span className="ofx-kpi-value">{formatCurrency(summary.incomeTotal)}</span>
              </div>
              <div className="ofx-kpi-item ofx-kpi-item--expense">
                <span className="ofx-kpi-label">Saídas ({summary.expenseCount})</span>
                <span className="ofx-kpi-value">{formatCurrency(summary.expenseTotal)}</span>
              </div>
              <div className="ofx-kpi-item ofx-kpi-item--balance">
                <span className="ofx-kpi-label">Saldo do Extrato</span>
                <span className={`ofx-kpi-value ${summary.balance >= 0 ? 'ofx-kpi-value--pos' : 'ofx-kpi-value--neg'}`}>
                  {formatCurrency(summary.balance)}
                </span>
              </div>
              <div className="ofx-kpi-item ofx-kpi-item--selected">
                <span className="ofx-kpi-label">A Importar</span>
                <span className="ofx-kpi-value">
                  {summary.selectedCount} / {summary.totalCount} itens
                </span>
              </div>
            </div>

            {/* Barra de Filtros Rápidos, Busca e Categorização em Massa */}
            <div className="ofx-toolbar">
              {/* Filtros em Segmented Control */}
              <div className="ofx-segmented">
                <button
                  type="button"
                  className={`ofx-segment-btn ${previewFilter === 'all' ? 'ofx-segment-btn--active' : ''}`}
                  onClick={() => setPreviewFilter('all')}
                >
                  Todos ({summary.totalCount})
                </button>
                <button
                  type="button"
                  className={`ofx-segment-btn ${previewFilter === 'expense' ? 'ofx-segment-btn--active-expense' : ''}`}
                  onClick={() => setPreviewFilter('expense')}
                >
                  Saídas ({summary.expenseCount})
                </button>
                <button
                  type="button"
                  className={`ofx-segment-btn ${previewFilter === 'income' ? 'ofx-segment-btn--active-income' : ''}`}
                  onClick={() => setPreviewFilter('income')}
                >
                  Entradas ({summary.incomeCount})
                </button>
                <button
                  type="button"
                  className={`ofx-segment-btn ${previewFilter === 'selected' ? 'ofx-segment-btn--active' : ''}`}
                  onClick={() => setPreviewFilter('selected')}
                >
                  Marcados ({summary.selectedCount})
                </button>
              </div>

              {/* Busca Rápida */}
              <div className="ofx-search-wrap">
                <Search size={14} className="ofx-search-icon" />
                <input
                  type="text"
                  placeholder="Filtrar lançamentos..."
                  value={previewSearch}
                  onChange={(e) => setPreviewSearch(e.target.value)}
                  className="ofx-search-input"
                />
                {previewSearch && (
                  <button className="ofx-search-clear" onClick={() => setPreviewSearch('')}>
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Aplicação em massa de categoria */}
              <div className="ofx-bulk-cat-wrap">
                <Tag size={13} style={{ color: 'var(--brand-primary)' }} />
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  className="ofx-bulk-select"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button
                  type="button"
                  className="ofx-bulk-apply-btn"
                  onClick={handleApplyBulkCategory}
                  title="Aplicar aos lançamentos selecionados"
                >
                  Aplicar Categoria
                </button>
              </div>
            </div>

            {/* Barra de Seleção Rápida */}
            <div className="ofx-selection-strip">
              <label className="ofx-select-all-label">
                <input
                  type="checkbox"
                  checked={summary.selectedCount === summary.totalCount && summary.totalCount > 0}
                  onChange={(e) => handleToggleSelectAll(e.target.checked)}
                />
                <span>Selecionar Todos ({summary.selectedCount}/{summary.totalCount})</span>
              </label>

              <div className="ofx-quick-selection-links">
                <button type="button" onClick={() => handleSelectByType('expense')}>Marcar Saídas</button>
                <span>•</span>
                <button type="button" onClick={() => handleSelectByType('income')}>Marcar Entradas</button>
                <span>•</span>
                <button type="button" onClick={() => handleToggleSelectAll(false)}>Desmarcar Tudo</button>
              </div>
            </div>

            {/* Tabela de Lançamentos com Edição Inline */}
            <div className="ofx-table-container">
              <table className="ofx-table">
                <thead>
                  <tr>
                    <th style={{ width: '44px', textAlign: 'center' }}></th>
                    <th style={{ width: '105px' }}>Data</th>
                    <th>Descrição (Editável)</th>
                    <th style={{ width: '200px' }}>Categoria</th>
                    <th style={{ width: '150px', textAlign: 'right' }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        Nenhum lançamento corresponde ao filtro atual.
                      </td>
                    </tr>
                  ) : (
                    visibleItems.map((item) => {
                      const sig = `${item.date}_${Number(item.amount).toFixed(2)}_${item.type}`;
                      const isPossibleDuplicate = existingSignatures.has(sig);

                      return (
                        <tr 
                          key={item.id} 
                          className={`${item.selected ? 'ofx-tr--selected' : 'ofx-tr--unselected'} ${isPossibleDuplicate ? 'ofx-tr--duplicate' : ''}`}
                        >
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={!!item.selected}
                              onChange={() => handleToggleItem(item.id)}
                            />
                          </td>
                          <td style={{ whiteSpace: 'nowrap', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                            {item.date ? item.date.split('-').reverse().join('/') : '-'}
                          </td>
                          <td>
                            <div className="ofx-cell-desc-wrap">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleDescriptionChange(item.id, e.target.value)}
                                className="ofx-inline-desc-input"
                                title="Clique para editar a descrição"
                              />
                              {isPossibleDuplicate && (
                                <span className="ofx-dup-badge" title="Uma transação com mesmo valor e data já existe no seu histórico">
                                  <AlertTriangle size={11} /> Possível Duplicata
                                </span>
                              )}
                              {item.paymentMethod === 'Cartão de Crédito' && (
                                <span className="ofx-meta-pill">Cartão</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <select
                              value={item.category || 'Outros'}
                              onChange={(e) => handleCategoryChange(item.id, e.target.value)}
                              className="ofx-cat-select"
                            >
                              {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <span className={`ofx-amount-badge ${item.type === 'income' ? 'ofx-amount-badge--income' : 'ofx-amount-badge--expense'}`}>
                              {item.type === 'income' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                              {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Rodapé de Ações do Modal */}
            <div className="ofx-modal-footer">
              <Button type="button" variant="outline" onClick={onClose} disabled={importing}>
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmImport} 
                disabled={importing || summary.selectedCount === 0}
                className="ofx-confirm-btn"
              >
                {importing ? (
                  <>
                    <RefreshCw className="spin" size={16} /> Importando Lançamentos...
                  </>
                ) : (
                  <>
                    <Check size={16} /> Confirmar Importação ({summary.selectedCount} {summary.selectedCount === 1 ? 'item' : 'itens'})
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
