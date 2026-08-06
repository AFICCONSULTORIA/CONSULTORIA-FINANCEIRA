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

export interface PortfolioProfile {
  id: 'conservador' | 'moderado' | 'arrojado';
  name: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  description: string;
  assets: RecommendedAsset[];
}

export const RECOMMENDED_PROFILES: PortfolioProfile[] = [
  {
    id: 'conservador',
    name: 'Carteira Fortaleza',
    badge: 'Conservador / Preservação',
    badgeBg: 'rgba(34, 197, 94, 0.15)',
    badgeColor: 'var(--success)',
    description: 'Foco em Renda Fixa com liquidez, títulos públicos e fundos imobiliários de tijolo/papel de alta segurança.',
    assets: [
      {
        id: 'c1',
        ticker: 'TESOURO SELIC 2029',
        name: 'Tesouro Selic Pós-Fixado',
        category: 'Renda Fixa',
        currentPrice: 14850.00,
        maxPrice: 0,
        dy: 11.7,
        plPvP: '100% Selic',
        targetWeight: 40,
        riskLevel: 'Baixo',
        status: 'COMPRAR',
        thesis: 'Liquidez diária com risco soberano e rendimento acompanhar de perto a taxa básica de juros (Selic). Ideal para reserva e baixo risco.',
        highlights: ['Garantia Soberana', 'Liquidez Diária', 'Baixo Risco']
      },
      {
        id: 'c2',
        ticker: 'TESOURO IPCA+ 2035',
        name: 'Tesouro IPCA+ com Juros Semestrais',
        category: 'Renda Fixa',
        currentPrice: 3120.00,
        maxPrice: 0,
        dy: 6.2,
        plPvP: 'IPCA + 6.2%',
        targetWeight: 30,
        riskLevel: 'Baixo',
        status: 'COMPRAR',
        thesis: 'Garante rendimento real acima da inflação com poder de compra blindado no longo prazo.',
        highlights: ['Proteção Inflacionária', 'Ganho Real', 'Risco Soberano']
      },
      {
        id: 'c3',
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
        thesis: 'Fundo imobiliário focado em papéis de crédito privado de primeira linha (CRIs) atrelados ao CDI.',
        highlights: ['Indexado ao CDI', 'Gestão Kinea', 'Proventos Mensais']
      },
      {
        id: 'c4',
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
        thesis: 'Galpões logísticos de alto padrão técnico em localizações estratégicas de consumo no Brasil.',
        highlights: ['Galpões AAA', 'Vacância Baixa', 'Renda Estável']
      }
    ]
  },
  {
    id: 'moderado',
    name: 'Carteira Equilíbrio',
    badge: 'Moderado / Balanciado',
    badgeBg: 'rgba(59, 130, 246, 0.15)',
    badgeColor: '#3b82f6',
    description: 'Combinação ideal entre Renda Fixa, FIIs pagadores de dividendos e Ações resilientes de valor.',
    assets: [
      {
        id: 'm1',
        ticker: 'ITUB4',
        name: 'Itaú Unibanco S.A.',
        category: 'Ações',
        currentPrice: 32.40,
        maxPrice: 38.00,
        dy: 6.8,
        plPvP: '8.2x P/L',
        targetWeight: 20,
        riskLevel: 'Baixo',
        status: 'COMPRAR',
        thesis: 'Maior banco privado da América Latina, apresentando ROE elevado (>20%) e consistência histórica na entrega de proventos.',
        highlights: ['ROE > 20%', 'Líder Financeiro', 'Pagador de Proventos']
      },
      {
        id: 'm2',
        ticker: 'VALE3',
        name: 'Vale S.A.',
        category: 'Ações',
        currentPrice: 61.20,
        maxPrice: 75.00,
        dy: 8.5,
        plPvP: '5.8x P/L',
        targetWeight: 15,
        riskLevel: 'Médio',
        status: 'COMPRAR',
        thesis: 'Líder mundial na extração de minério de ferro de alta qualidade. Excelente geração de caixa livre e múltiplos atraentes.',
        highlights: ['Líder Global', 'Alto Dividend Yield', 'Geração de Caixa']
      },
      {
        id: 'm3',
        ticker: 'HGLG11',
        name: 'CSHG Logística FII',
        category: 'FIIs',
        currentPrice: 161.50,
        maxPrice: 172.00,
        dy: 8.9,
        plPvP: '0.98x P/VP',
        targetWeight: 20,
        riskLevel: 'Baixo',
        status: 'COMPRAR',
        thesis: 'Fundo imobiliário logístico com imóveis classe A e inquilinos de grande porte comercial.',
        highlights: ['Imóveis Próprios', 'Dividendos Isentos', 'Localização Top']
      },
      {
        id: 'm4',
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
        thesis: 'Excelente retorno em renda fixa imobiliária via CRIs de alta liquidez.',
        highlights: ['Retorno CDI+', 'Portfólio Pulverizado', 'Sem IR no Dividendo']
      },
      {
        id: 'm5',
        ticker: 'TESOURO IPCA+ 2035',
        name: 'Tesouro IPCA+ 2035',
        category: 'Renda Fixa',
        currentPrice: 3120.00,
        maxPrice: 0,
        dy: 6.2,
        plPvP: 'IPCA + 6.2%',
        targetWeight: 15,
        riskLevel: 'Baixo',
        status: 'COMPRAR',
        thesis: 'Proteção contra surtos inflacionários com ganho real contratado no Tesouro Direto.',
        highlights: ['Ganho Real Garantido', 'Proteção da Moeda', 'Título Público']
      },
      {
        id: 'm6',
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
        thesis: 'Diversificação geográfica e cambial investindo em dólar nas 500 maiores empresas dos Estados Unidos.',
        highlights: ['Moeda Forte', 'Gigantes Globais', 'Diversificação EUA']
      }
    ]
  },
  {
    id: 'arrojado',
    name: 'Carteira Expansão & Alpha',
    badge: 'Arrojado / Crescimento',
    badgeBg: 'rgba(234, 179, 8, 0.15)',
    badgeColor: 'var(--brand-primary)',
    description: 'Foco total em valorização de capital no longo prazo com Ações de alto crescimento, B3 e ativos globais/cripto.',
    assets: [
      {
        id: 'a1',
        ticker: 'WEGE3',
        name: 'WEG S.A.',
        category: 'Ações',
        currentPrice: 42.50,
        maxPrice: 52.00,
        dy: 2.4,
        plPvP: '28.5x P/L',
        targetWeight: 25,
        riskLevel: 'Médio',
        status: 'COMPRAR',
        thesis: 'Multinacional brasileira líder em equipamentos eletroeletrônicos e motores industriais. Crescimento composto fantástico.',
        highlights: ['Crescimento Histórico', 'Globalização', 'Vantagem Competitiva']
      },
      {
        id: 'a2',
        ticker: 'PETR4',
        name: 'Petróleo Brasileiro S.A.',
        category: 'Ações',
        currentPrice: 38.90,
        maxPrice: 45.00,
        dy: 14.2,
        plPvP: '4.2x P/L',
        targetWeight: 20,
        riskLevel: 'Alto',
        status: 'COMPRAR',
        thesis: 'Custo de extração Pré-Sal ultracompetitivo gerando proventos gigantescos mesmo com oscilações no petróleo.',
        highlights: ['Pré-Sal Eficiente', 'Super Dividendo', 'Preço Descontado']
      },
      {
        id: 'a3',
        ticker: 'VALE3',
        name: 'Vale S.A.',
        category: 'Ações',
        currentPrice: 61.20,
        maxPrice: 75.00,
        dy: 8.5,
        plPvP: '5.8x P/L',
        targetWeight: 15,
        riskLevel: 'Médio',
        status: 'COMPRAR',
        thesis: 'Minério de ferro de alto teor essencial para transição energética e descarbonização da siderurgia global.',
        highlights: ['Qualidade Premium', 'Dividendos em Dólar', 'Valuation Baixo']
      },
      {
        id: 'a4',
        ticker: 'IVVB11',
        name: 'iShares S&P 500 ETF',
        category: 'Internacional',
        currentPrice: 298.50,
        maxPrice: 320.00,
        dy: 1.4,
        plPvP: '22.4x P/L',
        targetWeight: 20,
        riskLevel: 'Médio',
        status: 'COMPRAR',
        thesis: 'Exposição direta aos líderes de tecnologia e inovação mundial (Apple, Microsoft, Nvidia, Meta, Alphabet).',
        highlights: ['Exposição em Dólar', 'Líderes de IA', 'Top Empresas Mundiais']
      },
      {
        id: 'a5',
        ticker: 'ALZR11',
        name: 'Alianza Trust Renda Imobiliária',
        category: 'FIIs',
        currentPrice: 112.00,
        maxPrice: 118.00,
        dy: 9.1,
        plPvP: '1.02x P/VP',
        targetWeight: 10,
        riskLevel: 'Médio',
        status: 'COMPRAR',
        thesis: 'Fundo Imobiliário atípico de galpões e centros operacionais com contratos longos de 10+ anos e reajuste por inflação.',
        highlights: ['Contratos Atípicos', 'Inquilinos Corporativos', 'Proteção Inflação']
      },
      {
        id: 'a6',
        ticker: 'HASH11',
        name: 'Hashdex Nasdaq Crypto ETF',
        category: 'Cripto',
        currentPrice: 48.00,
        maxPrice: 65.00,
        dy: 0,
        plPvP: 'Indexado Nasdaq Crypto',
        targetWeight: 10,
        riskLevel: 'Alto',
        status: 'COMPRAR',
        thesis: 'Cesta diversificada dos principais criptoativos globais (Bitcoin, Ethereum, Solana) regulada pela CVM.',
        highlights: ['Cripto Regulado', 'Bitcoin & Ethereum', 'Alto Potencial Alpha']
      }
    ]
  }
];

