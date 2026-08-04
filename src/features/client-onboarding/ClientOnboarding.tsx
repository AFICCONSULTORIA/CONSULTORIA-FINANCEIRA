import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Send, User, Receipt, CreditCard, PiggyBank, Star } from 'lucide-react';
import '../../components/ui/ui.css';
import './ClientOnboarding.css';

const STEPS = [
  { id: 1, icon: User,       color: '#10B981', title: 'Perfil & Renda',              subtitle: 'Vamos começar conhecendo você e sua renda.' },
  { id: 2, icon: Receipt,    color: '#06B6D4', title: 'Raio-X de Custos',            subtitle: 'Mapeie suas despesas fixas e variáveis.' },
  { id: 3, icon: CreditCard, color: '#EF4444', title: 'Mapa de Endividamento',       subtitle: 'Identifique suas dívidas e financiamentos.' },
  { id: 4, icon: PiggyBank,  color: '#8B5CF6', title: 'Patrimônio & Liquidez',      subtitle: 'Quanto você já tem guardado e investido?' },
  { id: 5, icon: Star,       color: '#F59E0B', title: 'Sonhos & Metas',             subtitle: 'Para onde você quer levar sua vida financeira?' },
];

export const ClientOnboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const total = STEPS.length;
  const current = STEPS[step - 1];
  const StepIcon = current.icon;

  return (
    <div className="onboard container">
      {/* Progress track */}
      <div className="onboard__track">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done    = s.id < step;
          const active  = s.id === step;
          return (
            <React.Fragment key={s.id}>
              <button
                className={`onboard__step-btn ${done ? 'done' : ''} ${active ? 'active' : ''}`}
                style={{ '--step-color': s.color } as React.CSSProperties}
                onClick={() => setStep(s.id)}
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

      {/* Mobile progress bar */}
      <div className="onboard__mobile-progress">
        <div className="onboard__mobile-bar">
          <div className="onboard__mobile-fill" style={{ width: `${((step) / total) * 100}%` }} />
        </div>
        <span>Passo {step} de {total}</span>
      </div>

      {/* Form Card */}
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
          {step === 1 && <StepPerfil />}
          {step === 2 && <StepCustos />}
          {step === 3 && <StepEndividamento />}
          {step === 4 && <StepPatrimonio />}
          {step === 5 && <StepSonhos />}
        </div>

        {/* Footer navigation */}
        <div className="onboard__footer">
          <button
            className="afic-btn afic-btn--ghost"
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
          >
            <ChevronLeft size={18} /> Voltar
          </button>

          <span className="onboard__pager">{step} / {total}</span>

          {step < total ? (
            <button
              className="afic-btn afic-btn--primary"
              onClick={() => setStep(s => Math.min(total, s + 1))}
            >
              Próximo <ChevronRight size={18} />
            </button>
          ) : (
            <button className="afic-btn afic-btn--primary" onClick={() => alert('Diagnóstico enviado com sucesso!')}>
              <Send size={16} /> Enviar ao Consultor
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Step Forms ── */

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div className="onboard__field">
    <label className="afic-label">{label}</label>
    {children}
    {hint && <span className="onboard__hint">{hint}</span>}
  </div>
);

const MoneyInput: React.FC<{ placeholder?: string }> = ({ placeholder = '0' }) => (
  <div className="onboard__money-wrap">
    <span className="onboard__money-prefix">R$</span>
    <input type="number" placeholder={placeholder} min="0" className="onboard__money-input" />
  </div>
);

const StepPerfil = () => (
  <div className="onboard__grid">
    <Field label="Nome Completo"><input type="text" placeholder="Ex: João da Silva" /></Field>
    <Field label="E-mail"><input type="email" placeholder="seuemail@exemplo.com" /></Field>
    <Field label="Renda Principal Líquida (mensal)" hint="Salário, pró-labore ou renda principal já descontado impostos">
      <MoneyInput />
    </Field>
    <Field label="Rendas Extras (média mensal)" hint="Freelances, aluguéis, comissões, etc.">
      <MoneyInput />
    </Field>
    <Field label="Dependentes financeiros" hint="Filhos, pais ou cônjuge que dependem da sua renda">
      <select><option>0</option><option>1</option><option>2</option><option>3</option><option>4+</option></select>
    </Field>
  </div>
);

const StepCustos = () => (
  <div className="onboard__grid">
    <Field label="Moradia (aluguel ou prestação)"><MoneyInput /></Field>
    <Field label="Alimentação (mercado + refeições)"><MoneyInput /></Field>
    <Field label="Saúde (plano + medicamentos)"><MoneyInput /></Field>
    <Field label="Transporte (combustível, uber, VT)"><MoneyInput /></Field>
    <Field label="Contas de Consumo (luz, água, internet, cel.)" hint="Some todas as contas básicas"><MoneyInput /></Field>
    <Field label="Lazer & Estilo de Vida" hint="Assinaturas, academia, delivery, entretenimento"><MoneyInput /></Field>
  </div>
);

const StepEndividamento = () => (
  <div className="onboard__grid">
    <Field label="Financiamento Imóvel (parcela/mês)"><MoneyInput /></Field>
    <Field label="Financiamento Veículo (parcela/mês)"><MoneyInput /></Field>
    <Field label="Empréstimos Pessoais (parcela/mês)"><MoneyInput /></Field>
    <Field label="Cartão de Crédito Rotativo / Fatura Mínima" hint="Caso esteja pagando apenas o mínimo"><MoneyInput /></Field>
    <Field label="Cheque Especial ou outras dívidas"><MoneyInput /></Field>
    <Field label="Observações sobre as dívidas" hint="Mencione taxas altas ou urgências">
      <textarea rows={3} placeholder="Ex: Cartão com 12% a.m., precisa ser quitado com prioridade..." />
    </Field>
  </div>
);

const StepPatrimonio = () => (
  <div className="onboard__grid">
    <Field label="Dinheiro em Conta Corrente / Poupança"><MoneyInput /></Field>
    <Field label="Tesouro Direto / CDB / Renda Fixa"><MoneyInput /></Field>
    <Field label="Ações / FIIs / Fundos de Investimento"><MoneyInput /></Field>
    <Field label="Imóveis quitados (valor estimado)" hint="Não incluir o que ainda está financiado"><MoneyInput /></Field>
    <Field label="Veículos quitados (valor de mercado)"><MoneyInput /></Field>
  </div>
);

const StepSonhos = () => (
  <div className="onboard__grid">
    <Field label="Objetivo de Curto Prazo (até 1 ano)" hint="O que você precisa resolver logo?">
      <input type="text" placeholder="Ex: Quitar o cartão de crédito" />
    </Field>
    <Field label="Valor necessário para esse objetivo"><MoneyInput /></Field>
    <Field label="Objetivo de Médio Prazo (1 a 5 anos)" hint="Seus próximos grandes projetos de vida">
      <input type="text" placeholder="Ex: Trocar de carro, fazer uma viagem" />
    </Field>
    <Field label="Valor necessário para esse objetivo"><MoneyInput /></Field>
    <Field label="Objetivo de Longo Prazo (5+ anos)" hint="Sua grande visão de futuro financeiro">
      <input type="text" placeholder="Ex: Aposentadoria antecipada, casa própria" />
    </Field>
    <Field label="O que te motivaria a manter a disciplina financeira?">
      <textarea rows={3} placeholder="Descreva com suas palavras o estilo de vida que você busca..." />
    </Field>
  </div>
);
