import React, { useState, useEffect } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabase';

export interface TaxDocument {
  id?: string;
  user_id?: string;
  title: string;
  category: 'saude' | 'educacao' | 'pgbl' | 'dependente' | 'outros';
  amount: number;
  provider_name?: string;
  document_date?: string;
  file_url?: string;
  notes?: string;
  created_at?: string;
}

interface TaxDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (doc: Partial<TaxDocument>) => Promise<void>;
  editingDoc?: TaxDocument | null;
}

export const TaxDocumentModal: React.FC<TaxDocumentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingDoc
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaxDocument['category']>('saude');
  const [amountStr, setAmountStr] = useState('');
  const [providerName, setProviderName] = useState('');
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingDoc) {
      setTitle(editingDoc.title || '');
      setCategory(editingDoc.category || 'saude');
      setAmountStr(editingDoc.amount ? editingDoc.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '');
      setProviderName(editingDoc.provider_name || '');
      setDocumentDate(editingDoc.document_date || new Date().toISOString().split('T')[0]);
      setNotes(editingDoc.notes || '');
      setFileName(editingDoc.file_url ? 'Comprovante_Anexado.pdf' : '');
    } else {
      setTitle('');
      setCategory('saude');
      setAmountStr('');
      setProviderName('');
      setDocumentDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setFile(null);
      setFileName('');
    }
  }, [editingDoc, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const numAmount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.')) || 0;
    if (numAmount <= 0) return;

    setSaving(true);
    try {
      let publicUrl = editingDoc?.file_url;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const newFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data: userData } = await supabase.auth.getUser();
        
        if (userData?.user) {
          const filePath = `${userData.user.id}/${newFileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('tax-documents')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Erro no upload do Storage:', uploadError);
            throw new Error('Falha ao enviar arquivo (Verifique se o bucket tax-documents existe e tem RLS configurado)');
          }

          const { data: urlData } = supabase.storage
            .from('tax-documents')
            .getPublicUrl(filePath);
            
          publicUrl = urlData.publicUrl;
        } else {
           // Fallback sem auth
           publicUrl = 'https://placehold.co/600x800/2a2a2a/ffffff.png?text=Comprovante+Fiscal+Simulado';
        }
      } else if (!editingDoc?.file_url && fileName) {
        // Se tinha um nome mas não tinha file, estava mockado
        publicUrl = 'https://placehold.co/600x800/2a2a2a/ffffff.png?text=Comprovante+Fiscal+Simulado';
      }

      await onSave({
        id: editingDoc?.id,
        title: title.trim(),
        category,
        amount: numAmount,
        provider_name: providerName.trim(),
        document_date: documentDate,
        notes: notes.trim(),
        file_url: publicUrl
      });
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar documento fiscal:', err);
      alert(err.message || 'Erro ao enviar o comprovante.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  return (
    <div className="tx-modal-overlay" style={{ zIndex: 1100 }}>
      <div className="tx-modal anim-fade-up" style={{ maxWidth: '560px', width: '95%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {editingDoc ? 'Editar Comprovante Fiscal' : 'Novo Comprovante / Recibo IRPF'}
          </h2>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="afic-label">Descrição do Comprovante *</label>
            <input 
              type="text" 
              className="afic-input"
              placeholder="Ex: Consulta Médica Dr. Carlos / Mensalidade Faculdade"
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="afic-label">Categoria Dedução *</label>
              <select 
                className="afic-input" 
                value={category} 
                onChange={e => setCategory(e.target.value as any)}
              >
                <option value="saude">🩺 Saúde / Médicos</option>
                <option value="educacao">🎓 Instrução / Educação</option>
                <option value="pgbl">🛡️ Previdência PGBL</option>
                <option value="dependente">👶 Dependente / Pensão</option>
                <option value="outros">📄 Outros Deduções</option>
              </select>
            </div>

            <div>
              <label className="afic-label">Valor do Recibo (R$) *</label>
              <input 
                type="text" 
                className="afic-input"
                placeholder="0,00"
                value={amountStr} 
                onChange={e => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (!value) {
                    setAmountStr('');
                    return;
                  }
                  const floatValue = parseInt(value, 10) / 100;
                  setAmountStr(floatValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                }} 
                required 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="afic-label">Prestador / Instituição (CNPJ/CPF)</label>
              <input 
                type="text" 
                className="afic-input"
                placeholder="Nome da clínica, hospital ou escola"
                value={providerName} 
                onChange={e => setProviderName(e.target.value)} 
              />
            </div>

            <div>
              <label className="afic-label">Data do Comprovante</label>
              <input 
                type="date" 
                className="afic-input"
                value={documentDate} 
                onChange={e => setDocumentDate(e.target.value)} 
              />
            </div>
          </div>

          <div>
            <label className="afic-label">Observações / Detalhes</label>
            <textarea 
              className="afic-input"
              rows={2}
              placeholder="Anotações para a declaração (ex: referente ao filho Lucas)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Attachment Box */}
          <div>
            <label className="afic-label">Comprovante Digital (PDF / Imagem)</label>
            <div style={{ 
              border: '2px dashed var(--border-color)', 
              borderRadius: 'var(--r-md)', 
              padding: '1rem', 
              textAlign: 'center',
              background: 'var(--bg-input)',
              cursor: 'pointer'
            }}>
              <input 
                type="file" 
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }} 
                id="file-upload-input"
              />
              <label htmlFor="file-upload-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                <Upload size={22} color="var(--brand-primary)" />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {fileName ? `✓ ${fileName}` : 'Clique para selecionar PDF ou Foto do Recibo'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Formatos aceitos: PDF, PNG, JPG (máx. 10MB)
                </span>
              </label>
            </div>
          </div>

          {/* Deductions Alert */}
          <div style={{ padding: '0.75rem', background: 'rgba(6, 182, 212, 0.1)', borderRadius: 'var(--r-md)', border: '1px solid rgba(6, 182, 212, 0.3)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <AlertCircle size={18} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Despesas médicas não têm limite teto de dedução. Despesas com instrução têm limite individual fixado pela Receita Federal.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Comprovante'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
