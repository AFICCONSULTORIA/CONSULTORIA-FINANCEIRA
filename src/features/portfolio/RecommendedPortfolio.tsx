import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, 
  RefreshCw, X, Search, 
  Award, Wallet, PieChart, Lock, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { ClientPortfolioManager, type ClientAsset } from './ClientPortfolioManager';
import { PortfolioAllocationComparison } from './PortfolioAllocationComparison';

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
  
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'client' | 'recommended' | 'comparison'>('client');
  
  // Assets state
  const [clientAssets, setClientAssets] = useState<ClientAsset[]>([]);
  const [assets, setAssets] = useState<RecommendedAsset[]>(INITIAL_RECOMMENDED_ASSETS);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

        if (data?.role === 'admin' || data?.role === 'consultant') {
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
        <p>Carregando carteira de investimentos...</p>
      </div>
    );
  }

  return (
    <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Main Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            Carteira & Investimentos AFIC
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
            Monte sua carteira pessoal, consulte a carteira recomendada AFIC e receba sugestões de alocação.
          </p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <button
          onClick={() => setActiveTab('client')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            borderRadius: 'var(--r-md)',
            fontWeight: 700,
            fontSize: '0.9rem',
            border: 'none',
            background: activeTab === 'client' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'client' ? '#ffffff' : 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <Wallet size={18} /> Minha Carteira
        </button>

        <button
          onClick={() => setActiveTab('recommended')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            borderRadius: 'var(--r-md)',
            fontWeight: 700,
            fontSize: '0.9rem',
            border: 'none',
            background: activeTab === 'recommended' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'recommended' ? '#ffffff' : 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <Award size={18} /> Carteira Recomendada AFIC {!isAdmin && '🔒'}
        </button>

        <button
          onClick={() => setActiveTab('comparison')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            borderRadius: 'var(--r-md)',
            fontWeight: 700,
            fontSize: '0.9rem',
            border: 'none',
            background: activeTab === 'comparison' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'comparison' ? '#ffffff' : 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <PieChart size={18} /> Comparativo & Sugestões {!isAdmin && '🔒'}
        </button>
      </div>

      {/* Tab 1: Minha Carteira (Client Portfolio) */}
      {activeTab === 'client' && (
        <ClientPortfolioManager 
          onAssetsLoaded={(loaded) => setClientAssets(loaded)}
        />
      )}

      {/* Tab 3: Comparativo & Sugestões */}
      {activeTab === 'comparison' && (
        !isAdmin ? (
          <Card style={{ 
            padding: '3rem 2rem', 
            textAlign: 'center', 
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
              marginBottom: '1.5rem'
            }}>
              <Lock size={14} /> Recurso Exclusivo VIP
            </div>

            <div style={{ 
              width: '70px', 
              height: '70px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
              border: '1px solid var(--border-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <Shield size={36} color="var(--brand-primary)" />
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              Comparativo & Sugestões de Alocação 🔒
            </h2>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
              Acesso exclusivo ao comparativo de ativos e sugestões de rebalanceamento enviadas pelos consultores da AFIC.
            </p>
          </Card>
        ) : (
          <PortfolioAllocationComparison 
            clientAssets={clientAssets}
            recommendedAssets={assets}
            onSelectTab={(tab) => setActiveTab(tab)}
          />
        )
      )}

      {/* Tab 2: Carteira Recomendada AFIC */}
      {activeTab === 'recommended' && (
        !isAdmin ? (
          <Card style={{ 
            padding: '3rem 2rem', 
            textAlign: 'center', 
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
              marginBottom: '1.5rem'
            }}>
              <Lock size={14} /> Recurso Exclusivo VIP
            </div>

            <div style={{ 
              width: '70px', 
              height: '70px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
              border: '1px solid var(--border-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <Shield size={36} color="var(--brand-primary)" />
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              Carteira Recomendada AFIC 🔒
            </h2>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
              Acesso exclusivo às recomendações estratégicas de ativos selecionados com inteligência fundamentalista e tese da consultoria AFIC.
            </p>
          </Card>
        ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header AFIC Recommended */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Carteira Recomendada AFIC (Estilo Investidor 10)
                </h2>
                {isAdmin && (
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
                )}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Análise fundamentalista com múltiplos, Preço Teto, Margem de Segurança e Tese de Investimento.
              </p>
            </div>

            {isAdmin && (
              <Button onClick={handleOpenCreate}>
                <Plus size={18} /> Adicionar Ativo Recomendado
              </Button>
            )}
          </div>

          {/* Cards de Métricas Recomendadas */}
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

          {/* Filtros e Busca */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: '220px', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Buscar por ticker ou nome..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
              {['Todos', 'Ações', 'FIIs', 'Renda Fixa', 'Internacional', 'Cripto'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--r-md)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: selectedCategory === cat ? 'var(--primary-color)' : 'var(--border-color)',
                    background: selectedCategory === cat ? 'var(--primary-color)' : 'transparent',
                    color: selectedCategory === cat ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de Ativos Recomendados */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {filteredAssets.map(asset => {
              const hasMaxPrice = asset.maxPrice > 0;
              const isDiscounted = hasMaxPrice && asset.currentPrice <= asset.maxPrice;
              const discountMargin = hasMaxPrice ? ((asset.maxPrice - asset.currentPrice) / asset.maxPrice) * 100 : 0;

              return (
                <Card key={asset.id} style={{ padding: '1.25rem', position: 'relative', borderTop: '4px solid var(--primary-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 700, 
                          padding: '0.15rem 0.5rem', 
                          borderRadius: 'var(--r-sm)', 
                          background: 'rgba(59, 130, 246, 0.1)', 
                          color: 'var(--primary-color)',
                          textTransform: 'uppercase'
                        }}>
                          {asset.category}
                        </span>

                        <span style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 800, 
                          padding: '0.15rem 0.5rem', 
                          borderRadius: 'var(--r-sm)', 
                          background: asset.status === 'COMPRAR' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                          color: asset.status === 'COMPRAR' ? 'var(--success)' : 'var(--danger)'
                        }}>
                          {asset.status}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem' }}>
                        {asset.ticker}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {asset.name}
                      </p>
                    </div>

                    {isAdmin && (
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button 
                          onClick={() => handleOpenEdit(asset)} 
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                          title="Editar Ativo AFIC"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteAsset(asset.id)} 
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}
                          title="Excluir Ativo AFIC"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ margin: '1rem 0', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.825rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Preço Atual</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {asset.currentPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Preço Teto</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>
                        {hasMaxPrice ? asset.maxPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Dividend Yield (DY)</span>
                      <span style={{ fontWeight: 700, color: 'var(--success)' }}>
                        {asset.dy}% a.a.
                      </span>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Peso Alvo</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {asset.targetWeight}%
                      </span>
                    </div>
                  </div>

                  {hasMaxPrice && (
                    <div style={{ 
                      fontSize: '0.78rem', 
                      padding: '0.4rem 0.6rem', 
                      borderRadius: 'var(--r-sm)', 
                      background: isDiscounted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: isDiscounted ? 'var(--success)' : 'var(--danger)',
                      fontWeight: 600,
                      marginBottom: '0.75rem'
                    }}>
                      {isDiscounted ? `Margem de Segurança: +${discountMargin.toFixed(1)}%` : 'Acima do Preço Teto Recomendado'}
                    </div>
                  )}

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '0.75rem' }}>
                    "{asset.thesis}"
                  </p>

                  {asset.highlights && asset.highlights.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {asset.highlights.map((h, idx) => (
                        <span key={idx} style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: 'var(--r-sm)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                          • {h}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
        )
      )}

      {/* Modal Admin Add/Edit Recommended Asset */}
      {isModalOpen && (
        <div className="tx-modal-overlay">
          <div className="tx-modal anim-fade-up" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {editingAsset ? 'Editar Ativo Recomendado (AFIC)' : 'Novo Ativo Recomendado (AFIC)'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="afic-label">Ticker *</label>
                  <input type="text" className="afic-input" value={formTicker} onChange={e => setFormTicker(e.target.value)} required />
                </div>
                <div>
                  <label className="afic-label">Categoria *</label>
                  <select className="afic-input" value={formCategory} onChange={e => setFormCategory(e.target.value as any)}>
                    {['Ações', 'FIIs', 'Renda Fixa', 'Internacional', 'Cripto'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="afic-label">Nome do Ativo *</label>
                <input type="text" className="afic-input" value={formName} onChange={e => setFormName(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="afic-label">Preço Atual (R$)</label>
                  <input type="number" step="any" className="afic-input" value={formCurrentPrice} onChange={e => setFormCurrentPrice(e.target.value)} />
                </div>
                <div>
                  <label className="afic-label">Preço Teto (R$)</label>
                  <input type="number" step="any" className="afic-input" value={formMaxPrice} onChange={e => setFormMaxPrice(e.target.value)} />
                </div>
                <div>
                  <label className="afic-label">Dividend Yield %</label>
                  <input type="number" step="any" className="afic-input" value={formDy} onChange={e => setFormDy(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="afic-label">P/L ou P/VP</label>
                  <input type="text" className="afic-input" value={formPlPvP} onChange={e => setFormPlPvP(e.target.value)} />
                </div>
                <div>
                  <label className="afic-label">Peso Alvo %</label>
                  <input type="number" step="any" className="afic-input" value={formWeight} onChange={e => setFormWeight(e.target.value)} />
                </div>
                <div>
                  <label className="afic-label">Status Recomendação</label>
                  <select className="afic-input" value={formStatus} onChange={e => setFormStatus(e.target.value as any)}>
                    <option value="COMPRAR">COMPRAR</option>
                    <option value="AGUARDAR">AGUARDAR</option>
                    <option value="MANTER">MANTER</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="afic-label">Tese de Investimento</label>
                <textarea className="afic-input" rows={3} value={formThesis} onChange={e => setFormThesis(e.target.value)} />
              </div>

              <div>
                <label className="afic-label">Destaques (separados por vírgula)</label>
                <input type="text" className="afic-input" value={formHighlightsStr} onChange={e => setFormHighlightsStr(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar Recomendação</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