export const RecommendedPortfolio: React.FC = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loadingRole, setLoadingRole] = useState(true);
  
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'client' | 'recommended' | 'comparison'>('client');
  
  // Assets state
  const [selectedProfileId, setSelectedProfileId] = useState<'conservador' | 'moderado' | 'arrojado'>('moderado');
  const [clientAssets, setClientAssets] = useState<ClientAsset[]>([]);
  const [assets, setAssets] = useState<RecommendedAsset[]>(RECOMMENDED_PROFILES[1].assets);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleSelectProfile = (profileId: 'conservador' | 'moderado' | 'arrojado') => {
    setSelectedProfileId(profileId);
    const profile = RECOMMENDED_PROFILES.find(p => p.id === profileId);
    if (profile) {
      setAssets(profile.assets);
      toast.success(`Carteira carregada: ${profile.name}`);
    }
  };

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

  if (!isAdmin) {
    return (
      <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem' }}>
        <div style={{ 
          width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(234, 179, 8, 0.1)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--brand-primary)',
          border: '1px solid rgba(234, 179, 8, 0.2)'
        }}>
          <Lock size={36} />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
          Módulo em Construção
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.6 }}>
          A funcionalidade de Carteira Inteligente AFIC está sendo preparada pelos nossos especialistas e estará disponível em breve para você!
        </p>
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

          {/* Seleção de Perfil de Investidor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Selecione o Perfil de Investimento:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {RECOMMENDED_PROFILES.map(profile => {
                const isSelected = profile.id === selectedProfileId;
                return (
                  <Card 
                    key={profile.id}
                    onClick={() => handleSelectProfile(profile.id)}
                    style={{ 
                      padding: '1.1rem 1.25rem', 
                      cursor: 'pointer',
                      border: isSelected ? '2px solid var(--brand-primary)' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(234, 179, 8, 0.05)' : 'var(--bg-card)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 800, 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: 'var(--r-full)', 
                        background: profile.badgeBg, 
                        color: profile.badgeColor 
                      }}>
                        {profile.badge}
                      </span>
                      {isSelected && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                          ✓ Ativa
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      {profile.name}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {profile.description}
                    </p>
                  </Card>
                );
              })}
            </div>
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
