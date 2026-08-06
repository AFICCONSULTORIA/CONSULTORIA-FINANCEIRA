import React, { useState, useEffect } from 'react';
import { 
  Lock, Shield, Plus, Edit2, Trash2, 
  ExternalLink, RefreshCw, X, Search, 
  ChevronDown, ChevronUp, Award
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
  currentPrice: number;
  maxPrice: number;
  dy: number; // Dividend Yield %
  plPvP: string; // P/L ou P/VP (ex: "5.8x P/L")
  targetWeight: number; // Peso Alvo %
  riskLevel: 'Baixo' | 'Médio' | 'Alto';
  status: 'COMPRAR' | 'AGUARDAR' | 'MANTER';
  thesis: string;
  highlights?: string[];
}

const INITIAL_RECOMMENDED_ASSETS: RecommendedAsset[] = [
  {
    id: '1',
    ticker: 'VALE3',
    name: 'Vale S.A.',
    category: 'Ações',
    currentPrice: 61.20,
    maxPrice: 75.00,
    dy: 8.5,
    plPvP: '5.8x P/L',
    targetWeight: 10,
    riskLevel: 'Médio',
    status: 'COMPRAR',
    thesis: 'Líder mundial na produção de minério de ferro de alta pureza. Valuation extremamente atrativo com múltiplos historicamente baixos e alto fluxo de caixa livre.',
    highlights: ['Líder Global', 'Alto Dividend Yield', 'Geração de Caixa']
  },
  {
    id: '2',
    ticker: 'ITUB4',
    name: 'Itaú Unibanco',
    category: 'Ações',
    currentPrice: 32.40,
    maxPrice: 38.00,
    dy: 6.8,
    plPvP: '8.2x P/L',
    targetWeight: 12,
    riskLevel: 'Baixo',
    status: 'COMPRAR',
    thesis: 'Banco mais eficiente do Brasil. Apresenta ROE consistente acima de 20%, excelente gestão de inadimplência e forte previsibilidade de proventos.',
    highlights: ['ROE > 20%', 'Líder Financeiro', 'Baixo Risco']
  },
  {
    id: '3',
    ticker: 'HGLG11',
    name: 'CSHG Logística FII',
    category: 'FIIs',
    currentPrice: 161.50,
    maxPrice: 172.00,
    dy: 8.9,
    plPvP: '0.98x P/VP',
    targetWeight: 15,
    riskLevel: 'Baixo',
    status: 'COMPRAR',
    thesis: 'Fundo imobiliário logístico de alta qualidade com galpões bem localizados perto dos grandes centros de consumo e vacância mínima.',
    highlights: ['Galpões AAA', 'Vacância Baixa', 'Renda Mensal']
  },
  {
    id: '4',
    ticker: 'KNCR11',
    name: 'Kinea Rendimento Imobiliário',
    category: 'FIIs',
    currentPrice: 101.80,
    maxPrice: 106.00,
    dy: 12.1,
    plPvP: '1.01x P/VP',
    targetWeight: 15,
    riskLevel: 'Baixo',
    status: 'COMPRAR',
    thesis: 'Fundo de papel focado em CRIs atrelados ao CDI. Excelente veículo para fluxo de renda mensal com gestão Kinea de alta liquidez.',
    highlights: ['Indexado ao CDI', 'Gestão Kinea', 'Proteção de Capital']
  },
  {
    id: '5',
    ticker: 'TESOURO IPCA+ 2035',
    name: 'Tesouro Nacional IPCA+ 2035',
    category: 'Renda Fixa',
    currentPrice: 3120.00,
    maxPrice: 0,
    dy: 6.2,
    plPvP: 'IPCA + 6.2%',
    targetWeight: 25,
    riskLevel: 'Baixo',
    status: 'COMPRAR',
    thesis: 'Garante rendimento real acima da inflação com risco soberano. Ideal para acumulação de capital de médio/longo prazo.',
    highlights: ['Garantia Soberana', 'Ganho Real', 'Proteção Inflacionária']
  },
  {
    id: '6',
    ticker: 'IVVB11',
    name: 'iShares S&P 500 ETF',
    category: 'Internacional',
    currentPrice: 298.50,
    maxPrice: 320.00,
    dy: 1.4,
    plPvP: '22.4x P/L',
    targetWeight: 15,
    riskLevel: 'Médio',
    status: 'COMPRAR',
    thesis: 'Dolarização automática do patrimônio investindo nas 500 maiores empresas globais (Apple, Microsoft, Nvidia, Amazon).',
    highlights: ['Dolarizado', 'Top 500 EUA', 'Tecnologia Global']
  }
];

