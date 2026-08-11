import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Trash2, Edit2, ShieldCheck, Download, 
  HelpCircle, Calculator, HeartPulse, GraduationCap, Shield, Users, 
  Search, CheckCircle2, AlertTriangle, ArrowRight, DollarSign, ExternalLink
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { TaxDocumentModal, type TaxDocument } from './components/TaxDocumentModal';
import toast from 'react-hot-toast';

const CATEGORY_LABELS: Record<string, { name: string; color: string; icon: any }> = {
  saude: { name: 'Saúde / Médico', color: '#EF4444', icon: HeartPulse },
  educacao: { name: 'Instrução / Educação', color: '#3B82F6', icon: GraduationCap },
  pgbl: { name: 'Previdência PGBL', color: '#8B5CF6', icon: Shield },
  dependente: { name: 'Dependente / Pensão', color: '#F59E0B', icon: Users },
  outros: { name: 'Outros Comprovantes', color: '#64748B', icon: FileText },
};

// Initial sample data if user has no documents yet
const INITIAL_SAMPLE_DOCS: TaxDocument[] = [
  {
    id: 'sample-1',
    title: 'Consulta Médica Dermatologia',
    category: 'saude',
    amount: 450.00,
    provider_name: 'Clínica Dermatológica Dra. Marina',
    document_date: '2026-03-15',
    notes: 'Recibo médico emitido com CPF para declaração anual',
    file_url: 'https://storage.supabase.co/simulated_receipt.pdf'
  },
  {
    id: 'sample-2',
    title: 'Mensalidade Pós-Graduação',
    category: 'educacao',
    amount: 1200.00,
    provider_name: 'Instituto de Finanças & Gestão',
    document_date: '2026-04-10',
    notes: 'Mensalidade do curso de especialização',
    file_url: 'https://storage.supabase.co/simulated_receipt.pdf'
  },
  {
    id: 'sample-3',
    title: 'Aporte Previdência Privada PGBL',
    category: 'pgbl',
    amount: 5000.00,
    provider_name: 'AFIC Prev Seguradora',
    document_date: '2026-05-20',
    notes: 'Aporte de 12% para abatimento na declaração completa',
    file_url: 'https://storage.supabase.co/simulated_receipt.pdf'
  }
];

