import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, 
  RefreshCw, X, Search, 
  Award, Wallet, PieChart, GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { ClientPortfolioManager, type ClientAsset } from './ClientPortfolioManager';
import { PortfolioAllocationComparison } from './PortfolioAllocationComparison';
import { PortfolioPaywall } from './PortfolioPaywall';

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
    description: 'Foco em Renda Fixa com liquidez, títulos públicos e FIIs de tijolo/papel de alta segurança.',
    assets: [
      { id: 'c1', ticker: 'TESOURO SELIC 2029', name: 'Tesouro Selic Pós-Fixado', category: 'Renda Fixa', currentPrice: 14850.00, maxPrice: 0, dy: 11.7, plPvP: '100% Selic', targetWeight: 10, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Liquidez diária com risco soberano. Ideal para reserva de emergência.', highlights: ['Garantia Soberana', 'Liquidez Diária', 'Baixo Risco'] },
      { id: 'c2', ticker: 'TESOURO IPCA+ 2035', name: 'Tesouro IPCA+ c/ Juros', category: 'Renda Fixa', currentPrice: 3120.00, maxPrice: 0, dy: 6.2, plPvP: 'IPCA + 6.2%', targetWeight: 10, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Garante rendimento real acima da inflação com poder de compra blindado no longo prazo.', highlights: ['Proteção Inflacionária', 'Ganho Real', 'Risco Soberano'] },
      { id: 'c3', ticker: 'CDB MASTER', name: 'CDB Banco Master', category: 'Renda Fixa', currentPrice: 1000.00, maxPrice: 0, dy: 12.5, plPvP: '120% CDI', targetWeight: 10, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'CDB com alta rentabilidade atrelada ao CDI e proteção do FGC.', highlights: ['Garantia FGC', 'Alta Rentabilidade', 'Pós-Fixado'] },
      { id: 'c4', ticker: 'LCI CAIXA', name: 'LCI Caixa Econômica', category: 'Renda Fixa', currentPrice: 1000.00, maxPrice: 0, dy: 9.8, plPvP: '95% CDI', targetWeight: 10, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Isenção de IR com segurança institucional forte, rendimento atrativo.', highlights: ['Isento de IR', 'Baixíssimo Risco', 'Garantia FGC'] },
      { id: 'c5', ticker: 'KNCR11', name: 'Kinea Rendimento Imobiliário', category: 'FIIs', currentPrice: 101.80, maxPrice: 106.00, dy: 12.1, plPvP: '1.01x P/VP', targetWeight: 10, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Fundo imobiliário focado em papéis de crédito privado de primeira linha (CRIs) atrelados ao CDI.', highlights: ['Indexado ao CDI', 'Gestão Kinea', 'Proventos Mensais'] },
      { id: 'c6', ticker: 'HGLG11', name: 'CSHG Logística FII', category: 'FIIs', currentPrice: 161.50, maxPrice: 172.00, dy: 8.9, plPvP: '0.98x P/VP', targetWeight: 10, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Galpões logísticos de alto padrão técnico em localizações estratégicas de consumo no Brasil.', highlights: ['Galpões AAA', 'Vacância Baixa', 'Renda Estável'] },
      { id: 'c7', ticker: 'VISC11', name: 'Vinci Shopping Centers', category: 'FIIs', currentPrice: 115.40, maxPrice: 125.00, dy: 8.5, plPvP: '0.92x P/VP', targetWeight: 10, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Fundo de shoppings com portfólio diversificado em várias regiões do Brasil.', highlights: ['Recuperação Varejo', 'Diversificação', 'Dividendos Crescentes'] },
      { id: 'c8', ticker: 'MXRF11', name: 'Maxi Renda FII', category: 'FIIs', currentPrice: 10.30, maxPrice: 11.00, dy: 13.2, plPvP: '1.03x P/VP', targetWeight: 10, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Fundo de papel bastante pulverizado, sendo porta de entrada para investidores iniciantes.', highlights: ['Ticket Baixo', 'Alto DY', 'Alta Liquidez'] },
      { id: 'c9', ticker: 'BBAS3', name: 'Banco do Brasil', category: 'Ações', currentPrice: 28.50, maxPrice: 32.00, dy: 11.0, plPvP: '4.5x P/L', targetWeight: 10, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Banco sólido da Estratégia dos Baldes, com resultados consistentes e dividend yield excelente.', highlights: ['Valuation Atrativo', 'Dividendos', 'Forte no Agro'] },
      { id: 'c10', ticker: 'TAEE11', name: 'Transmissora Aliança', category: 'Ações', currentPrice: 35.80, maxPrice: 40.00, dy: 10.2, plPvP: '1.8x P/VP', targetWeight: 10, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Setor elétrico altamente defensivo (Estratégia dos Baldes). Contratos longos atrelados à inflação.', highlights: ['Receita Previsível', 'Defensiva', 'Dividendos Constantes'] }
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
      { id: 'm1', ticker: 'TESOURO IPCA+ 2035', name: 'Tesouro IPCA+ 2035', category: 'Renda Fixa', currentPrice: 3120.00, maxPrice: 0, dy: 6.2, plPvP: 'IPCA + 6.2%', targetWeight: 10, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Proteção contra surtos inflacionários com ganho real contratado.', highlights: ['Ganho Real Garantido', 'Proteção', 'Título Público'] },
      { id: 'm2', ticker: 'CDB ABC', name: 'CDB Banco ABC Brasil', category: 'Renda Fixa', currentPrice: 1000.00, maxPrice: 0, dy: 11.5, plPvP: '115% CDI', targetWeight: 5, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Banco especializado em crédito corporativo de baixo risco, ótimo rendimento.', highlights: ['Liquidez', 'Baixo Risco', 'FGC'] },
      { id: 'm3', ticker: 'CRA JBS', name: 'CRA JBS IPCA+', category: 'Renda Fixa', currentPrice: 1000.00, maxPrice: 0, dy: 7.0, plPvP: 'IPCA + 7.0%', targetWeight: 5, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Isenção de IR com prêmio de risco adequado em empresa gigante de alimentos.', highlights: ['Isento de IR', 'Proteção Inflação', 'Prêmio Alto'] },
      { id: 'm4', ticker: 'HGLG11', name: 'CSHG Logística FII', category: 'FIIs', currentPrice: 161.50, maxPrice: 172.00, dy: 8.9, plPvP: '0.98x P/VP', targetWeight: 10, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Fundo imobiliário logístico de alta qualidade e localização.', highlights: ['Imóveis Próprios', 'Sem IR no Dividendo', 'Localização'] },
      { id: 'm5', ticker: 'KNCR11', name: 'Kinea Rendimento Imobiliário', category: 'FIIs', currentPrice: 101.80, maxPrice: 106.00, dy: 12.1, plPvP: '1.01x P/VP', targetWeight: 10, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'CRIs indexados ao CDI para manter altos rendimentos sem risco direcional.', highlights: ['Retorno CDI+', 'Pulverizado', 'Isento'] },
      { id: 'm6', ticker: 'BTLG11', name: 'BTG Pactual Logística', category: 'FIIs', currentPrice: 102.50, maxPrice: 108.00, dy: 9.2, plPvP: '0.95x P/VP', targetWeight: 5, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Galpões modernos focados em e-commerce e logística urbana (last-mile).', highlights: ['Logística Last-Mile', 'Gestão BTG', 'Crescimento'] },
      { id: 'm7', ticker: 'ITUB4', name: 'Itaú Unibanco S.A.', category: 'Ações', currentPrice: 32.40, maxPrice: 38.00, dy: 6.8, plPvP: '8.2x P/L', targetWeight: 10, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Maior banco privado, ROE elevado e consistência. Pilar (Bancos) da Estratégia dos Baldes.', highlights: ['ROE > 20%', 'Líder Financeiro', 'Bancos'] },
      { id: 'm8', ticker: 'TAEE11', name: 'Transmissora Aliança', category: 'Ações', currentPrice: 35.80, maxPrice: 40.00, dy: 10.2, plPvP: '1.8x P/VP', targetWeight: 10, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Atua na transmissão de energia. Receitas previsíveis e alta distribuição. Pilar (Energia) dos Baldes.', highlights: ['Energia Elétrica', 'Receita Estável', 'Defensiva'] },
      { id: 'm9', ticker: 'BBSE3', name: 'BB Seguridade', category: 'Ações', currentPrice: 33.20, maxPrice: 38.00, dy: 9.5, plPvP: '8.5x P/L', targetWeight: 10, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Negócio asset-light de altíssima geração de caixa. Pilar (Seguros) da Estratégia dos Baldes.', highlights: ['Seguros', 'Alta Geração Caixa', 'Asset Light'] },
      { id: 'm10', ticker: 'VIVT3', name: 'Telefônica (Vivo)', category: 'Ações', currentPrice: 52.40, maxPrice: 60.00, dy: 7.8, plPvP: '13.0x P/L', targetWeight: 10, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Líder de telecom com forte infraestrutura de fibra. Pilar (Telecom) da Estratégia dos Baldes.', highlights: ['Telecomunicações', 'Liderança', 'Fibra'] },
      { id: 'm11', ticker: 'IVVB11', name: 'iShares S&P 500 ETF', category: 'Internacional', currentPrice: 298.50, maxPrice: 320.00, dy: 1.4, plPvP: '22.4x P/L', targetWeight: 10, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Diversificação geográfica nas 500 maiores empresas dos Estados Unidos (proteção em dólar).', highlights: ['Moeda Forte', 'Gigantes Globais', 'EUA'] },
      { id: 'm12', ticker: 'WRLD11', name: 'Investo Global ETF', category: 'Internacional', currentPrice: 85.20, maxPrice: 95.00, dy: 1.2, plPvP: '20.0x P/L', targetWeight: 5, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Exposição mundial a mais de 9000 empresas de países desenvolvidos e emergentes.', highlights: ['Diversificação Global', 'Proteção Total', 'Múltiplos Mercados'] }
    ]
  },
  {
    id: 'arrojado',
    name: 'Carteira Expansão & Alpha',
    badge: 'Arrojado / Crescimento',
    badgeBg: 'rgba(234, 179, 8, 0.15)',
    badgeColor: 'var(--brand-primary)',
    description: 'Foco total em valorização de capital no longo prazo com Ações (Baldes), Crescimento e ativos globais/cripto.',
    assets: [
      { id: 'a1', ticker: 'TESOURO IPCA+ 2045', name: 'Tesouro IPCA+ Longo', category: 'Renda Fixa', currentPrice: 1200.00, maxPrice: 0, dy: 6.5, plPvP: 'IPCA + 6.5%', targetWeight: 5, riskLevel: 'Alto', status: 'COMPRAR', thesis: 'Marcação a mercado forte em cenários de queda de juros com carrego alto.', highlights: ['Marcação a Mercado', 'Longo Prazo', 'Ganho Real'] },
      { id: 'a2', ticker: 'DEB VALE', name: 'Debênture Vale IPCA+', category: 'Renda Fixa', currentPrice: 1000.00, maxPrice: 0, dy: 6.0, plPvP: 'IPCA + 6.0%', targetWeight: 5, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Crédito premium de gigante corporativa, proteção inflacionária isenta de IR.', highlights: ['Isento de IR', 'Crédito Premium', 'Proteção'] },
      { id: 'a3', ticker: 'ALZR11', name: 'Alianza Trust Renda', category: 'FIIs', currentPrice: 112.00, maxPrice: 118.00, dy: 9.1, plPvP: '1.02x P/VP', targetWeight: 5, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Fundo atípico com contratos longos (10+ anos) e reajuste garantido por inflação.', highlights: ['Contratos Atípicos', 'Inquilinos Fortes', 'Proteção'] },
      { id: 'a4', ticker: 'KNIP11', name: 'Kinea Índices de Preços', category: 'FIIs', currentPrice: 94.50, maxPrice: 100.00, dy: 11.5, plPvP: '0.96x P/VP', targetWeight: 5, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Fundo de CRIs atrelados à inflação (IPCA), excelente para manutenção do poder de compra.', highlights: ['Proteção Inflação', 'Gestão Kinea', 'Desconto'] },
      { id: 'a5', ticker: 'BBAS3', name: 'Banco do Brasil', category: 'Ações', currentPrice: 28.50, maxPrice: 32.00, dy: 11.0, plPvP: '4.5x P/L', targetWeight: 7, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Pilar Bancos (Baldes). Valuation descontado com dividend yield duplo dígito.', highlights: ['Bancos', 'Dividendos', 'Desconto'] },
      { id: 'a6', ticker: 'EGIE3', name: 'Engie Brasil', category: 'Ações', currentPrice: 42.10, maxPrice: 48.00, dy: 8.5, plPvP: '12.0x P/L', targetWeight: 7, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Pilar Energia (Baldes). Matriz 100% renovável e forte capacidade de execução de novos projetos.', highlights: ['Energia Renovável', 'Execução', 'ESG'] },
      { id: 'a7', ticker: 'BBSE3', name: 'BB Seguridade', category: 'Ações', currentPrice: 33.20, maxPrice: 38.00, dy: 9.5, plPvP: '8.5x P/L', targetWeight: 7, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Pilar Seguros (Baldes). Crescimento em prêmios e sinistralidade controlada.', highlights: ['Seguros', 'Rentabilidade', 'Sem CAPEX'] },
      { id: 'a8', ticker: 'SAPR4', name: 'Sanepar', category: 'Ações', currentPrice: 5.60, maxPrice: 6.50, dy: 6.5, plPvP: '0.7x P/VP', targetWeight: 7, riskLevel: 'Alto', status: 'COMPRAR', thesis: 'Pilar Saneamento (Baldes). Monopólio natural descontado com novo marco do saneamento.', highlights: ['Saneamento', 'Desconto P/VP', 'Monopólio'] },
      { id: 'a9', ticker: 'VIVT3', name: 'Telefônica (Vivo)', category: 'Ações', currentPrice: 52.40, maxPrice: 60.00, dy: 7.8, plPvP: '13.0x P/L', targetWeight: 7, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Pilar Telecom (Baldes). Expansão acelerada de fibra e controle de custos operacionais.', highlights: ['Telecom', 'Fibra Óptica', 'Liderança'] },
      { id: 'a10', ticker: 'WEGE3', name: 'WEG S.A.', category: 'Ações', currentPrice: 42.50, maxPrice: 52.00, dy: 2.4, plPvP: '28.5x P/L', targetWeight: 5, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Ação de crescimento secular, líder global em motores elétricos, beneficiada por dólar.', highlights: ['Crescimento', 'Global', 'Tecnologia'] },
      { id: 'a11', ticker: 'RENT3', name: 'Localiza', category: 'Ações', currentPrice: 50.10, maxPrice: 65.00, dy: 2.1, plPvP: '18.0x P/L', targetWeight: 5, riskLevel: 'Alto', status: 'COMPRAR', thesis: 'Liderança absoluta em mobilidade e aluguel de carros, escala traz vantagem competitiva intransponível.', highlights: ['Mobilidade', 'Escala Absoluta', 'Crescimento'] },
      { id: 'a12', ticker: 'PRIO3', name: 'PetroRio', category: 'Ações', currentPrice: 45.20, maxPrice: 55.00, dy: 0, plPvP: '8.0x P/L', targetWeight: 5, riskLevel: 'Alto', status: 'COMPRAR', thesis: 'Produtora independente de petróleo mais eficiente do mundo (lifting cost muito baixo).', highlights: ['Eficiência Extrema', 'O&G', 'Crescimento'] },
      { id: 'a13', ticker: 'IVVB11', name: 'iShares S&P 500 ETF', category: 'Internacional', currentPrice: 298.50, maxPrice: 320.00, dy: 1.4, plPvP: '22.4x P/L', targetWeight: 10, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Exposição direta aos líderes globais de inovação e tecnologia do S&P 500.', highlights: ['Dólar', 'EUA', 'Líderes de Mercado'] },
      { id: 'a14', ticker: 'NASD11', name: 'Nasdaq 100 ETF', category: 'Internacional', currentPrice: 12.50, maxPrice: 15.00, dy: 0.5, plPvP: '28.0x P/L', targetWeight: 5, riskLevel: 'Alto', status: 'COMPRAR', thesis: 'Focado em tecnologia extrema, engloba Inteligência Artificial e Semiconductors.', highlights: ['Tech Pura', 'Nasdaq', 'Inteligência Artificial'] },
      { id: 'a15', ticker: 'HASH11', name: 'Hashdex Nasdaq Crypto', category: 'Cripto', currentPrice: 48.00, maxPrice: 65.00, dy: 0, plPvP: 'N/A', targetWeight: 10, riskLevel: 'Alto', status: 'COMPRAR', thesis: 'Diversificação inteligente em criptomoedas com custódia regulada via ETF B3.', highlights: ['Criptomoedas', 'Regulação B3', 'Reserva de Valor'] }
    ]
  }
];


export const RecommendedPortfolio: React.FC = () => {
  const navigate = useNavigate();
  const { user, role, hasPortfolioAccess } = useAuth();
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

  // Bloqueia acesso para clientes que não compraram
  if (role === 'client' && !hasPortfolioAccess) {
    return <PortfolioPaywall />;
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
          <Award size={18} /> Carteira Recomendada AFIC
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
          <PieChart size={18} /> Comparativo & Sugestões
        </button>

        <button
          onClick={() => navigate('/client/education')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            borderRadius: 'var(--r-md)',
            fontWeight: 700,
            fontSize: '0.9rem',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            background: 'rgba(139, 92, 246, 0.12)',
            color: '#8B5CF6',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <GraduationCap size={18} /> Academia AFIC 🔒
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
        <PortfolioAllocationComparison 
          clientAssets={clientAssets}
          recommendedAssets={assets}
          onSelectTab={(tab) => setActiveTab(tab)}
        />
      )}

      {/* Tab 2: Carteira Recomendada AFIC */}
      {activeTab === 'recommended' && (
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