export const RecommendedPortfolio: React.FC = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loadingRole, setLoadingRole] = useState(true);
  
  const [assets, setAssets] = useState<RecommendedAsset[]>(INITIAL_RECOMMENDED_ASSETS);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);

  // Modal State for Admin CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<RecommendedAsset | null>(null);

  // Form State
  const [formTicker, setFormTicker] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<RecommendedAsset['category']>('Ações');
  const [formCurrentPrice, setFormCurrentPrice] = useState('');
  const [formMaxPrice, setFormMaxPrice] = useState('');
  const [formDy, setFormDy] = useState('');
  const [formPlPvP, setFormPlPvP] = useState('');
  const [formWeight, setFormWeight] = useState('');
  const [formRisk, setFormRisk] = useState<RecommendedAsset['riskLevel']>('Médio');
  const [formStatus, setFormStatus] = useState<RecommendedAsset['status']>('COMPRAR');
  const [formThesis, setFormThesis] = useState('');
  const [formHighlightsStr, setFormHighlightsStr] = useState('');

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
    setFormCurrentPrice('50.00');
    setFormMaxPrice('65.00');
    setFormDy('8.0');
    setFormPlPvP('6.5x P/L');
    setFormWeight('10');
    setFormRisk('Médio');
    setFormStatus('COMPRAR');
    setFormThesis('');
    setFormHighlightsStr('Líder do Setor, Bom Dividend Yield');
    setIsModalOpen(true);
  };

  // Open modal edit
  const handleOpenEdit = (asset: RecommendedAsset) => {
    setEditingAsset(asset);
    setFormTicker(asset.ticker);
    setFormName(asset.name);
    setFormCategory(asset.category);
    setFormCurrentPrice(String(asset.currentPrice));
    setFormMaxPrice(String(asset.maxPrice));
    setFormDy(String(asset.dy));
    setFormPlPvP(asset.plPvP);
    setFormWeight(String(asset.targetWeight));
    setFormRisk(asset.riskLevel);
    setFormStatus(asset.status);
    setFormThesis(asset.thesis);
    setFormHighlightsStr((asset.highlights || []).join(', '));
    setIsModalOpen(true);
  };

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTicker.trim() || !formName.trim()) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    const highlightsArr = formHighlightsStr
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const newAsset: RecommendedAsset = {
      id: editingAsset ? editingAsset.id : Date.now().toString(),
      ticker: formTicker.trim().toUpperCase(),
      name: formName.trim(),
      category: formCategory,
      currentPrice: parseFloat(formCurrentPrice) || 0,
      maxPrice: parseFloat(formMaxPrice) || 0,
      dy: parseFloat(formDy) || 0,
      plPvP: formPlPvP.trim() || 'N/A',
      targetWeight: parseFloat(formWeight) || 0,
      riskLevel: formRisk,
      status: formStatus,
      thesis: formThesis.trim(),
      highlights: highlightsArr
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

  const toggleExpand = (id: string) => {
    setExpandedAssetId(prev => prev === id ? null : id);
  };

  const filteredAssets = assets.filter(a => {
    const matchesCategory = selectedCategory === 'Todos' || a.category === selectedCategory;
    const matchesSearch = a.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
        <Card style={{ 
          padding: '3rem 2rem', 
          textAlign: 'center', 
          position: 'relative', 
          overflow: 'hidden',
          border: '1px solid var(--border-brand)',
          background: 'linear-gradient(145deg, rgba(234, 179, 8, 0.06) 0%, rgba(10, 10, 12, 0.95) 100%)',
          boxShadow: 'var(--shadow-brand)'
        }}>
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
            Acesso restrito à alocação estratégica de ativos (Ações, FIIs, Renda Fixa e Internacional) selecionados com inteligência fundamentalista no estilo Investidor 10.
          </p>

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

  // 🟢 PAINEL INVESTIDOR 10 STYLE (ADMIN)
  return (
    <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Admin */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              Carteira Recomendada (Estilo Investidor 10)
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
            Análise fundamentalista com múltiplos (DY, P/L, P/VP), Preço Teto, Margem de Segurança e Tese de Investimento.
          </p>
        </div>

        <Button onClick={handleOpenCreate}>
          <Plus size={18} /> Adicionar Ativo Recomendado
        </Button>
      </div>

      {/* Cards de Métricas Principais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <Card style={{ padding: '1.25rem', borderLeft: '4px solid var(--brand-primary)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Alocação Recomendada (Peso)
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {totalWeight}%
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Meta de alocação total
          </p>
        </Card>

        <Card style={{ padding: '1.25rem', borderLeft: '4px solid var(--success)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            DY Médio Estimado
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--success)', marginTop: '0.25rem' }}>
            8.9% a.a.
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Geração de proventos isentos
          </p>
        </Card>

        <Card style={{ padding: '1.25rem', borderLeft: '4px solid var(--info)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Total de Ativos Analisados
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {assets.length} Ativos
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Ações, FIIs, Renda Fixa e Internacional
          </p>
        </Card>
      </div>

      {/* Controles de Filtro e Busca Estilo Investidor 10 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '1rem', 
        background: 'var(--bg-card)', 
        padding: '1rem 1.25rem', 
        borderRadius: 'var(--r-xl)', 
        border: '1px solid var(--border-color)' 
      }}>
        {/* Chips de Categoria */}
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
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

        {/* Input de Busca */}
        <div style={{ position: 'relative', minWidth: '220px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text"
            placeholder="Buscar por ticker ou nome..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="tx-search-input"
            style={{ paddingLeft: '2.25rem', width: '100%' }}
          />
        </div>
      </div>

      {/* Tabela / Cards de Ativos Estilo Investidor 10 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {filteredAssets.map(asset => {
          const isExpanded = expandedAssetId === asset.id;
          
          // Cálculo da Margem de Segurança (%)
          const hasMaxPrice = asset.maxPrice > 0;
          const safetyMargin = hasMaxPrice 
            ? ((asset.maxPrice - asset.currentPrice) / asset.currentPrice) * 100 
            : 0;

          return (
            <Card 
              key={asset.id} 
              style={{ 
                padding: '1.25rem 1.5rem', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1rem',
                borderLeft: asset.status === 'COMPRAR' ? '4px solid var(--success)' : '4px solid var(--warning)',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Linha Principal do Ativo */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                
                {/* Ticker Avatar & Nome */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: 'var(--r-lg)', 
                    background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
                    border: '1px solid var(--border-brand)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 900,
                    fontSize: '0.9375rem',
                    color: 'var(--brand-primary-light)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    flexShrink: 0
                  }}>
                    {asset.ticker.slice(0, 4)}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                        {asset.ticker}
                      </span>
                      <span style={{ 
                        background: asset.status === 'COMPRAR' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', 
                        color: asset.status === 'COMPRAR' ? 'var(--success)' : 'var(--warning)', 
                        border: `1px solid ${asset.status === 'COMPRAR' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                        padding: '0.15rem 0.5rem', 
                        borderRadius: 'var(--r-full)', 
                        fontSize: '0.75rem', 
                        fontWeight: 800 
                      }}>
                        {asset.status}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {asset.name} • <span style={{ color: 'var(--text-muted)' }}>{asset.category}</span>
                    </span>
                  </div>
                </div>

                {/* Métricas Fundamentalistas Investidor 10 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                  
                  {/* Preço Atual */}
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Cotação Atual</span>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {asset.currentPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>

                  {/* Preço Teto */}
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Preço Teto</span>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                      {hasMaxPrice ? asset.maxPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'N/A'}
                    </span>
                  </div>

                  {/* Margem de Segurança */}
                  {hasMaxPrice && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Margem Seg.</span>
                      <span style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 800, 
                        color: safetyMargin >= 0 ? 'var(--success)' : 'var(--danger)',
                        background: safetyMargin >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--r-sm)'
                      }}>
                        {safetyMargin >= 0 ? `+${safetyMargin.toFixed(1)}%` : `${safetyMargin.toFixed(1)}%`}
                      </span>
                    </div>
                  )}

                  {/* DY % */}
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>DY (12M)</span>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--success)' }}>
                      {asset.dy}%
                    </span>
                  </div>

                  {/* Múltiplo (P/L ou P/VP) */}
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Múltiplo</span>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {asset.plPvP}
                    </span>
                  </div>

                  {/* Peso Recomendado */}
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Peso Alvo</span>
                    <span style={{ fontSize: '1.125rem', fontWeight: 900, color: 'var(--brand-primary-light)' }}>
                      {asset.targetWeight}%
                    </span>
                  </div>

                  {/* Ações e Expandir */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <button 
                      onClick={() => toggleExpand(asset.id)} 
                      className="tx-action-btn"
                      title="Ver Tese & Ficha Técnica"
                      style={{ background: 'var(--bg-input)' }}
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <button onClick={() => handleOpenEdit(asset)} className="tx-action-btn" title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteAsset(asset.id)} className="tx-action-btn tx-action-btn--delete" title="Excluir">
                      <Trash2 size={16} />
                    </button>
                  </div>

                </div>
              </div>

              {/* Ficha Técnica & Tese Expandível (Estilo Investidor 10) */}
              {isExpanded && (
                <div className="anim-fade-up" style={{ 
                  background: 'var(--bg-input)', 
                  padding: '1.25rem', 
                  borderRadius: 'var(--r-lg)', 
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  marginTop: '0.5rem'
                }}>
                  {/* Highlights / Destaques da Empresa */}
                  {asset.highlights && asset.highlights.length > 0 && (
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.375rem' }}>
                        Destaques Fundamentalistas (Investidor 10)
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {asset.highlights.map((hl, idx) => (
                          <span key={idx} style={{ 
                            background: 'rgba(234, 179, 8, 0.12)', 
                            border: '1px solid var(--border-brand)', 
                            color: 'var(--brand-primary-light)', 
                            padding: '0.2rem 0.6rem', 
                            borderRadius: 'var(--r-full)', 
                            fontSize: '0.75rem', 
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <Award size={12} /> {hl}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tese de Investimento do Consultor */}
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.375rem' }}>
                      Tese do Consultor AFIC
                    </span>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5, background: 'var(--bg-surface)', padding: '0.875rem 1rem', borderRadius: 'var(--r-md)', borderLeft: '3px solid var(--brand-primary)' }}>
                      {asset.thesis}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Modal Admin Create/Edit Asset */}
      {isModalOpen && (
        <div className="tx-modal-overlay">
          <div className="tx-modal anim-fade-up" style={{ maxWidth: '580px' }}>
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
                <label className="afic-label">Nome da Empresa / Ativo *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Vale S.A., CSHG Logística..."
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="tx-search-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="afic-grid-2">
                <div>
                  <label className="afic-label">Preço Atual (R$)</label>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="61.20"
                    value={formCurrentPrice}
                    onChange={e => setFormCurrentPrice(e.target.value)}
                    className="tx-search-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label className="afic-label">Preço Teto (R$)</label>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="75.00"
                    value={formMaxPrice}
                    onChange={e => setFormMaxPrice(e.target.value)}
                    className="tx-search-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="afic-grid-2">
                <div>
                  <label className="afic-label">DY % (12M)</label>
                  <input 
                    type="number"
                    step="0.1"
                    placeholder="8.5"
                    value={formDy}
                    onChange={e => setFormDy(e.target.value)}
                    className="tx-search-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label className="afic-label">Múltiplo (P/L ou P/VP)</label>
                  <input 
                    type="text"
                    placeholder="Ex: 5.8x P/L"
                    value={formPlPvP}
                    onChange={e => setFormPlPvP(e.target.value)}
                    className="tx-search-input"
                    style={{ width: '100%' }}
                  />
                </div>
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
                  <label className="afic-label">Status da Recomendação</label>
                  <select 
                    value={formStatus}
                    onChange={(e: any) => setFormStatus(e.target.value)}
                    className="tx-search-input"
                    style={{ width: '100%' }}
                  >
                    <option value="COMPRAR">COMPRAR</option>
                    <option value="AGUARDAR">AGUARDAR</option>
                    <option value="MANTER">MANTER</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="afic-label">Destaques Fundamentalistas (Separados por vírgula)</label>
                <input 
                  type="text"
                  placeholder="Ex: Líder Global, ROE > 20%, Baixa Vacância"
                  value={formHighlightsStr}
                  onChange={e => setFormHighlightsStr(e.target.value)}
                  className="tx-search-input"
                  style={{ width: '100%' }}
                />
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
