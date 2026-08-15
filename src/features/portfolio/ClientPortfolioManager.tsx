import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, TrendingUp, TrendingDown, 
  Search, AlertCircle, Building2, DollarSign, Wallet, X, RefreshCw,
  Calculator, Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { fetchAssetQuote, fetchMultipleQuotes } from '../../lib/brapi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { PortfolioInvestmentSimulatorModal } from './PortfolioInvestmentSimulatorModal';

export interface ClientAsset {
  id: string;
  user_id: string;
  ticker: string;
  name: string;
  category: 'Ações' | 'FIIs' | 'Renda Fixa' | 'Internacional' | 'Cripto' | 'Outros';
  quantity: number;
  average_price: number;
  current_price: number;
  total_value: number;
  institution?: string;
  notes?: string;
  created_at?: string;
}

interface ClientPortfolioManagerProps {
  targetUserId?: string;
  readOnly?: boolean;
  onAssetsLoaded?: (assets: ClientAsset[]) => void;
}

const CATEGORIES: ClientAsset['category'][] = [
  'Ações', 'FIIs', 'Renda Fixa', 'Internacional', 'Cripto', 'Outros'
];

export const ClientPortfolioManager: React.FC<ClientPortfolioManagerProps> = ({
  targetUserId,
  readOnly = false,
  onAssetsLoaded
}) => {
  const [assets, setAssets] = useState<ClientAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<ClientAsset | null>(null);

  // Form State
  const [formTicker, setFormTicker] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ClientAsset['category']>('Ações');
  const [formQuantity, setFormQuantity] = useState('');
  const [formAvgPrice, setFormAvgPrice] = useState('');
  const [formCurrentPrice, setFormCurrentPrice] = useState('');
  const [formInstitution, setFormInstitution] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [fetchingQuote, setFetchingQuote] = useState(false);
  const [updatingAllQuotes, setUpdatingAllQuotes] = useState(false);
  useEffect(() => {
    fetchAssets();
  }, [targetUserId]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      let query = supabase.from('client_assets').select('*').order('created_at', { ascending: false });
      
      if (targetUserId) {
        query = query.eq('user_id', targetUserId);
      } else {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          query = query.eq('user_id', userData.user.id);
        }
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error loading client assets:', error);
      } else if (data) {
        setAssets(data as ClientAsset[]);
        if (onAssetsLoaded) {
          onAssetsLoaded(data as ClientAsset[]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (asset?: ClientAsset) => {
    if (asset) {
      setEditingAsset(asset);
      setFormTicker(asset.ticker);
      setFormName(asset.name);
      setFormCategory(asset.category);
      setFormQuantity(asset.quantity.toString());
      setFormAvgPrice(asset.average_price.toString());
      setFormCurrentPrice(asset.current_price.toString());
      setFormInstitution(asset.institution || '');
      setFormNotes(asset.notes || '');
    } else {
      setEditingAsset(null);
      setFormTicker('');
      setFormName('');
      setFormCategory('Ações');
      setFormQuantity('');
      setFormAvgPrice('');
      setFormCurrentPrice('');
      setFormInstitution('');
      setFormNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTicker.trim() || !formName.trim()) {
      toast.error('Preencha o código (Ticker) e o Nome do ativo.');
      return;
    }

    const qty = parseFloat(formQuantity) || 0;
    const avgPrice = parseFloat(formAvgPrice) || 0;
    const currPrice = parseFloat(formCurrentPrice) || avgPrice;
    const totalVal = qty * currPrice;

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = targetUserId || userData?.user?.id;

      if (!userId) {
        toast.error('Usuário não autenticado.');
        return;
      }

      const payload = {
        user_id: userId,
        ticker: formTicker.trim().toUpperCase(),
        name: formName.trim(),
        category: formCategory,
        quantity: qty,
        average_price: avgPrice,
        current_price: currPrice,
        total_value: totalVal,
        institution: formInstitution.trim() || null,
        notes: formNotes.trim() || null,
        updated_at: new Date().toISOString()
      };

      if (editingAsset) {
        const { error } = await supabase
          .from('client_assets')
          .update(payload)
          .eq('id', editingAsset.id);
        if (error) throw error;
        toast.success('Ativo atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('client_assets')
          .insert([payload]);
        if (error) throw error;
        toast.success('Ativo adicionado à carteira!');
      }

      setIsModalOpen(false);
      fetchAssets();
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao salvar ativo: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!window.confirm('Deseja realmente remover este ativo da sua carteira?')) return;
    try {
      const { error } = await supabase.from('client_assets').delete().eq('id', id);
      if (error) throw error;
      toast.success('Ativo removido.');
      fetchAssets();
    } catch (err: any) {
      toast.error('Erro ao remover ativo.');
    }
  };

  const handleFetchQuote = async () => {
    if (!formTicker.trim()) {
      toast.error('Digite o ticker antes de buscar.');
      return;
    }
    setFetchingQuote(true);
    try {
      const quote = await fetchAssetQuote(formTicker.trim());
      if (quote) {
        setFormName(quote.longName || quote.shortName || '');
        setFormCurrentPrice(quote.regularMarketPrice?.toString() || '');
        
        const upperTicker = formTicker.trim().toUpperCase();
        if (upperTicker.endsWith('11') && !upperTicker.includes('BDR')) {
          setFormCategory('FIIs');
        } else if (upperTicker.endsWith('34') || upperTicker.endsWith('39')) {
          setFormCategory('Internacional');
        } else {
          setFormCategory('Ações');
        }
        
        toast.success(`Cotação de ${upperTicker} atualizada!`);
      } else {
        toast.error(`Ativo ${formTicker.toUpperCase()} não encontrado na B3.`);
      }
    } catch (err) {
      toast.error('Erro ao buscar cotação.');
    } finally {
      setFetchingQuote(false);
    }
  };

  const handleUpdateAllQuotes = async () => {
    if (assets.length === 0) return;
    
    const b3Assets = assets.filter(a => ['Ações', 'FIIs', 'Internacional'].includes(a.category));
    if (b3Assets.length === 0) {
      toast('Nenhum ativo da B3 encontrado para atualizar.', { icon: 'ℹ️' });
      return;
    }

    setUpdatingAllQuotes(true);
    const toastId = toast.loading('Atualizando cotações...');
    try {
      const tickers = Array.from(new Set(b3Assets.map(a => a.ticker))); // Unique tickers
      const quotes = await fetchMultipleQuotes(tickers);
      
      if (quotes.length > 0) {
        let updatedCount = 0;
        
        for (const quote of quotes) {
          const matchingAssets = b3Assets.filter(a => a.ticker.toUpperCase() === quote.symbol.toUpperCase());
          for (const asset of matchingAssets) {
            const newPrice = quote.regularMarketPrice;
            if (newPrice !== asset.current_price) {
              const newTotal = asset.quantity * newPrice;
              await supabase
                .from('client_assets')
                .update({ current_price: newPrice, total_value: newTotal, updated_at: new Date().toISOString() })
                .eq('id', asset.id);
              updatedCount++;
            }
          }
        }
        
        toast.success(`${updatedCount} ativo(s) atualizado(s) com sucesso!`, { id: toastId });
        if (updatedCount > 0) {
          fetchAssets();
        }
      } else {
        toast.error('Não foi possível obter as cotações.', { id: toastId });
      }
    } catch (err) {
      toast.error('Erro ao atualizar cotações em massa.', { id: toastId });
    } finally {
      setUpdatingAllQuotes(false);
    }
  };

  // Calculations
  const filteredAssets = assets.filter(asset => {
    const matchesCategory = selectedCategory === 'Todos' || asset.category === selectedCategory;
    const matchesSearch = asset.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (asset.institution && asset.institution.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const totalInvested = assets.reduce((sum, a) => sum + (a.quantity * a.average_price), 0);
  const currentTotalValue = assets.reduce((sum, a) => sum + (a.total_value || (a.quantity * a.current_price)), 0);
  const totalProfitLoss = currentTotalValue - totalInvested;
  const profitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  // Breakdown by category
  const categoryTotals = CATEGORIES.reduce((acc, cat) => {
    const catAssets = assets.filter(a => a.category === cat);
    const catValue = catAssets.reduce((s, a) => s + (a.total_value || (a.quantity * a.current_price)), 0);
    acc[cat] = {
      amount: catValue,
      count: catAssets.length,
      percentage: currentTotalValue > 0 ? (catValue / currentTotalValue) * 100 : 0
    };
    return acc;
  }, {} as Record<string, { amount: number; count: number; percentage: number }>);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <Card style={{ padding: '1.25rem', background: 'var(--card-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span>Patrimônio Atual Investido</span>
            <Wallet size={20} color="var(--primary-color)" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
            {currentTotalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Total de {assets.length} ativo(s) cadastrado(s)
          </div>
        </Card>

        <Card style={{ padding: '1.25rem', background: 'var(--card-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span>Custo de Aquisição (Total)</span>
            <DollarSign size={20} color="var(--text-secondary)" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
            {totalInvested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Soma das quantidades x Preço Médio
          </div>
        </Card>

        <Card style={{ padding: '1.25rem', background: 'var(--card-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span>Resultado Estimado</span>
            {totalProfitLoss >= 0 ? <TrendingUp size={20} color="var(--success)" /> : <TrendingDown size={20} color="var(--danger)" />}
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: totalProfitLoss >= 0 ? 'var(--success)' : 'var(--danger)', marginTop: '0.5rem' }}>
            {totalProfitLoss >= 0 ? '+' : ''} {totalProfitLoss.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: totalProfitLoss >= 0 ? 'var(--success)' : 'var(--danger)', marginTop: '0.25rem' }}>
            {profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}% de rentabilidade
          </div>
        </Card>
      </div>

      {/* Distribution Progress Bar */}
      {currentTotalValue > 0 && (
        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Distribuição por Categoria
            </h3>
          </div>

          <div style={{ height: '10px', display: 'flex', borderRadius: '5px', overflow: 'hidden', background: 'var(--border-color)', marginBottom: '1rem' }}>
            {CATEGORIES.map(cat => {
              const pct = categoryTotals[cat]?.percentage || 0;
              if (pct === 0) return null;
              const colors: Record<string, string> = {
                'Ações': '#3b82f6',
                'FIIs': '#10b981',
                'Renda Fixa': '#f59e0b',
                'Internacional': '#8b5cf6',
                'Cripto': '#ec4899',
                'Outros': '#6b7280'
              };
              return (
                <div 
                  key={cat} 
                  style={{ width: `${pct}%`, background: colors[cat] || '#6b7280' }} 
                  title={`${cat}: ${pct.toFixed(1)}%`}
                />
              );
            })}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem' }}>
            {CATEGORIES.map(cat => {
              const data = categoryTotals[cat];
              if (!data || data.amount === 0) return null;
              const colors: Record<string, string> = {
                'Ações': '#3b82f6',
                'FIIs': '#10b981',
                'Renda Fixa': '#f59e0b',
                'Internacional': '#8b5cf6',
                'Cripto': '#ec4899',
                'Outros': '#6b7280'
              };
              return (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: colors[cat] }} />
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat}:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {data.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ({data.percentage.toFixed(1)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Toolbar & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', minWidth: '220px', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar por ticker, nome ou corretora..." 
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

          <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '4px', maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
            {['Todos', ...CATEGORIES].map(cat => (
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

        {!readOnly && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Button 
              variant="outline" 
              onClick={handleUpdateAllQuotes}
              disabled={updatingAllQuotes || assets.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={16} /> 
              {updatingAllQuotes ? 'Atualizando...' : 'Atualizar Cotações'}
            </Button>
            <Button 
              onClick={() => setIsSimulatorOpen(true)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                color: '#fff',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
              }}
            >
              <Calculator size={16} /> Aporte Guiado AFIC
            </Button>
            <Button onClick={() => handleOpenModal()}>
              <Plus size={18} /> Adicionar Ativo
            </Button>
          </div>
        )}
      </div>

      {/* Assets List */}
      {loading ? (
        <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Carregando seus ativos da carteira...
        </Card>
      ) : filteredAssets.length === 0 ? (
        <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <AlertCircle size={36} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
          <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
            Nenhum ativo encontrado nesta carteira.
          </p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {!readOnly 
              ? 'Clique em "Adicionar Ativo" para lançar manualmente ou utilize o Aporte Guiado para montar sua carteira a partir da recomendação AFIC.' 
              : 'O cliente ainda não cadastrou ativos nesta carteira.'}
          </p>
          {!readOnly && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1.25rem' }}>
              <Button onClick={() => setIsSimulatorOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} /> Montar Carteira com Aporte Guiado
              </Button>
              <Button variant="outline" onClick={() => handleOpenModal()}>
                <Plus size={16} /> Adicionar Manualmente
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredAssets.map(asset => {
            const assetTotal = asset.total_value || (asset.quantity * asset.current_price);
            const assetCost = asset.quantity * asset.average_price;
            const diff = assetTotal - assetCost;
            const diffPct = assetCost > 0 ? (diff / assetCost) * 100 : 0;
            const shareOfPortfolio = currentTotalValue > 0 ? (assetTotal / currentTotalValue) * 100 : 0;

            return (
              <Card key={asset.id} style={{ padding: '1.25rem', position: 'relative', borderTop: '4px solid var(--primary-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
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
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem' }}>
                      {asset.ticker}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {asset.name}
                    </p>
                  </div>

                  {!readOnly && (
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button 
                        onClick={() => handleOpenModal(asset)} 
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                        title="Editar Ativo"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteAsset(asset.id)} 
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}
                        title="Excluir Ativo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ margin: '1rem 0', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.825rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Quantidade</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{asset.quantity}</span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Preço Médio</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {asset.average_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Preço Atual</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {asset.current_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Valor Total</span>
                    <span style={{ fontWeight: 800, color: 'var(--primary-color)' }}>
                      {assetTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.5rem 0.75rem', borderRadius: 'var(--r-md)', fontSize: '0.78rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Na carteira: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{shareOfPortfolio.toFixed(1)}%</strong>
                  </div>
                  <div style={{ fontWeight: 700, color: diff >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {diff >= 0 ? '+' : ''}{diff.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ({diffPct >= 0 ? '+' : ''}{diffPct.toFixed(1)}%)
                  </div>
                </div>

                {asset.institution && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Building2 size={13} /> Corretora/Instituição: <strong style={{ color: 'var(--text-secondary)' }}>{asset.institution}</strong>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Asset */}
      {isModalOpen && (
        <div className="tx-modal-overlay">
          <div className="tx-modal anim-fade-up" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {editingAsset ? 'Editar Ativo da Carteira' : 'Novo Ativo na Carteira'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="afic-grid-2">
                <div>
                  <label className="afic-label">Código / Ticker *</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      className="afic-input" 
                      placeholder="Ex: VALE3, HGLG11" 
                      value={formTicker} 
                      onChange={e => setFormTicker(e.target.value)}
                      required
                      style={{ flex: 1 }}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleFetchQuote}
                      disabled={fetchingQuote || !formTicker.trim()}
                      style={{ padding: '0 0.75rem' }}
                      title="Buscar dados na B3"
                    >
                      {fetchingQuote ? <RefreshCw size={18} /> : <Search size={18} />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="afic-label">Categoria *</label>
                  <select 
                    className="afic-input" 
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as ClientAsset['category'])}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="afic-label">Nome do Ativo / Descrição *</label>
                <input 
                  type="text" 
                  className="afic-input" 
                  placeholder="Ex: Vale S.A., Tesouro IPCA+ 2035" 
                  value={formName} 
                  onChange={e => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className="afic-grid-3">
                <div>
                  <label className="afic-label">Quantidade</label>
                  <input 
                    type="number" 
                    step="any"
                    className="afic-input" 
                    placeholder="Ex: 100" 
                    value={formQuantity} 
                    onChange={e => setFormQuantity(e.target.value)}
                  />
                </div>

                <div>
                  <label className="afic-label">Preço Médio (R$)</label>
                  <input 
                    type="number" 
                    step="any"
                    className="afic-input" 
                    placeholder="Ex: 60.50" 
                    value={formAvgPrice} 
                    onChange={e => setFormAvgPrice(e.target.value)}
                  />
                </div>

                <div>
                  <label className="afic-label">Preço Atual (R$)</label>
                  <input 
                    type="number" 
                    step="any"
                    className="afic-input" 
                    placeholder="Ex: 65.00" 
                    value={formCurrentPrice} 
                    onChange={e => setFormCurrentPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="afic-grid-2">
                <div>
                  <label className="afic-label">Instituição / Corretora</label>
                  <input 
                    type="text" 
                    className="afic-input" 
                    placeholder="Ex: XP, BTG, NuInvest" 
                    value={formInstitution} 
                    onChange={e => setFormInstitution(e.target.value)}
                  />
                </div>

                <div>
                  <label className="afic-label">Notas / Observações</label>
                  <input 
                    type="text" 
                    className="afic-input" 
                    placeholder="Ex: Focado em dividendos" 
                    value={formNotes} 
                    onChange={e => setFormNotes(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Ativo'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Simulador de Investimento */}
      <PortfolioInvestmentSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        targetUserId={targetUserId}
        onSuccess={() => {
          fetchAssets();
        }}
      />
    </div>
  );
};
