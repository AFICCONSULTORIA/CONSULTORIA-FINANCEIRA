import React, { useState, useEffect } from 'react';
import { 
  Lock, Shield, TrendingUp, PieChart, Star, Plus, Edit2, Trash2, 
  CheckCircle, AlertTriangle, ExternalLink, RefreshCw, X, Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

export interface RecommendedAsset {
  id: string;
  ticker: string;
  name: string;
  category: 'Ações' | 'FIIs' | 'Renda Fixa' | 'Internacional' | 'Cripto';
  targetWeight: number; // e.g. 15%
  maxPrice: number; // Preço Teto R$
  riskLevel: 'Baixo' | 'Médio' | 'Alto';
  status: 'Comprar' | 'Manter' | 'Aguardar';
  thesis: string;
}

const INITIAL_RECOMMENDED_ASSETS: RecommendedAsset[] = [
  {
    id: '1',
    ticker: 'VALE3',
    name: 'Vale S.A.',
    category: 'Ações',
    targetWeight: 10,
    maxPrice: 72.50,
    riskLevel: 'Médio',
    status: 'Comprar',
    thesis: 'Líder global em minério de ferro, forte pagamento de dividendos e valuation atrativo.'
  },
  {
    id: '2',
    ticker: 'ITUB4',
    name: 'Itaú Unibanco',
    category: 'Ações',
    targetWeight: 12,
    maxPrice: 38.00,
    riskLevel: 'Baixo',
    status: 'Comprar',
    thesis: 'Banco mais eficiente do Brasil, rentabilidade sólida (ROE > 20%) e resiliência macro.'
  },
  {
    id: '3',
    ticker: 'HGLG11',
    name: 'CSHG Logística',
    category: 'FIIs',
    targetWeight: 15,
    maxPrice: 168.00,
    riskLevel: 'Baixo',
    status: 'Comprar',
    thesis: 'Fundo imobiliário logístico premium com inquilinos de alto padrão e histórico exemplar.'
  },
  {
    id: '4',
    ticker: 'KNCR11',
    name: 'Kinea Rendimento Imobiliário',
    category: 'FIIs',
    targetWeight: 15,
    maxPrice: 105.00,
    riskLevel: 'Baixo',
    status: 'Comprar',
    thesis: 'Fundo de papel indexado ao CDI, excelente para geração de renda com proteção de capital.'
  },
  {
    id: '5',
    ticker: 'TESOURO IPCA+ 2035',
    name: 'Tesouro IPCA+ com Juros Semestrais',
    category: 'Renda Fixa',
    targetWeight: 25,
    maxPrice: 0,
    riskLevel: 'Baixo',
    status: 'Comprar',
    thesis: 'Proteção real contra inflação a longo prazo com rendimento garantido pelo Tesouro Nacional.'
  },
  {
    id: '6',
    ticker: 'IVVB11',
    name: 'iShares S&P 500 ETF',
    category: 'Internacional',
    targetWeight: 15,
    maxPrice: 310.00,
    riskLevel: 'Médio',
    status: 'Comprar',
    thesis: 'Dolarização de patrimônio e exposição às 500 maiores empresas do mercado americano.'
  },
  {
    id: '7',
    ticker: 'CDB 110% CDI',
    name: 'CDB Liquidez Diária',
    category: 'Renda Fixa',
    targetWeight: 8,
    maxPrice: 0,
    riskLevel: 'Baixo',
    status: 'Comprar',
    thesis: 'Reserva de oportunidade e liquidez para rebalanceamento estratégico.'
  }
];

export const RecommendedPortfolio: React.FC = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loadingRole, setLoadingRole] = useState(true);
  
  const [assets, setAssets] = useState<RecommendedAsset[]>(INITIAL_RECOMMENDED_ASSETS);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Modal State for Admin CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<RecommendedAsset | null>(null);

  // Form State
  const [formTicker, setFormTicker] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<RecommendedAsset['category']>('Ações');
  const [formWeight, setFormWeight] = useState('');
  const [formMaxPrice, setFormMaxPrice] = useState('');
  const [formRisk, setFormRisk] = useState<RecommendedAsset['riskLevel']>('Médio');
  const [formStatus, setFormStatus] = useState<RecommendedAsset['status']>('Comprar');
  const [formThesis, setFormThesis] = useState('');

  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setLoadingRole(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (data?.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Erro ao verificar permissão:', err);
      } finally {
        setLoadingRole(false);
      }
    };

    checkRole();
  }, [user]);

  // Open modal create
  const handleOpenCreate = () => {
    setEditingAsset(null);
    setFormTicker('');
    setFormName('');
    setFormCategory('Ações');
    setFormWeight('10');
    setFormMaxPrice('50.00');
    setFormRisk('Médio');
    setFormStatus('Comprar');
    setFormThesis('');
    setIsModalOpen(true);
  };

  // Open modal edit
  const handleOpenEdit = (asset: RecommendedAsset) => {
    setEditingAsset(asset);
    setFormTicker(asset.ticker);
    setFormName(asset.name);
    setFormCategory(asset.category);
    setFormWeight(String(asset.targetWeight));
    setFormMaxPrice(String(asset.maxPrice));
    setFormRisk(asset.riskLevel);
    setFormStatus(asset.status);
    setFormThesis(asset.thesis);
    setIsModalOpen(true);
  };

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTicker.trim() || !formName.trim()) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    const newAsset: RecommendedAsset = {
      id: editingAsset ? editingAsset.id : Date.now().toString(),
      ticker: formTicker.trim().toUpperCase(),
      name: formName.trim(),
      category: formCategory,
      targetWeight: parseFloat(formWeight) || 0,
      maxPrice: parseFloat(formMaxPrice) || 0,
      riskLevel: formRisk,
      status: formStatus,
      thesis: formThesis.trim()
    };

    if (editingAsset) {
      setAssets(prev => prev.map(a => a.id === editingAsset.id ? newAsset : a));
      toast.success('Ativo recomendado atualizado!');
    } else {
      setAssets(prev => [newAsset, ...prev]);
      toast.success('Novo ativo recomendado adicionado!');
    }

    setIsModalOpen(false);
  };

  const handleDeleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    toast.success('Ativo removido da carteira.');
  };

  const filteredAssets = selectedCategory === 'Todos' 
    ? assets 
    : assets.filter(a => a.category === selectedCategory);

  // Totais por Categoria
  const totalWeight = assets.reduce((acc, a) => acc + a.targetWeight, 0);

  if (loadingRole) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw className="anim-spin" size={24} style={{ marginBottom: '0.5rem' }} />
        <p>Verificando permissões de acesso...</p>
      </div>
    );
  }

  // 🔒 VISÃO BLOQUEADA PARA CLIENTES (NÃO ADMIN)
  if (!isAdmin) {
    return (
      <div className="anim-fade-up" style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Banner VIP de Bloqueio */}
        <Card style={{ 
          padding: '3rem 2rem', 
          textAlign: 'center', 
          position: 'relative', 
          overflow: 'hidden',
          border: '1px solid var(--border-brand)',
          background: 'linear-gradient(145deg, rgba(234, 179, 8, 0.06) 0%, rgba(10, 10, 12, 0.95) 100%)',
          boxShadow: 'var(--shadow-brand)'
        }}>
          {/* Badge VIP Top */}
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            background: 'rgba(234, 179, 8, 0.15)', 
            border: '1px solid var(--brand-primary)',
            color: 'var(--brand-primary)',
            padding: '0.375rem 1rem',
            borderRadius: 'var(--r-full)',
            fontSize: '0.8125rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '1.5rem'
          }}>
            <Lock size={14} /> Recurso Exclusivo VIP
          </div>

          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
            border: '1px solid var(--border-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
            boxShadow: '0 0 30px rgba(234, 179, 8, 0.25)'
          }}>
            <Shield size={40} color="var(--brand-primary)" />
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            Carteira Recomendada AFIC
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
            Acesso restrito à alocação estratégica de ativos (Ações, FIIs, Renda Fixa e Internacional) selecionados pela nossa equipe de consultoria financeira.
          </p>

          {/* Blur Teaser de Alocação Estratégica */}
          <div style={{ 
            background: 'var(--bg-surface)', 
            borderRadius: 'var(--r-xl)', 
            padding: '1.5rem', 
            border: '1px solid var(--border-color)',
            marginBottom: '2rem',
            filter: 'blur(0.5px)',
            opacity: 0.85
          }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>
              Prévia de Distribuição Recomendada
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--r-lg)', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--brand-primary)', fontWeight: 800, fontSize: '1.25rem' }}>33%</span>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Renda Fixa (CDI/IPCA)</p>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--r-lg)', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--brand-primary)', fontWeight: 800, fontSize: '1.25rem' }}>30%</span>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>FIIs (Tijolo / Papel)</p>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--r-lg)', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--brand-primary)', fontWeight: 800, fontSize: '1.25rem' }}>22%</span>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Ações Brasileiras</p>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--r-lg)', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--brand-primary)', fontWeight: 800, fontSize: '1.25rem' }}>15%</span>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Internacional (Dólar)</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Button 
              onClick={() => toast('Fale com seu consultor para solicitar a liberação do seu plano VIP!')}
              style={{ background: 'var(--grad-brand)', color: 'var(--text-on-primary)', fontWeight: 800, padding: '0.875rem 2rem' }}
            >
              Solicitar Liberação de Acesso <ExternalLink size={16} style={{ marginLeft: '0.5rem' }} />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 🟢 VISÃO DE PAINEL COMPLETO PARA ADMIN
  return (
    <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Header Admin */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              Gestão da Carteira Recomendada
            </h1>
            <span style={{ 
              background: 'rgba(234, 179, 8, 0.15)', 
              border: '1px solid var(--brand-primary)', 
              color: 'var(--brand-primary)', 
              padding: '0.2rem 0.6rem', 
              borderRadius: 'var(--r-full)',
              fontSize: '0.75rem',
              fontWeight: 800 
            }}>
              PAINEL ADMIN
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
            Defina a alocação alvo, preço teto e teses de investimento recomendadas para a consultoria.
          </p>
        </div>

        <Button onClick={handleOpenCreate}>
          <Plus size={18} /> Adicionar Ativo Recomendado
        </Button>
      </div>

      {/* Cards de Resumo da Alocação Alvo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <Card style={{ padding: '1.25rem', borderLeft: '4px solid var(--brand-primary)' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Recomendado (Peso)
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {totalWeight}%
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Soma das porcentagens dos ativos recomendados
          </p>
        </Card>

        <Card style={{ padding: '1.25rem', borderLeft: '4px solid var(--success)' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total de Ativos
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {assets.length} Ativos
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Ações, FIIs, Renda Fixa e Internacional
          </p>
        </Card>
      </div>

      {/* Filtros de Categoria */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: 'var(--r-xl)', border: '1px solid var(--border-color)' }}>
        {['Todos', 'Ações', 'FIIs', 'Renda Fixa', 'Internacional', 'Cripto'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`tx-chip ${selectedCategory === cat ? 'tx-chip--active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tabela de Ativos Recomendados */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filteredAssets.map(asset => (
          <Card key={asset.id} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ 
                    fontFamily: 'var(--font-display)', 
                    fontSize: '1.25rem', 
                    fontWeight: 900, 
                    color: 'var(--brand-primary-light)' 
                  }}>
                    {asset.ticker}
                  </span>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {asset.name}
                  </span>
                  <span style={{ 
                    background: 'var(--bg-input)', 
                    padding: '0.2rem 0.6rem', 
                    borderRadius: 'var(--r-full)', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: 'var(--text-secondary)' 
                  }}>
                    {asset.category}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Peso Alvo</span>
                  <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                    {asset.targetWeight}%
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Preço Teto</span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {asset.maxPrice > 0 ? asset.maxPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'N/A'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <button 
                    onClick={() => handleOpenEdit(asset)}
                    className="tx-action-btn"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteAsset(asset.id)}
                    className="tx-action-btn tx-action-btn--delete"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Tese de Investimento */}
            {asset.thesis && (
              <div style={{ 
                background: 'var(--bg-input)', 
                padding: '0.75rem 1rem', 
                borderRadius: 'var(--r-md)', 
                borderLeft: '3px solid var(--brand-primary)',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem'
              }}>
                <Info size={16} color="var(--brand-primary)" style={{ marginTop: '0.125rem', flexShrink: 0 }} />
                <span><strong>Tese:</strong> {asset.thesis}</span>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Modal Admin Create/Edit Asset */}
      {isModalOpen && (
        <div className="tx-modal-overlay">
          <div className="tx-modal anim-fade-up" style={{ maxWidth: '550px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {editingAsset ? 'Editar Ativo Recomendado' : 'Novo Ativo Recomendado'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="afic-grid-2">
                <div>
                  <label className="afic-label">Ticker (Código) *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex: VALE3, HGLG11..."
                    value={formTicker}
                    onChange={e => setFormTicker(e.target.value)}
                    className="tx-search-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label className="afic-label">Categoria *</label>
                  <select 
                    value={formCategory}
                    onChange={(e: any) => setFormCategory(e.target.value)}
                    className="tx-search-input"
                    style={{ width: '100%' }}
                  >
                    <option value="Ações">Ações</option>
                    <option value="FIIs">FIIs</option>
                    <option value="Renda Fixa">Renda Fixa</option>
                    <option value="Internacional">Internacional</option>
                    <option value="Cripto">Cripto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="afic-label">Nome do Ativo / Descrição *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Itaú Unibanco, Tesouro IPCA+..."
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="tx-search-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="afic-grid-2">
                <div>
                  <label className="afic-label">Peso Alvo (%) *</label>
                  <input 
                    type="number"
                    step="0.5"
                    required
                    placeholder="10"
                    value={formWeight}
                    onChange={e => setFormWeight(e.target.value)}
                    className="tx-search-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label className="afic-label">Preço Teto (R$)</label>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="0.00 se N/A"
                    value={formMaxPrice}
                    onChange={e => setFormMaxPrice(e.target.value)}
                    className="tx-search-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label className="afic-label">Tese de Investimento</label>
                <textarea 
                  rows={3}
                  placeholder="Explique os motivos dessa recomendação para os clientes..."
                  value={formThesis}
                  onChange={e => setFormThesis(e.target.value)}
                  className="tx-search-input"
                  style={{ width: '100%', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} style={{ flex: 1 }}>
                  Cancelar
                </Button>
                <Button type="submit" style={{ flex: 2 }}>
                  {editingAsset ? 'Salvar Alterações' : 'Adicionar Ativo'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
