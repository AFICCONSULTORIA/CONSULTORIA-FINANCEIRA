import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, 
  RefreshCw, X, Search, 
  Award, Wallet, PieChart, GraduationCap,
  Calculator, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { fetchMultipleQuotes } from '../../lib/brapi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { ClientPortfolioManager, type ClientAsset } from './ClientPortfolioManager';
import { PortfolioAllocationComparison } from './PortfolioAllocationComparison';
import { PortfolioPaywall } from './PortfolioPaywall';
import { PortfolioInvestmentSimulatorModal } from './PortfolioInvestmentSimulatorModal';

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
      { id: 'c_rf1', ticker: 'TESOURO SELIC', name: 'Tesouro Selic', category: 'Renda Fixa', currentPrice: 14850.00, maxPrice: 0, dy: 10.5, plPvP: '100% Selic', targetWeight: 30, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Reserva de liquidez com risco soberano.' },
      { id: 'c_rf2', ticker: 'IPCA+ 2032', name: 'Tesouro IPCA+ 2032', category: 'Renda Fixa', currentPrice: 3120.00, maxPrice: 0, dy: 6.2, plPvP: 'IPCA + 6.2%', targetWeight: 15, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Proteção contra inflação.' },
      { id: 'c_rf3', ticker: 'IPCA+ LONGO', name: 'Tesouro IPCA+ Longo Prazo', category: 'Renda Fixa', currentPrice: 1200.00, maxPrice: 0, dy: 6.5, plPvP: 'IPCA + 6.5%', targetWeight: 5, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Marcação a mercado.' },
      { id: 'c_rf4', ticker: 'CDB 100% CDI', name: 'CDB 100%+ CDI', category: 'Renda Fixa', currentPrice: 1000.00, maxPrice: 0, dy: 10.5, plPvP: '100% CDI', targetWeight: 5, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Rendimento pós-fixado.' },
      { id: 'c_rf5', ticker: 'LCI/LCA', name: 'LCI/LCA', category: 'Renda Fixa', currentPrice: 1000.00, maxPrice: 0, dy: 9.0, plPvP: '90% CDI', targetWeight: 5, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Isento de IR.' },
      
      { id: 'c_fii1', ticker: 'KNCR11', name: 'Kinea Rendimentos', category: 'FIIs', currentPrice: 101.80, maxPrice: 106.00, dy: 12.1, plPvP: '1.01x P/VP', targetWeight: 5, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Recebíveis / Papel' },
      { id: 'c_fii2', ticker: 'MXRF11', name: 'Maxi Renda', category: 'FIIs', currentPrice: 10.30, maxPrice: 11.00, dy: 13.2, plPvP: '1.03x P/VP', targetWeight: 4, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Recebíveis / Híbrido' },
      { id: 'c_fii3', ticker: 'HGLG11', name: 'CSHG Logística', category: 'FIIs', currentPrice: 161.50, maxPrice: 172.00, dy: 8.9, plPvP: '0.98x P/VP', targetWeight: 3, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Logística' },
      { id: 'c_fii4', ticker: 'XPLG11', name: 'XP Log', category: 'FIIs', currentPrice: 105.20, maxPrice: 110.00, dy: 8.5, plPvP: '0.95x P/VP', targetWeight: 2, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Logística' },
      { id: 'c_fii5', ticker: 'XPML11', name: 'XP Malls', category: 'FIIs', currentPrice: 115.40, maxPrice: 120.00, dy: 8.2, plPvP: '0.98x P/VP', targetWeight: 1, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Shoppings' },

      { id: 'c_ac1', ticker: 'ITUB4', name: 'Itaú Unibanco', category: 'Ações', currentPrice: 32.40, maxPrice: 38.00, dy: 6.8, plPvP: '8.2x P/L', targetWeight: 4, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Bancos' },
      { id: 'c_ac2', ticker: 'BBSE3', name: 'BB Seguridade', category: 'Ações', currentPrice: 33.20, maxPrice: 38.00, dy: 9.5, plPvP: '8.5x P/L', targetWeight: 3, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Seguros' },
      { id: 'c_ac3', ticker: 'TAEE11', name: 'Taesa', category: 'Ações', currentPrice: 35.80, maxPrice: 40.00, dy: 10.2, plPvP: '1.8x P/VP', targetWeight: 3, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Energia' },
      { id: 'c_ac4', ticker: 'SBSP3', name: 'Sabesp', category: 'Ações', currentPrice: 75.20, maxPrice: 85.00, dy: 3.5, plPvP: '1.5x P/VP', targetWeight: 3, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Saneamento' },
      { id: 'c_ac5', ticker: 'TIMS3', name: 'TIM', category: 'Ações', currentPrice: 18.50, maxPrice: 22.00, dy: 6.5, plPvP: '12x P/L', targetWeight: 1, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Telecom' },
      { id: 'c_ac6', ticker: 'VIVT3', name: 'Telefônica Brasil', category: 'Ações', currentPrice: 52.40, maxPrice: 60.00, dy: 7.8, plPvP: '13.0x P/L', targetWeight: 1, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Telecom' },

      { id: 'c_int1', ticker: 'WRLD11', name: 'Investo Global', category: 'Internacional', currentPrice: 85.20, maxPrice: 95.00, dy: 1.2, plPvP: '20x P/L', targetWeight: 5, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Ações Globais' },
      { id: 'c_int2', ticker: 'BOVA11', name: 'iShares Ibovespa', category: 'Internacional', currentPrice: 125.00, maxPrice: 140.00, dy: 0, plPvP: 'N/A', targetWeight: 3, riskLevel: 'Alto', status: 'COMPRAR', thesis: 'Ibovespa' },
      { id: 'c_int3', ticker: 'IVVB11', name: 'iShares S&P 500', category: 'Internacional', currentPrice: 298.50, maxPrice: 320.00, dy: 1.4, plPvP: '22x P/L', targetWeight: 2, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'S&P 500' }
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
      { id: 'm_rf1', ticker: 'TESOURO SELIC', name: 'Tesouro Selic', category: 'Renda Fixa', currentPrice: 14850.00, maxPrice: 0, dy: 10.5, plPvP: '100% Selic', targetWeight: 15, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Reserva de liquidez com risco soberano.' },
      { id: 'm_rf2', ticker: 'IPCA+ 2032', name: 'Tesouro IPCA+ 2032', category: 'Renda Fixa', currentPrice: 3120.00, maxPrice: 0, dy: 6.2, plPvP: 'IPCA + 6.2%', targetWeight: 8, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Proteção contra inflação.' },
      { id: 'm_rf3', ticker: 'IPCA+ LONGO', name: 'Tesouro IPCA+ Longo Prazo', category: 'Renda Fixa', currentPrice: 1200.00, maxPrice: 0, dy: 6.5, plPvP: 'IPCA + 6.5%', targetWeight: 5, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Marcação a mercado.' },
      { id: 'm_rf4', ticker: 'CDB 100% CDI', name: 'CDB 100%+ CDI', category: 'Renda Fixa', currentPrice: 1000.00, maxPrice: 0, dy: 10.5, plPvP: '100% CDI', targetWeight: 4, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Rendimento pós-fixado.' },
      { id: 'm_rf5', ticker: 'LCI/LCA', name: 'LCI/LCA', category: 'Renda Fixa', currentPrice: 1000.00, maxPrice: 0, dy: 9.0, plPvP: '90% CDI', targetWeight: 3, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Isento de IR.' },
      
      { id: 'm_fii1', ticker: 'KNCR11', name: 'Kinea Rendimentos', category: 'FIIs', currentPrice: 101.80, maxPrice: 106.00, dy: 12.1, plPvP: '1.01x P/VP', targetWeight: 4, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Recebíveis / Papel' },
      { id: 'm_fii2', ticker: 'MXRF11', name: 'Maxi Renda', category: 'FIIs', currentPrice: 10.30, maxPrice: 11.00, dy: 13.2, plPvP: '1.03x P/VP', targetWeight: 3, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Recebíveis / Híbrido' },
      { id: 'm_fii3', ticker: 'HGLG11', name: 'CSHG Logística', category: 'FIIs', currentPrice: 161.50, maxPrice: 172.00, dy: 8.9, plPvP: '0.98x P/VP', targetWeight: 4, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Logística' },
      { id: 'm_fii4', ticker: 'XPLG11', name: 'XP Log', category: 'FIIs', currentPrice: 105.20, maxPrice: 110.00, dy: 8.5, plPvP: '0.95x P/VP', targetWeight: 2, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Logística' },
      { id: 'm_fii5', ticker: 'XPML11', name: 'XP Malls', category: 'FIIs', currentPrice: 115.40, maxPrice: 120.00, dy: 8.2, plPvP: '0.98x P/VP', targetWeight: 2, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Shoppings' },

      { id: 'm_ac1', ticker: 'ITUB4', name: 'Itaú Unibanco', category: 'Ações', currentPrice: 32.40, maxPrice: 38.00, dy: 6.8, plPvP: '8.2x P/L', targetWeight: 8, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Bancos' },
      { id: 'm_ac2', ticker: 'BBSE3', name: 'BB Seguridade', category: 'Ações', currentPrice: 33.20, maxPrice: 38.00, dy: 9.5, plPvP: '8.5x P/L', targetWeight: 6, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Seguros' },
      { id: 'm_ac3', ticker: 'TAEE11', name: 'Taesa', category: 'Ações', currentPrice: 35.80, maxPrice: 40.00, dy: 10.2, plPvP: '1.8x P/VP', targetWeight: 7, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Energia' },
      { id: 'm_ac4', ticker: 'SBSP3', name: 'Sabesp', category: 'Ações', currentPrice: 75.20, maxPrice: 85.00, dy: 3.5, plPvP: '1.5x P/VP', targetWeight: 7, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Saneamento' },
      { id: 'm_ac5', ticker: 'TIMS3', name: 'TIM', category: 'Ações', currentPrice: 18.50, maxPrice: 22.00, dy: 6.5, plPvP: '12x P/L', targetWeight: 4, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Telecom' },
      { id: 'm_ac6', ticker: 'VIVT3', name: 'Telefônica Brasil', category: 'Ações', currentPrice: 52.40, maxPrice: 60.00, dy: 7.8, plPvP: '13.0x P/L', targetWeight: 3, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Telecom' },

      { id: 'm_int1', ticker: 'WRLD11', name: 'Investo Global', category: 'Internacional', currentPrice: 85.20, maxPrice: 95.00, dy: 1.2, plPvP: '20x P/L', targetWeight: 8, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Ações Globais' },
      { id: 'm_int2', ticker: 'BOVA11', name: 'iShares Ibovespa', category: 'Internacional', currentPrice: 125.00, maxPrice: 140.00, dy: 0, plPvP: 'N/A', targetWeight: 4, riskLevel: 'Alto', status: 'COMPRAR', thesis: 'Ibovespa' },
      { id: 'm_int3', ticker: 'IVVB11', name: 'iShares S&P 500', category: 'Internacional', currentPrice: 298.50, maxPrice: 320.00, dy: 1.4, plPvP: '22x P/L', targetWeight: 3, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'S&P 500' }
    ]
  },
  {
    id: 'arrojado',
    name: 'Carteira Expansão & Alpha',
    badge: 'Arrojado / Crescimento',
    badgeBg: 'rgba(234, 179, 8, 0.15)',
    badgeColor: 'var(--brand-primary)',
    description: 'Foco total em valorização de capital no longo prazo com Ações, Crescimento e ativos globais.',
    assets: [
      { id: 'a_rf1', ticker: 'TESOURO SELIC', name: 'Tesouro Selic', category: 'Renda Fixa', currentPrice: 14850.00, maxPrice: 0, dy: 10.5, plPvP: '100% Selic', targetWeight: 5, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Reserva de liquidez com risco soberano.' },
      { id: 'a_rf2', ticker: 'IPCA+ 2032', name: 'Tesouro IPCA+ 2032', category: 'Renda Fixa', currentPrice: 3120.00, maxPrice: 0, dy: 6.2, plPvP: 'IPCA + 6.2%', targetWeight: 5, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Proteção contra inflação.' },
      { id: 'a_rf3', ticker: 'IPCA+ LONGO', name: 'Tesouro IPCA+ Longo Prazo', category: 'Renda Fixa', currentPrice: 1200.00, maxPrice: 0, dy: 6.5, plPvP: 'IPCA + 6.5%', targetWeight: 3, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Marcação a mercado.' },
      { id: 'a_rf4', ticker: 'CDB 100% CDI', name: 'CDB 100%+ CDI', category: 'Renda Fixa', currentPrice: 1000.00, maxPrice: 0, dy: 10.5, plPvP: '100% CDI', targetWeight: 1, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Rendimento pós-fixado.' },
      { id: 'a_rf5', ticker: 'LCI/LCA', name: 'LCI/LCA', category: 'Renda Fixa', currentPrice: 1000.00, maxPrice: 0, dy: 9.0, plPvP: '90% CDI', targetWeight: 1, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Isento de IR.' },
      
      { id: 'a_fii1', ticker: 'KNCR11', name: 'Kinea Rendimentos', category: 'FIIs', currentPrice: 101.80, maxPrice: 106.00, dy: 12.1, plPvP: '1.01x P/VP', targetWeight: 3, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Recebíveis / Papel' },
      { id: 'a_fii2', ticker: 'MXRF11', name: 'Maxi Renda', category: 'FIIs', currentPrice: 10.30, maxPrice: 11.00, dy: 13.2, plPvP: '1.03x P/VP', targetWeight: 2, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Recebíveis / Híbrido' },
      { id: 'a_fii3', ticker: 'HGLG11', name: 'CSHG Logística', category: 'FIIs', currentPrice: 161.50, maxPrice: 172.00, dy: 8.9, plPvP: '0.98x P/VP', targetWeight: 4, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Logística' },
      { id: 'a_fii4', ticker: 'XPLG11', name: 'XP Log', category: 'FIIs', currentPrice: 105.20, maxPrice: 110.00, dy: 8.5, plPvP: '0.95x P/VP', targetWeight: 3, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Logística' },
      { id: 'a_fii5', ticker: 'XPML11', name: 'XP Malls', category: 'FIIs', currentPrice: 115.40, maxPrice: 120.00, dy: 8.2, plPvP: '0.98x P/VP', targetWeight: 3, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Shoppings' },

      { id: 'a_ac1', ticker: 'ITUB4', name: 'Itaú Unibanco', category: 'Ações', currentPrice: 32.40, maxPrice: 38.00, dy: 6.8, plPvP: '8.2x P/L', targetWeight: 10, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Bancos' },
      { id: 'a_ac2', ticker: 'BBSE3', name: 'BB Seguridade', category: 'Ações', currentPrice: 33.20, maxPrice: 38.00, dy: 9.5, plPvP: '8.5x P/L', targetWeight: 7, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Seguros' },
      { id: 'a_ac3', ticker: 'TAEE11', name: 'Taesa', category: 'Ações', currentPrice: 35.80, maxPrice: 40.00, dy: 10.2, plPvP: '1.8x P/VP', targetWeight: 8, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Energia' },
      { id: 'a_ac4', ticker: 'SBSP3', name: 'Sabesp', category: 'Ações', currentPrice: 75.20, maxPrice: 85.00, dy: 3.5, plPvP: '1.5x P/VP', targetWeight: 8, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Saneamento' },
      { id: 'a_ac5', ticker: 'TIMS3', name: 'TIM', category: 'Ações', currentPrice: 18.50, maxPrice: 22.00, dy: 6.5, plPvP: '12x P/L', targetWeight: 6, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Telecom' },
      { id: 'a_ac6', ticker: 'VIVT3', name: 'Telefônica Brasil', category: 'Ações', currentPrice: 52.40, maxPrice: 60.00, dy: 7.8, plPvP: '13.0x P/L', targetWeight: 6, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Telecom' },

      { id: 'a_int1', ticker: 'WRLD11', name: 'Investo Global', category: 'Internacional', currentPrice: 85.20, maxPrice: 95.00, dy: 1.2, plPvP: '20x P/L', targetWeight: 12, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Ações Globais' },
      { id: 'a_int2', ticker: 'BOVA11', name: 'iShares Ibovespa', category: 'Internacional', currentPrice: 125.00, maxPrice: 140.00, dy: 0, plPvP: 'N/A', targetWeight: 6, riskLevel: 'Alto', status: 'COMPRAR', thesis: 'Ibovespa' },
      { id: 'a_int3', ticker: 'IVVB11', name: 'iShares S&P 500', category: 'Internacional', currentPrice: 298.50, maxPrice: 320.00, dy: 1.4, plPvP: '22x P/L', targetWeight: 7, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'S&P 500' }
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
  
  // Simulator modal state
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  
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

  // Fetch live prices for current assets
  useEffect(() => {
    const fetchPrices = async () => {
      const tickersToFetch = assets
        .filter(a => a.category !== 'Renda Fixa' && a.category !== 'Cripto')
        .map(a => a.ticker);

      if (tickersToFetch.length > 0) {
        try {
          const quotes = await fetchMultipleQuotes(tickersToFetch);
          const priceMap: Record<string, number> = {};
          quotes.forEach(q => {
            priceMap[q.symbol.toUpperCase()] = q.regularMarketPrice;
          });
          setLivePrices(prev => ({ ...prev, ...priceMap }));
        } catch (err) {
          console.error('Failed to fetch live prices', err);
        }
      }
    };

    fetchPrices();
  }, [assets]);

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

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Button 
                onClick={() => setIsSimulatorOpen(true)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
                }}
              >
                <Calculator size={18} /> Simular Aporte & Comprar
              </Button>
              {isAdmin && (
                <Button variant="outline" onClick={handleOpenCreate}>
                  <Plus size={18} /> Adicionar Ativo
                </Button>
              )}
            </div>
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

            {/* Banner Simulação de Aporte */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.1) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 'var(--r-lg)',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--primary-color)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)'
                }}>
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Pronto para aplicar a {RECOMMENDED_PROFILES.find(p => p.id === selectedProfileId)?.name}?
                  </h3>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    Informe o valor disponível e o sistema calculará quantas cotas de cada título comprar, já atualizando a sua carteira.
                  </p>
                </div>
              </div>

              <Button 
                onClick={() => setIsSimulatorOpen(true)}
                style={{
                  padding: '0.65rem 1.25rem',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
              >
                <Calculator size={17} /> Simular Aporte na Carteira
              </Button>
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
              const currentPrice = livePrices[asset.ticker.trim().toUpperCase()] || asset.currentPrice;
              const hasMaxPrice = asset.maxPrice > 0;
              const isDiscounted = hasMaxPrice && currentPrice <= asset.maxPrice;
              const discountMargin = hasMaxPrice ? ((asset.maxPrice - currentPrice) / asset.maxPrice) * 100 : 0;

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
                        {currentPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
      {/* Modal Simulador de Investimento */}
      <PortfolioInvestmentSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        initialProfileId={selectedProfileId}
        livePrices={livePrices}
        onSuccess={() => {
          setActiveTab('client');
        }}
      />
    </div>
  );
};