export const IncomeTaxDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'vault' | 'guide' | 'pgbl'>('vault');
  const [documents, setDocuments] = useState<TaxDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<TaxDocument | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Income for PGBL tax estimation
  const [annualIncome, setAnnualIncome] = useState<number>(120000); // R$ 120k / ano por padrão

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tax_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('document_date', { ascending: false });

      if (!error && data && data.length > 0) {
        setDocuments(data);
      } else {
        // Fallback to local storage or initial sample docs
        const local = localStorage.getItem(`afic_tax_docs_${user.id}`);
        if (local) {
          setDocuments(JSON.parse(local));
        } else {
          setDocuments(INITIAL_SAMPLE_DOCS);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar recibos do IR:', err);
      setDocuments(INITIAL_SAMPLE_DOCS);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDocument = async (docData: Partial<TaxDocument>) => {
    if (!user) return;

    try {
      if (docData.id && !docData.id.startsWith('sample-')) {
        // Update Supabase
        const { error } = await supabase
          .from('tax_documents')
          .update({
            title: docData.title,
            category: docData.category,
            amount: docData.amount,
            provider_name: docData.provider_name,
            document_date: docData.document_date,
            notes: docData.notes,
            file_url: docData.file_url
          })
          .eq('id', docData.id);

        if (error) throw error;
      } else {
        // Insert Supabase
        const { data, error } = await supabase
          .from('tax_documents')
          .insert({
            user_id: user.id,
            title: docData.title,
            category: docData.category,
            amount: docData.amount,
            provider_name: docData.provider_name,
            document_date: docData.document_date,
            notes: docData.notes,
            file_url: docData.file_url
          })
          .select()
          .single();

        if (error) {
          // LocalStorage fallback
          const newDoc: TaxDocument = {
            id: `doc-${Date.now()}`,
            user_id: user.id,
            title: docData.title || '',
            category: docData.category || 'saude',
            amount: docData.amount || 0,
            provider_name: docData.provider_name,
            document_date: docData.document_date,
            notes: docData.notes,
            file_url: docData.file_url
          };
          const updated = [newDoc, ...documents];
          setDocuments(updated);
          localStorage.setItem(`afic_tax_docs_${user.id}`, JSON.stringify(updated));
          toast.success('Comprovante salvo com sucesso!');
          return;
        }
      }

      toast.success('Comprovante registrado com sucesso!');
      fetchDocuments();
    } catch (err) {
      console.error('Erro ao salvar no banco:', err);
      // Local fallback
      const updated = documents.map(d => d.id === docData.id ? { ...d, ...docData } as TaxDocument : d);
      if (!docData.id) {
        const newDoc: TaxDocument = {
          id: `doc-${Date.now()}`,
          user_id: user.id,
          title: docData.title || '',
          category: docData.category || 'saude',
          amount: docData.amount || 0,
          provider_name: docData.provider_name,
          document_date: docData.document_date,
          notes: docData.notes,
          file_url: docData.file_url
        };
        updated.unshift(newDoc);
      }
      setDocuments(updated);
      localStorage.setItem(`afic_tax_docs_${user.id}`, JSON.stringify(updated));
      toast.success('Comprovante salvo no armazenamento local!');
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!user) return;

    try {
      if (!id.startsWith('sample-')) {
        await supabase.from('tax_documents').delete().eq('id', id);
      }
      const updated = documents.filter(d => d.id !== id);
      setDocuments(updated);
      localStorage.setItem(`afic_tax_docs_${user.id}`, JSON.stringify(updated));
      toast.success('Comprovante removido.');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir comprovante.');
    }
  };

  const handleExportCSV = () => {
    if (documents.length === 0) {
      toast.error('Nenhum comprovante para exportar.');
      return;
    }

    const headers = 'Título,Categoria,Valor (R$),Prestador,Data,Observações\n';
    const rows = documents.map(d => 
      `"${d.title}","${CATEGORY_LABELS[d.category]?.name || d.category}","${d.amount}","${d.provider_name || ''}","${d.document_date || ''}","${d.notes || ''}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Deducoes_IRPF_AFIC_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Relatório exportado para seu contador!');
  };

  // Computations
  const totalDeductions = documents.reduce((sum, d) => sum + (d.amount || 0), 0);
  
  // Tax bracket estimation (assume 27.5% marginal tax bracket for high-yield estimation)
  const estimatedTaxSavings = totalDeductions * 0.275;

  const filteredDocs = documents.filter(d => {
    const matchesCategory = selectedCategory === 'todos' || d.category === selectedCategory;
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (d.provider_name && d.provider_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem 6rem' }}>
      
      {/* Header Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.2))', 
        borderRadius: 'var(--r-lg)', 
        padding: '2rem', 
        border: '1px solid rgba(16, 185, 129, 0.3)',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <span className="afic-badge afic-badge--success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <ShieldCheck size={16} /> PLANEJAMENTO TRIBUTÁRIO & IRPF
            </span>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: 1.2 }}>
              Imposto de Renda & <span className="gradient-text">Cofre de Deduções</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, maxWidth: '650px' }}>
              Organize seus comprovantes dedutíveis ao longo do ano e aprenda a otimizar sua declaração para reduzir o imposto devido e aumentar sua restituição legalmente.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download size={18} /> Exportar Relatório
            </Button>
            <Button variant="primary" onClick={() => { setEditingDoc(null); setIsModalOpen(true); }}>
              <Plus size={18} /> Novo Recibo
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Deduções Acumuladas</span>
            <FileText size={20} color="var(--brand-primary)" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            {totalDeductions.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {documents.length} comprovantes cadastrados no ano
          </p>
        </Card>

        <Card style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.05))', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 700 }}>Economia Estimada no IRPF</span>
            <DollarSign size={20} color="var(--success)" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--success)' }}>
            + {estimatedTaxSavings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Estimativa de restituição/abatimento (alíquota 27.5%)
          </p>
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Limite PGBL Sugerido (12%)</span>
            <Shield size={20} color="#8B5CF6" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#8B5CF6' }}>
            {(annualIncome * 0.12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Para renda bruta de {annualIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/ano
          </p>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('vault')}
          className={`afic-tab-btn ${activeTab === 'vault' ? 'afic-tab-btn--active' : ''}`}
          style={{
            padding: '0.625rem 1.25rem',
            borderRadius: 'var(--r-md)',
            fontWeight: 700,
            fontSize: '0.9rem',
            border: 'none',
            background: activeTab === 'vault' ? 'var(--brand-primary)' : 'transparent',
            color: activeTab === 'vault' ? '#fff' : 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          📄 Cofre de Recibos & Deduções
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`afic-tab-btn ${activeTab === 'guide' ? 'afic-tab-btn--active' : ''}`}
          style={{
            padding: '0.625rem 1.25rem',
            borderRadius: 'var(--r-md)',
            fontWeight: 700,
            fontSize: '0.9rem',
            border: 'none',
            background: activeTab === 'guide' ? 'var(--brand-primary)' : 'transparent',
            color: activeTab === 'guide' ? '#fff' : 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          💡 Guia do IRPF & Tabela 2026
        </button>

        <button
          onClick={() => setActiveTab('pgbl')}
          className={`afic-tab-btn ${activeTab === 'pgbl' ? 'afic-tab-btn--active' : ''}`}
          style={{
            padding: '0.625rem 1.25rem',
            borderRadius: 'var(--r-md)',
            fontWeight: 700,
            fontSize: '0.9rem',
            border: 'none',
            background: activeTab === 'pgbl' ? 'var(--brand-primary)' : 'transparent',
            color: activeTab === 'pgbl' ? '#fff' : 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          🧮 Simulador PGBL (Abatimento)
        </button>
      </div>

      {/* TAB 1: Cofre de Recibos & Deduções */}
      {activeTab === 'vault' && (
        <div>
          {/* Filters Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', maxWidth: '100%' }}>
              <button
                onClick={() => setSelectedCategory('todos')}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.8rem',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border-color)',
                  background: selectedCategory === 'todos' ? 'var(--brand-primary)' : 'var(--bg-card)',
                  color: selectedCategory === 'todos' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Todos ({documents.length})
              </button>
              {Object.entries(CATEGORY_LABELS).map(([key, cat]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.8rem',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border-color)',
                    background: selectedCategory === key ? 'var(--brand-primary)' : 'var(--bg-card)',
                    color: selectedCategory === key ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', minWidth: '220px' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Buscar recibo ou empresa..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="afic-input"
                style={{ paddingLeft: '2.5rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* List of Documents */}
          {filteredDocs.length === 0 ? (
            <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FileText size={40} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Nenhum recibo encontrado</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Clique no botão "Novo Recibo" acima para registrar comprovantes médicos, de estudo ou previdência.
              </p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredDocs.map(doc => {
                const categoryInfo = CATEGORY_LABELS[doc.category] || CATEGORY_LABELS.outros;
                const IconComponent = categoryInfo.icon;

                return (
                  <Card key={doc.id} style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ padding: '0.75rem', borderRadius: 'var(--r-md)', background: `${categoryInfo.color}15`, color: categoryInfo.color }}>
                        <IconComponent size={24} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span className="afic-badge" style={{ background: `${categoryInfo.color}20`, color: categoryInfo.color, fontSize: '0.7rem', textTransform: 'uppercase' }}>
                            {categoryInfo.name}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {doc.document_date ? new Date(doc.document_date).toLocaleDateString('pt-BR') : ''}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                          {doc.title}
                        </h4>
                        {doc.provider_name && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                            Prestador: {doc.provider_name}
                          </p>
                        )}
                        {doc.notes && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: '0.2rem 0 0' }}>
                            "{doc.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Valor Dedutível</span>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {doc.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </h3>
                        <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600 }}>
                          Economia ~{(doc.amount * 0.275).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {doc.file_url && (
                          <button 
                            onClick={() => {
                              const isOldBrokenMock = doc.file_url?.includes('simulated_receipt.pdf');
                              if (isOldBrokenMock) {
                                window.open('https://placehold.co/600x800/2a2a2a/ffffff.png?text=Comprovante+Fiscal+Simulado', '_blank');
                              } else {
                                window.open(doc.file_url, '_blank');
                              }
                            }}
                            style={{ padding: '0.5rem', borderRadius: 'var(--r-md)', background: 'var(--bg-input)', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Ver Anexo"
                          >
                            <ExternalLink size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => { setEditingDoc(doc); setIsModalOpen(true); }}
                          style={{ padding: '0.5rem', borderRadius: 'var(--r-md)', background: 'var(--bg-input)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => doc.id && handleDeleteDocument(doc.id)}
                          style={{ padding: '0.5rem', borderRadius: 'var(--r-md)', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Guia do IRPF & Tabela Progressiva */}
      {activeTab === 'guide' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* O que é o IRPF & Quem deve declarar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <Card style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HelpCircle size={20} color="var(--brand-primary)" /> O que é o IRPF?
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                O Imposto de Renda Pessoa Física é um tributo federal cobrado anualmente sobre os ganhos e rendimentos obtidos ao longo do ano anterior. Ele financia serviços públicos de saúde, educação e infraestrutura no Brasil.
              </p>
            </Card>

            <Card style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} color="var(--warning)" /> Quem é Obrigado a Declarar?
              </h3>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                <li>Rendimentos tributáveis (salário, aluguéis) acima de R$ 30.639,90 no ano</li>
                <li>Rendimentos isentos ou tributados na fonte acima de R$ 200.000,00</li>
                <li>Operações em bolsa de valores (ações/FIIs) com vendas acima de R$ 40.000,00 ou ganho líquido sujeito a imposto</li>
                <li>Posse de bens ou direitos com valor total superior a R$ 800.000,00</li>
              </ul>
            </Card>
          </div>

          {/* Tabela Progressiva Mensal / Anual */}
          <Card style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              📊 Tabela Progressiva de Alíquotas do IRPF (Vigente)
            </h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-input)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)' }}>Base de Cálculo Mensal (R$)</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)' }}>Alíquota %</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)' }}>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Até R$ 5.000,00</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--success)', fontWeight: 700 }}>Isento (0%)</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>Nova regra de isenção</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>De R$ 5.000,01 até R$ 7.350,00</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>7,5% a 22,5%</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Desconto Progressivo</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Acima de R$ 7.350,00</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--danger)' }}>27,5%</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Tabela Convencional</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Guia Prático das Deduções */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              💡 Quais Despesas Você Pode Abater Legalmente?
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
              <Card style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EF4444', fontWeight: 700, marginBottom: '0.5rem' }}>
                  <HeartPulse size={20} /> Saúde (Sem Limite Teto)
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Consultas médicas, dentistas, exames de laboratório, fisioterapia, psicólogos, seguro/plano de saúde e internações hospitalares. <strong>Não há limite teto de valor.</strong>
                </p>
              </Card>

              <Card style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3B82F6', fontWeight: 700, marginBottom: '0.5rem' }}>
                  <GraduationCap size={20} /> Educação (Instrução)
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Escola de ensino infantil, fundamental, médio, faculdade, pós-graduação e curso técnico. <em>Cursos livres de idiomas e cursinhos preparatórios não são dedutíveis.</em>
                </p>
              </Card>

              <Card style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8B5CF6', fontWeight: 700, marginBottom: '0.5rem' }}>
                  <Shield size={20} /> Previdência PGBL (12%)
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Quem faz a declaração Completa pode deduzir até 12% da sua Renda Bruta Tributável Anual aportando em um plano de previdência do tipo PGBL.
                </p>
              </Card>

              <Card style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#F59E0B', fontWeight: 700, marginBottom: '0.5rem' }}>
                  <Users size={20} /> Dependentes & Pensão
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Abatimento fixo anual por dependente legal (filhos até 21 ou 24 anos se universitários, cônjuge) e despesas de pensão alimentícia judicial.
                </p>
              </Card>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: Simulador PGBL */}
      {activeTab === 'pgbl' && (
        <Card style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calculator size={22} color="var(--brand-primary)" /> Simulador de Abatimento PGBL (Estratégia 12%)
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            O PGBL é a ferramenta fiscal mais poderosa do Brasil para quem faz a declaração completa do IRPF. Veja quanto você pode economizar de imposto este ano:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <label className="afic-label">Sua Renda Bruta Tributável Anual (R$)</label>
              <input 
                type="number"
                className="afic-input"
                value={annualIncome}
                onChange={e => setAnnualIncome(parseFloat(e.target.value) || 0)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Equivalente a {(annualIncome / 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
              </span>
            </div>

            <div style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--r-md)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Aporte Ideal PGBL (12%)</span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#8B5CF6', margin: '0.25rem 0' }}>
                {(annualIncome * 0.12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Máximo dedutível na declaração completa
              </span>
            </div>

            <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--r-md)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 700 }}>Dinheiro de Volta no Bolso</span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--success)', margin: '0.25rem 0' }}>
                + {(annualIncome * 0.12 * 0.275).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Imposto não pago ou restituído pela Receita Federal
              </span>
            </div>
          </div>

          <div style={{ padding: '1.25rem', background: 'var(--bg-input)', borderRadius: 'var(--r-md)', borderLeft: '4px solid var(--brand-primary)' }}>
            <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Dica do Consultor AFIC</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Ao aportar no PGBL até o último dia útil de dezembro, você reduz sua base de cálculo no imposto de renda e recebe essa economia na restituição do ano seguinte. Fale com seu consultor para estruturar seu aporte!
            </p>
          </div>
        </Card>
      )}

      {/* Tax Document Modal */}
      <TaxDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveDocument}
        editingDoc={editingDoc}
      />
    </div>
  );
};
