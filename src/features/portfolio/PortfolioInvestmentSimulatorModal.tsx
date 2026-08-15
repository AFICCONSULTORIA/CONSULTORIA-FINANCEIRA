import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Calculator, Minus, Plus, Sparkles, RefreshCw, CheckCircle2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { RECOMMENDED_PROFILES, type RecommendedAsset } from './RecommendedPortfolio';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

interface PortfolioInvestmentSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfileId?: 'conservador' | 'moderado' | 'arrojado';
  targetUserId?: string;
  onSuccess?: () => void;
}

interface SimulatedItem {
  asset: RecommendedAsset;
  selected: boolean;
  targetBudget: number;
  calculatedQuantity: number;
  allocatedAmount: number;
  unitPrice: number;
}

export const PortfolioInvestmentSimulatorModal: React.FC<PortfolioInvestmentSimulatorModalProps> = ({
  isOpen,
  onClose,
  initialProfileId = 'moderado',
  targetUserId,
  onSuccess
}) => {
  const [selectedProfileId, setSelectedProfileId] = useState<'conservador' | 'moderado' | 'arrojado'>(initialProfileId);
  const [amountInput, setAmountInput] = useState<string>('5000');
  const [customQuantities, setCustomQuantities] = useState<Record<string, number>>({});
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<boolean>(false);

  // Sync profile when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedProfileId(initialProfileId);
    }
  }, [isOpen, initialProfileId]);

  const activeProfile = useMemo(() => {
    return RECOMMENDED_PROFILES.find(p => p.id === selectedProfileId) || RECOMMENDED_PROFILES[1];
  }, [selectedProfileId]);

  const numericAmount = useMemo(() => {
    const clean = amountInput.replace(/[^\d.,]/g, '').replace(',', '.');
    const val = parseFloat(clean);
    return isNaN(val) || val < 0 ? 0 : val;
  }, [amountInput]);

  // Initialize selected map when active profile changes
  useEffect(() => {
    const newSelected: Record<string, boolean> = {};
    activeProfile.assets.forEach(a => {
      newSelected[a.id] = true;
    });
    setSelectedMap(newSelected);
    setCustomQuantities({});
  }, [activeProfile]);

  // Calculate allocations per asset
  const simulatedItems: SimulatedItem[] = useMemo(() => {
    return activeProfile.assets.map(asset => {
      const isSelected = selectedMap[asset.id] !== false;
      const targetBudget = (numericAmount * asset.targetWeight) / 100;
      const unitPrice = asset.currentPrice > 0 ? asset.currentPrice : 100;

      let calculatedQuantity = 0;
      let allocatedAmount = 0;

      if (asset.category === 'Renda Fixa') {
        // For fixed income, allocate whole financial value
        calculatedQuantity = customQuantities[asset.id] !== undefined ? customQuantities[asset.id] : 1;
        allocatedAmount = isSelected ? (customQuantities[asset.id] !== undefined ? customQuantities[asset.id] : targetBudget) : 0;
      } else {
        // For shares/FIIs/ETFs, round to whole integer shares
        if (customQuantities[asset.id] !== undefined) {
          calculatedQuantity = customQuantities[asset.id];
        } else {
          calculatedQuantity = unitPrice > 0 ? Math.floor(targetBudget / unitPrice) : 0;
        }
        allocatedAmount = isSelected ? calculatedQuantity * unitPrice : 0;
      }

      return {
        asset,
        selected: isSelected,
        targetBudget,
        calculatedQuantity,
        allocatedAmount,
        unitPrice
      };
    });
  }, [activeProfile, numericAmount, selectedMap, customQuantities]);

  const totalAllocated = useMemo(() => {
    return simulatedItems.reduce((sum, item) => sum + (item.selected ? item.allocatedAmount : 0), 0);
  }, [simulatedItems]);

  const cashLeftover = useMemo(() => {
    return Math.max(0, numericAmount - totalAllocated);
  }, [numericAmount, totalAllocated]);

  const toggleSelect = (assetId: string) => {
    setSelectedMap(prev => ({
      ...prev,
      [assetId]: !prev[assetId]
    }));
  };

  const handleAdjustQuantity = (assetId: string, delta: number, currentQty: number) => {
    const nextQty = Math.max(0, currentQty + delta);
    setCustomQuantities(prev => ({
      ...prev,
      [assetId]: nextQty
    }));
  };

  const handleSelectAll = (select: boolean) => {
    const newSelected: Record<string, boolean> = {};
    activeProfile.assets.forEach(a => {
      newSelected[a.id] = select;
    });
    setSelectedMap(newSelected);
  };

  // Confirm and insert/update in database
  const handleConfirmAndSave = async () => {
    if (totalAllocated <= 0) {
      toast.error('Nenhum valor ou ativo foi alocado para compra.');
      return;
    }

    setSaving(true);
    const toastId = toast.loading('Consolidando e salvando na sua carteira...');

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = targetUserId || userData?.user?.id;

      if (!userId) {
        toast.error('Usuário não autenticado.', { id: toastId });
        setSaving(false);
        return;
      }

      // 1. Fetch existing client assets for consolidation
      const { data: existingAssets, error: fetchErr } = await supabase
        .from('client_assets')
        .select('*')
        .eq('user_id', userId);

      if (fetchErr) {
        console.error('Erro ao buscar ativos existentes:', fetchErr);
      }

      const existingMap = new Map<string, any>();
      (existingAssets || []).forEach(ea => {
        existingMap.set(ea.ticker.trim().toUpperCase(), ea);
      });

      const itemsToBuy = simulatedItems.filter(item => item.selected && item.allocatedAmount > 0);

      let insertedCount = 0;
      let updatedCount = 0;

      for (const item of itemsToBuy) {
        const upperTicker = item.asset.ticker.trim().toUpperCase();
        const existing = existingMap.get(upperTicker);

        if (item.asset.category === 'Renda Fixa') {
          // Renda Fixa: add to existing value or insert new
          if (existing) {
            const newTotalVal = (existing.total_value || 0) + item.allocatedAmount;
            const newQty = (existing.quantity || 1) + 1;
            await supabase
              .from('client_assets')
              .update({
                total_value: newTotalVal,
                quantity: newQty,
                updated_at: new Date().toISOString()
              })
              .eq('id', existing.id);
            updatedCount++;
          } else {
            await supabase.from('client_assets').insert([{
              user_id: userId,
              ticker: upperTicker,
              name: item.asset.name,
              category: item.asset.category,
              quantity: 1,
              average_price: item.allocatedAmount,
              current_price: item.allocatedAmount,
              total_value: item.allocatedAmount,
              institution: 'Carteira Recomendada AFIC',
              notes: `Alocação recomendada (${activeProfile.name})`,
              updated_at: new Date().toISOString()
            }]);
            insertedCount++;
          }
        } else {
          // Equities, FIIs, ETFs: consolidate shares and weighted average price
          const buyQty = item.calculatedQuantity;
          const buyPrice = item.unitPrice;

          if (existing) {
            const currentQty = existing.quantity || 0;
            const currentAvgPrice = existing.average_price || buyPrice;
            const totalQty = currentQty + buyQty;
            const weightedAvgPrice = totalQty > 0 
              ? ((currentQty * currentAvgPrice) + (buyQty * buyPrice)) / totalQty 
              : buyPrice;
            const newTotalVal = totalQty * (item.asset.currentPrice || weightedAvgPrice);

            await supabase
              .from('client_assets')
              .update({
                quantity: totalQty,
                average_price: parseFloat(weightedAvgPrice.toFixed(2)),
                current_price: item.asset.currentPrice || weightedAvgPrice,
                total_value: parseFloat(newTotalVal.toFixed(2)),
                updated_at: new Date().toISOString()
              })
              .eq('id', existing.id);
            updatedCount++;
          } else {
            const totalVal = buyQty * buyPrice;
            await supabase.from('client_assets').insert([{
              user_id: userId,
              ticker: upperTicker,
              name: item.asset.name,
              category: item.asset.category,
              quantity: buyQty,
              average_price: parseFloat(buyPrice.toFixed(2)),
              current_price: parseFloat(item.asset.currentPrice.toFixed(2)),
              total_value: parseFloat(totalVal.toFixed(2)),
              institution: 'Carteira Recomendada AFIC',
              notes: `Alocação recomendada (${activeProfile.name})`,
              updated_at: new Date().toISOString()
            }]);
            insertedCount++;
          }
        }
      }

      toast.success(
        `Sucesso! ${insertedCount} novos ativos adicionados e ${updatedCount} posições consolidadas.`, 
        { id: toastId, duration: 4000 }
      );

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao salvar na carteira: ' + (err.message || 'Erro inesperado'), { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="tx-modal-overlay" style={{ zIndex: 99999 }}>
      <div 
        className="tx-modal anim-fade-up" 
        style={{ 
          maxWidth: '850px', 
          width: '95%', 
          maxHeight: '90vh', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: '0', 
          overflow: 'hidden',
          borderRadius: 'var(--r-xl)',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}
      >
        {/* Modal Header */}
        <div style={{ 
          padding: '1.25rem 1.5rem', 
          borderBottom: '1px solid var(--border-color)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: 'var(--r-md)', 
              background: 'var(--primary-color)', 
              color: '#fff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)'
            }}>
              <Calculator size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Simulador de Aporte & Compra Guiada
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 'var(--r-full)', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
                  AFIC PRO
                </span>
              </h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                Digite o valor disponível e veja exatamente quantas cotas comprar em cada ativo para replicar a estratégia recomendada.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-muted)', 
              cursor: 'pointer', 
              padding: '0.5rem',
              borderRadius: 'var(--r-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Top Controls: Profile Selection & Amount Input */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            
            {/* Strategy Profile Picker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                1. Selecione a Estratégia Desejada:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                {RECOMMENDED_PROFILES.map(p => {
                  const isSelected = p.id === selectedProfileId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProfileId(p.id)}
                      style={{
                        padding: '0.6rem 0.5rem',
                        borderRadius: 'var(--r-md)',
                        border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                        color: isSelected ? 'var(--primary-color)' : 'var(--text-primary)',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.2rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{p.name.replace('Carteira ', '')}</span>
                      <span style={{ fontSize: '0.68rem', opacity: 0.8, fontWeight: 500 }}>
                        {p.id === 'conservador' ? 'Preservação' : p.id === 'moderado' ? 'Equilíbrio' : 'Crescimento'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Investment Amount Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                2. Valor Disponível para Investir (R$):
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '12px', fontWeight: 700, color: 'var(--primary-color)', fontSize: '1.1rem' }}>
                  R$
                </span>
                <input
                  type="text"
                  value={amountInput}
                  onChange={e => setAmountInput(e.target.value)}
                  placeholder="Ex: 5000"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem 0.65rem 2.5rem',
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    borderRadius: 'var(--r-md)',
                    border: '2px solid var(--primary-color)',
                    background: 'var(--bg-input, var(--card-bg))',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.2rem' }}>
                {['1000', '3000', '5000', '10000', '25000', '50000'].map(shortcut => (
                  <button
                    key={shortcut}
                    type="button"
                    onClick={() => setAmountInput(shortcut)}
                    style={{
                      flex: 1,
                      padding: '0.25rem',
                      borderRadius: 'var(--r-sm)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    +{parseInt(shortcut) >= 1000 ? `${parseInt(shortcut)/1000}k` : shortcut}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Allocation Breakdown Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Distribuição Sugerida ({simulatedItems.filter(s => s.selected).length} de {simulatedItems.length} ativos selecionados)
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
                <button 
                  type="button" 
                  onClick={() => handleSelectAll(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 700 }}
                >
                  Marcar Todos
                </button>
                <span style={{ color: 'var(--border-color)' }}>|</span>
                <button 
                  type="button" 
                  onClick={() => handleSelectAll(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Desmarcar Todos
                </button>
              </div>
            </div>

            <div style={{ 
              borderRadius: 'var(--r-md)', 
              border: '1px solid var(--border-color)', 
              overflow: 'hidden', 
              background: 'var(--bg-secondary)' 
            }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '40px 1.5fr 1fr 1fr 1.2fr 1.2fr', 
                padding: '0.6rem 0.75rem', 
                background: 'var(--card-bg)', 
                borderBottom: '1px solid var(--border-color)',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                <div></div>
                <div>Ativo / Ticker</div>
                <div>Cotação</div>
                <div>Peso Alvo</div>
                <div style={{ textAlign: 'center' }}>Qtd Sugerida</div>
                <div style={{ textAlign: 'right' }}>Total Alocado</div>
              </div>

              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {simulatedItems.map(item => {
                  const isRF = item.asset.category === 'Renda Fixa';
                  const isChecked = item.selected;

                  return (
                    <div 
                      key={item.asset.id}
                      style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '40px 1.5fr 1fr 1fr 1.2fr 1.2fr', 
                        padding: '0.65rem 0.75rem', 
                        alignItems: 'center',
                        borderBottom: '1px solid var(--border-color)',
                        background: isChecked ? 'transparent' : 'rgba(0,0,0,0.02)',
                        opacity: isChecked ? 1 : 0.45,
                        fontSize: '0.825rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Checkbox */}
                      <div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(item.asset.id)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                        />
                      </div>

                      {/* Ticker & Name */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                            {item.asset.ticker}
                          </strong>
                          <span style={{ 
                            fontSize: '0.65rem', 
                            padding: '0.1rem 0.35rem', 
                            borderRadius: 'var(--r-sm)', 
                            background: 'rgba(59, 130, 246, 0.1)', 
                            color: 'var(--primary-color)',
                            fontWeight: 700 
                          }}>
                            {item.asset.category}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                          {item.asset.name}
                        </span>
                      </div>

                      {/* Current Price */}
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {isRF 
                          ? '100% Taxa' 
                          : item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>

                      {/* Target Weight */}
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.asset.targetWeight}%
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', fontWeight: 400 }}>
                          (Meta: {item.targetBudget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })})
                        </span>
                      </div>

                      {/* Quantity Stepper */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                        {isRF ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Valor Direto
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAdjustQuantity(item.asset.id, -1, item.calculatedQuantity)}
                              disabled={!isChecked || item.calculatedQuantity <= 0}
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--card-bg)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-primary)'
                              }}
                            >
                              <Minus size={12} />
                            </button>
                            <span style={{ fontWeight: 800, minWidth: '28px', textAlign: 'center', color: 'var(--text-primary)' }}>
                              {item.calculatedQuantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustQuantity(item.asset.id, 1, item.calculatedQuantity)}
                              disabled={!isChecked}
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--card-bg)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-primary)'
                              }}
                            >
                              <Plus size={12} />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Allocated Value */}
                      <div style={{ textAlign: 'right', fontWeight: 800, color: isChecked ? 'var(--primary-color)' : 'var(--text-muted)' }}>
                        {item.allocatedAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Financial Summary Box */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '0.75rem', 
            padding: '1rem 1.25rem', 
            borderRadius: 'var(--r-md)', 
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Disponível
              </span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                {numericAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Total a Comprar
              </span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.15rem' }}>
                {totalAllocated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Sobra na Corretora
              </span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: cashLeftover > 0 ? '#3b82f6' : 'var(--text-muted)', marginTop: '0.15rem' }}>
                {cashLeftover.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div style={{ 
          padding: '1.25rem 1.5rem', 
          borderTop: '1px solid var(--border-color)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '1rem',
          background: 'var(--card-bg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            <Sparkles size={16} color="var(--primary-color)" />
            <span>As novas posições serão consolidadas automaticamente no seu Preço Médio.</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleConfirmAndSave} 
              disabled={saving || totalAllocated <= 0}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '180px', justifyContent: 'center' }}
            >
              {saving ? (
                <>
                  <RefreshCw className="anim-spin" size={16} /> Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} /> Confirmar & Salvar na Carteira
                </>
              )}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
