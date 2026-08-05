import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Send, User, Receipt, CreditCard, PiggyBank, Star, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { MoneyInput } from '../../components/ui/MoneyInput';

import '../../components/ui/ui.css';
import './ClientOnboarding.css';
import { calculateHealthScore } from '../../utils/scoreCalculator';

const STEPS = [
  { id: 1, icon: User,       color: '#10B981', title: 'Perfil & Renda',              subtitle: 'Vamos começar conhecendo você e sua renda.' },
  { id: 2, icon: Receipt,    color: '#06B6D4', title: 'Raio-X de Custos',            subtitle: 'Mapeie suas despesas fixas e variáveis.' },
  { id: 3, icon: CreditCard, color: '#EF4444', title: 'Mapa de Endividamento',       subtitle: 'Identifique suas dívidas e financiamentos.' },
  { id: 4, icon: PiggyBank,  color: '#8B5CF6', title: 'Patrimônio & Liquidez',      subtitle: 'Quanto você já tem guardado e investido?' },
  { id: 5, icon: Star,       color: '#F59E0B', title: 'Sonhos & Metas',             subtitle: 'Para onde você quer levar sua vida financeira?' },
];

export const ClientOnboarding: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    income: '', extraIncome: '', dependents: '0',
    housing: '', food: '', health: '', transport: '', bills: '', leisure: '',
    debtImovel: '', debtVeiculo: '', debtPessoal: '', debtCartao: '', debtOutros: '',
    equityCC: '', equityRendaFixa: '', equityRV: '', equityImoveis: '', equityVeiculos: '',
    goalShort: '', goalShortValue: '',
    goalMedium: '', goalMediumValue: '',
    goalLong: '', motivation: ''
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const total = STEPS.length;
  const current = STEPS[step - 1];
  const StepIcon = current.icon;

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    // Soma básica com conversão da máscara
    const parse = (val: string) => {
      if (!val) return 0;
      const clean = val.replace(/\./g, '').replace(',', '.');
      return parseFloat(clean) || 0;
    };
    
    const monthlyIncome = parse(formData.income) + parse(formData.extraIncome);
    const fixedCosts = parse(formData.housing) + parse(formData.food) + parse(formData.health) + parse(formData.transport) + parse(formData.bills) + parse(formData.leisure);
    const totalDebt = parse(formData.debtImovel) + parse(formData.debtVeiculo) + parse(formData.debtPessoal) + parse(formData.debtCartao) + parse(formData.debtOutros);
    const totalEquity = parse(formData.equityCC) + parse(formData.equityRendaFixa) + parse(formData.equityRV) + parse(formData.equityImoveis) + parse(formData.equityVeiculos);
    
    // Status simplificado
    let status = 'good';
    if (fixedCosts > monthlyIncome * 0.8) status = 'attention';
    if (fixedCosts + totalDebt > monthlyIncome) status = 'critical';

    const calculatedScore = calculateHealthScore(monthlyIncome, fixedCosts, totalDebt, totalEquity);

    try {
      // 1. Salvar na tabela financial_profiles
      const { error: profileError } = await supabase.from('financial_profiles').upsert({
        user_id: user.id,
        monthly_income: monthlyIncome,
        fixed_costs: fixedCosts,
        total_debt: totalDebt,
        total_equity: totalEquity,
        health_score: calculatedScore,
        status: status,
        goal_short: formData.goalShort,
        goal_medium: formData.goalMedium,
        goal_long: formData.goalLong,
        raw_onboarding_data: formData
      });

      if (profileError) throw profileError;

      // 2. Atualizar user para has_completed_onboarding = true
      const { error: userError } = await supabase
        .from('users')
        .update({ has_completed_onboarding: true })
        .eq('id', user.id);

      if (userError) throw userError;

      // 3. Status de Sucesso e Redirecionar
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/client';
      }, 2500);

    } catch (err: any) {
      console.error(err);
      setError(`Erro do Banco: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        return formData.income !== '' && formData.extraIncome !== '' && formData.dependents !== '';
      case 2:
        return formData.housing !== '' && formData.food !== '' && formData.health !== '' && formData.transport !== '' && formData.bills !== '' && formData.leisure !== '';
      case 3:
        return formData.debtImovel !== '' && formData.debtVeiculo !== '' && formData.debtPessoal !== '' && formData.debtCartao !== '' && formData.debtOutros !== '';
      case 4:
        return formData.equityCC !== '' && formData.equityRendaFixa !== '' && formData.equityRV !== '' && formData.equityImoveis !== '' && formData.equityVeiculos !== '';
      case 5:
        return formData.goalShort.trim() !== '' && formData.goalShortValue !== '' && 
               formData.goalMedium.trim() !== '' && formData.goalMediumValue !== '' && 
               formData.goalLong.trim() !== '' && formData.motivation.trim() !== '';
      default:
        return true;
    }
  };

  return (
    <>
      {(success || error) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', position: 'fixed', top: 0, left: 0, width: '100vw', zIndex: 9999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
          <div className="anim-fade-up" style={{ textAlign: 'center', background: 'var(--bg-card)', padding: '3rem', borderRadius: 'var(--r-xl)', border: `1px solid ${error ? 'var(--danger)' : 'var(--success)'}`, boxShadow: `0 10px 40px ${error ? 'var(--danger)' : 'var(--success)'}20`, maxWidth: '500px', width: '90%' }}>
            {error ? (
              <AlertTriangle size={64} color="var(--danger)" style={{ margin: '0 auto 1.5rem auto' }} />
            ) : (
              <CheckCircle size={64} color="var(--success)" style={{ margin: '0 auto 1.5rem auto' }} />
            )}
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              {error ? 'Ops, algo deu errado' : 'Tudo Pronto!'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', whiteSpace: 'pre-line' }}>
              {error ? error : 'Seu perfil financeiro foi criado com sucesso.\nVocê está sendo redirecionado para o seu painel...'}
            </p>
            
            {error ? (
              <button className="afic-btn afic-btn--primary" style={{ marginTop: '2rem', width: '100%' }} onClick={() => setError(null)}>
                Voltar e Tentar Novamente
              </button>
            ) : (
              <div style={{ marginTop: '2rem' }}>
                 <Loader2 className="anim-spin" size={24} color="var(--success)" style={{ margin: '0 auto' }} />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="onboard container" style={{ filter: (success || error) ? 'blur(4px)' : 'none', pointerEvents: (success || error) ? 'none' : 'auto' }}>
        <div className="onboard__track">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done    = s.id < step;
          const active  = s.id === step;
          const canClick = s.id <= step; // Só permite clicar em passos anteriores ou no atual
          
          return (
            <React.Fragment key={s.id}>
              <button
                className={`onboard__step-btn ${done ? 'done' : ''} ${active ? 'active' : ''} ${!canClick ? 'disabled' : ''}`}
                style={{ '--step-color': s.color, opacity: canClick ? 1 : 0.5, cursor: canClick ? 'pointer' : 'not-allowed' } as React.CSSProperties}
                onClick={() => {
                  if (canClick) setStep(s.id);
                }}
                disabled={!canClick}
                title={s.title}
              >
                <span className="onboard__step-num">
                  {done ? '✓' : <Icon size={16} />}
                </span>
                <span className="onboard__step-label">{s.title}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className="onboard__connector">
                  <div className="onboard__connector-fill" style={{ width: done ? '100%' : '0%', background: s.color }} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="onboard__mobile-progress">
        <div className="onboard__mobile-bar">
          <div className="onboard__mobile-fill" style={{ width: `${((step) / total) * 100}%` }} />
        </div>
        <span>Passo {step} de {total}</span>
      </div>

      <div className="onboard__card anim-fade-up">
        <div className="onboard__card-header">
          <div className="onboard__icon-wrap" style={{ background: `${current.color}20`, border: `1px solid ${current.color}40` }}>
            <StepIcon size={28} color={current.color} />
          </div>
          <div>
            <h2 className="onboard__card-title">{current.title}</h2>
            <p className="onboard__card-sub">{current.subtitle}</p>
          </div>
        </div>

        <hr className="afic-divider" />

        <div className="onboard__form-body">
          
          {step === 1 && (
            <div className="onboard__grid">
              <Field label="Renda Principal Líquida (mensal)" hint="Salário já descontado impostos">
                <MoneyInput value={formData.income} onChange={(v) => handleChange('income', v)} />
              </Field>
              <Field label="Rendas Extras (média mensal)">
                <MoneyInput value={formData.extraIncome} onChange={(v) => handleChange('extraIncome', v)} />
              </Field>
              <Field label="Dependentes financeiros">
                <select 
                  value={formData.dependents} 
                  onChange={e => handleChange('dependents', e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: 'var(--r-md)', 
                    border: '1px solid var(--border-color)', 
                    background: 'var(--bg-input)', 
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '1rem'
                  }}
                >
                  <option value="0" style={{ background: 'var(--bg-app)' }}>0</option>
                  <option value="1" style={{ background: 'var(--bg-app)' }}>1</option>
                  <option value="2" style={{ background: 'var(--bg-app)' }}>2</option>
                  <option value="3" style={{ background: 'var(--bg-app)' }}>3</option>
                  <option value="4+" style={{ background: 'var(--bg-app)' }}>4+</option>
                </select>
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="onboard__grid">
              <Field label="Moradia (aluguel ou prestação)"><MoneyInput value={formData.housing} onChange={(v) => handleChange('housing', v)} /></Field>
              <Field label="Alimentação (mercado + refeições)"><MoneyInput value={formData.food} onChange={(v) => handleChange('food', v)} /></Field>
              <Field label="Saúde (plano + medicamentos)"><MoneyInput value={formData.health} onChange={(v) => handleChange('health', v)} /></Field>
              <Field label="Transporte (combustível, uber)"><MoneyInput value={formData.transport} onChange={(v) => handleChange('transport', v)} /></Field>
              <Field label="Contas de Consumo (luz, água, internet)"><MoneyInput value={formData.bills} onChange={(v) => handleChange('bills', v)} /></Field>
              <Field label="Lazer & Estilo de Vida"><MoneyInput value={formData.leisure} onChange={(v) => handleChange('leisure', v)} /></Field>
            </div>
          )}

          {step === 3 && (
            <div className="onboard__grid">
              <Field label="Financiamento Imóvel (parcela/mês)"><MoneyInput value={formData.debtImovel} onChange={(v) => handleChange('debtImovel', v)} /></Field>
              <Field label="Financiamento Veículo (parcela/mês)"><MoneyInput value={formData.debtVeiculo} onChange={(v) => handleChange('debtVeiculo', v)} /></Field>
              <Field label="Empréstimos Pessoais (parcela/mês)"><MoneyInput value={formData.debtPessoal} onChange={(v) => handleChange('debtPessoal', v)} /></Field>
              <Field label="Cartão de Crédito Rotativo"><MoneyInput value={formData.debtCartao} onChange={(v) => handleChange('debtCartao', v)} /></Field>
              <Field label="Cheque Especial ou outras dívidas"><MoneyInput value={formData.debtOutros} onChange={(v) => handleChange('debtOutros', v)} /></Field>
            </div>
          )}

          {step === 4 && (
            <div className="onboard__grid">
              <Field label="Dinheiro em Conta / Poupança"><MoneyInput value={formData.equityCC} onChange={(v) => handleChange('equityCC', v)} /></Field>
              <Field label="Tesouro Direto / Renda Fixa"><MoneyInput value={formData.equityRendaFixa} onChange={(v) => handleChange('equityRendaFixa', v)} /></Field>
              <Field label="Ações / FIIs / Fundos"><MoneyInput value={formData.equityRV} onChange={(v) => handleChange('equityRV', v)} /></Field>
              <Field label="Imóveis quitados (valor)"><MoneyInput value={formData.equityImoveis} onChange={(v) => handleChange('equityImoveis', v)} /></Field>
              <Field label="Veículos quitados (valor)"><MoneyInput value={formData.equityVeiculos} onChange={(v) => handleChange('equityVeiculos', v)} /></Field>
            </div>
          )}

          {step === 5 && (
            <div className="onboard__grid">
              <Field label="Objetivo de Curto Prazo (até 1 ano)">
                <input 
                  type="text" 
                  placeholder="Ex: Quitar o cartão" 
                  value={formData.goalShort} 
                  onChange={e => handleChange('goalShort', e.target.value)} 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </Field>
              <Field label="Valor necessário"><MoneyInput value={formData.goalShortValue} onChange={(v) => handleChange('goalShortValue', v)} /></Field>
              <Field label="Objetivo de Médio Prazo (1 a 5 anos)">
                <input 
                  type="text" 
                  placeholder="Ex: Trocar de carro" 
                  value={formData.goalMedium} 
                  onChange={e => handleChange('goalMedium', e.target.value)} 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </Field>
              <Field label="Valor necessário"><MoneyInput value={formData.goalMediumValue} onChange={(v) => handleChange('goalMediumValue', v)} /></Field>
              <Field label="Objetivo de Longo Prazo (Acima de 5 anos)">
                <input 
                  type="text" 
                  placeholder="Ex: Aposentadoria, Liberdade Financeira" 
                  value={formData.goalLong} 
                  onChange={e => handleChange('goalLong', e.target.value)} 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </Field>
              <Field label="O que te motiva?">
                <textarea 
                  rows={3} 
                  value={formData.motivation} 
                  onChange={e => handleChange('motivation', e.target.value)} 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
                />
              </Field>
            </div>
          )}
        </div>

        <div className="onboard__footer">
          <button className="afic-btn afic-btn--ghost" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1 || loading}>
            <ChevronLeft size={18} /> Voltar
          </button>

          <span className="onboard__pager">{step} / {total}</span>

          {step < total ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
              <button 
                className="afic-btn afic-btn--primary" 
                onClick={() => setStep(s => Math.min(total, s + 1))}
                disabled={!isStepValid(step)}
                style={{ opacity: !isStepValid(step) ? 0.5 : 1, cursor: !isStepValid(step) ? 'not-allowed' : 'pointer' }}
              >
                Próximo <ChevronRight size={18} />
              </button>
              {!isStepValid(step) && <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>Preencha todos os campos (use 0 se não houver)</span>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
              <button 
                className="afic-btn afic-btn--primary" 
                onClick={handleSubmit} 
                disabled={loading || !isStepValid(step)}
                style={{ opacity: (!isStepValid(step) || loading) ? 0.5 : 1, cursor: (!isStepValid(step) || loading) ? 'not-allowed' : 'pointer' }}
              >
                {loading ? <Loader2 className="anim-spin" size={16} /> : <><Send size={16} /> Enviar ao Consultor</>}
              </button>
              {!isStepValid(step) && <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>Preencha todos os campos</span>}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div className="onboard__field">
    <label className="afic-label">{label}</label>
    {children}
    {hint && <span className="onboard__hint">{hint}</span>}
  </div>
);
