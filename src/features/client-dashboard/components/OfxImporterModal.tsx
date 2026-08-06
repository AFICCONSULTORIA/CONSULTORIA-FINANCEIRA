import React, { useState, useRef } from 'react';
import { Upload, X, Check, FileText, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { parseOfx, type ParsedOfxTransaction } from '../../../utils/ofxParser';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';

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
  const [parsedItems, setParsedItems] = useState<ParsedOfxTransaction[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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
        const text = e.target?.result as string;
        const result = parseOfx(text);
        if (result.length === 0) {
          toast.error('Nenhum lançamento válido foi encontrado neste arquivo OFX.');
          setParsedItems([]);
        } else {
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
      toast.error('Erro ao ler o arquivo.');
      setLoading(false);
    };

    // Read with UTF-8 as standard, which correctly parses accents for most modern banks (Nubank, Inter, etc.)
    reader.readAsText(file, 'UTF-8');
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

  const handleToggleSelectAll = (checked: boolean) => {
    setParsedItems(prev => prev.map(item => ({ ...item, selected: checked })));
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

  const selectedCount = parsedItems.filter(i => i.selected).length;

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
        description: item.description,
        amount: item.amount,
        category: item.category || 'Outros',
        payment_method: item.paymentMethod || 'Extrato Bancário',
        status: 'completed',
        date: item.date,
        notes: ''
      }));

      const { error } = await supabase.from('transactions').insert(payloads);

      if (error) throw error;

      toast.success(`${payloads.length} lançamentos importados com sucesso!`);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="tx-modal-overlay">
      <div className="tx-modal anim-fade-up ofx-importer-modal">
        {/* Header */}
        <div className="ofx-importer-modal__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div className="ofx-importer-modal__icon">
              <FileText size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Importar Extrato OFX
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Importe lançamentos bancários automaticamente baixados do seu banco
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

        {/* Body */}
        {parsedItems.length === 0 ? (
          /* Step 1: Upload Zone */
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
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.75rem', color: 'var(--text-primary)' }}>
                {loading ? 'Processando Extrato...' : 'Selecione ou arraste seu arquivo .OFX'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Suporta extratos bancários de qualquer banco brasileiro (Itaú, Bradesco, Santander, Nubank, Banco do Brasil, Inter, etc.)
              </p>
              <Button type="button" variant="outline" style={{ marginTop: '1.25rem' }}>
                <Upload size={16} /> Procurar arquivo .ofx
              </Button>
            </div>
          </div>
        ) : (
          /* Step 2: Preview & Select */
          <div className="ofx-preview-step">
            <div className="ofx-file-info-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="var(--brand-primary)" />
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{fileName}</span>
                <span className="tx-chip">{parsedItems.length} itens encontrados</span>
              </div>
              <button
                type="button"
                className="tx-date-btn"
                onClick={handleResetFile}
                title="Trocar arquivo"
                style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RefreshCw size={14} /> Escolher outro arquivo
              </button>
            </div>

            {/* Selection Summary Controls */}
            <div className="ofx-selection-bar">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={selectedCount === parsedItems.length}
                  onChange={(e) => handleToggleSelectAll(e.target.checked)}
                />
                Selecionar Todos ({selectedCount}/{parsedItems.length})
              </label>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Lançamentos pré-categorizados com base nas descrições do extrato.
              </div>
            </div>

            {/* Scrollable Table */}
            <div className="ofx-table-container">
              <table className="ofx-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>Data</th>
                    <th>Descrição no Extrato</th>
                    <th>Categoria</th>
                    <th style={{ textAlign: 'right' }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedItems.map((item) => (
                    <tr key={item.id} className={item.selected ? 'ofx-tr--selected' : 'ofx-tr--unselected'}>
                      <td>
                        <input
                          type="checkbox"
                          checked={!!item.selected}
                          onChange={() => handleToggleItem(item.id)}
                        />
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                        {new Date(item.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {item.description}
                        </div>
                        {item.paymentMethod === 'Cartão de Crédito' && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            <span>💳 Cartão de Crédito</span>
                          </div>
                        )}
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
                        <span style={{
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          color: item.type === 'income' ? 'var(--success)' : 'var(--danger)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {item.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {item.type === 'income' ? '+' : '-'} {item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <Button type="button" variant="outline" onClick={onClose} disabled={importing}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmImport} disabled={importing || selectedCount === 0}>
                {importing ? (
                  <>
                    <RefreshCw className="spin" size={16} /> Importando...
                  </>
                ) : (
                  <>
                    <Check size={16} /> Confirmar Importação de {selectedCount} {selectedCount === 1 ? 'Lançamento' : 'Lançamentos'}
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
