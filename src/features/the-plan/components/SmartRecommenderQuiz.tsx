import React, { useState } from 'react';
import { 
  CheckCircle2, ArrowRight, RotateCcw, Award 
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface QuizAnswers {
  assetType: 'property' | 'vehicle' | null;
  urgency: 'immediate' | 'medium' | 'long' | null;
  capital: 'low' | 'medium' | 'high' | null;
  discipline: 'disciplined' | 'needs_bill' | 'irregular' | null;
}

export const SmartRecommenderQuiz: React.FC = () => {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<QuizAnswers>({
    assetType: null,
    urgency: null,
    capital: null,
    discipline: null
  });

  const handleSelect = (key: keyof QuizAnswers, value: any) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
    if (step < 4) {
      setStep(prev => prev + 1);
    } else {
      setStep(5); // Resultado
    }
  };

  const handleReset = () => {
    setStep(1);
    setAnswers({
      assetType: null,
      urgency: null,
      capital: null,
      discipline: null
    });
  };

  // Gerar recomendação com base nas respostas
  const getRecommendation = () => {
    const isProp = answers.assetType === 'property';

    // Cenário 1: Imediato sem muito capital
    if (answers.urgency === 'immediate') {
      if (isProp) {
        return {
          title: 'Financiamento com Estratégia de Quitação Acelerada',
          badge: 'Possibilidade Imediata com Defesa Financeira',
          description: 'Como você precisa da posse imediata e não pode esperar contemplação ou juntar o valor total, o financiamento é a única via viável para entrega da chave. No entanto, você NÃO deve seguir o plano de 30 anos do banco.',
          strategy: 'Contrate na Tabela SAC com a menor taxa de juros do mercado e aplique religiosamente o Hack da Amortização Extraordinária com redução de prazo (usando 13º, FGTS ou aportes mensais extras de R$ 300 a R$ 500) para quitar o imóvel em 6 a 8 anos.',
          alternative: 'Consórcio contemplado (compra de cota já contemplada com ágio seguro via consultoria).',
          avoid: 'Financiamento na Tabela Price sem plano de amortização acelerada (você pagará 3 imóveis ao banco).',
          checklist: [
            'Simular em pelo menos 3 bancos (Caixa, Itaú, Bradesco/Santander) buscando a menor taxa nominal.',
            'Reservar 5% do valor do imóvel além da entrada para custos de ITBI, escritura e registro.',
            'Programar amortizações extras no app do banco logo após a assinatura do contrato.'
          ]
        };
      } else {
        return {
          title: 'Carro por Assinatura ou Seminovo à Vista',
          badge: 'Solução Imediata Inteligente',
          description: 'Financiamento tradicional de carro (CDC) cobra de 20% a 30% de juros ao ano sobre um bem que desvaloriza rapidamente. Para uso imediato, há caminhos muito mais inteligentes.',
          strategy: 'Se precisa de carro zero km imediatamente, a Assinatura (aluguel anual com IPVA, seguro e manutenção inclusos) é financeiramente superior a um financiamento com juros. Se preferir ter o bem no seu nome, compre um seminovo de 2 a 3 anos com a entrada disponível.',
          alternative: 'Consórcio auto com lance alto (se tiver carro usado para dar de lance).',
          avoid: 'Financiar 100% ou 80% do veículo em 48x ou 60x via CDC tradicional.',
          checklist: [
            'Calcular a cotação da assinatura do modelo desejado vs. custo da parcela do CDC.',
            'Se optar por comprar, priorizar modelos seminovos com histórico comprovado de revisões.',
            'Cotar seguro antes de fechar qualquer negócio para não ter surpresas na apólice.'
          ]
        };
      }
    }

    // Cenário 2: Médio Prazo (6 meses a 2 anos) com capital para lance
    if (answers.urgency === 'medium') {
      return {
        title: 'Consórcio Estratégico com Lance Planejado',
        badge: 'Melhor Custo-Benefício do Mercado',
        description: 'Você possui uma janela de tempo perfeita. Entrar em um consórcio estruturado sem juros bancários cortará entre 50% e 70% do custo total em relação ao financiamento.',
        strategy: 'Adquira uma carta de crédito compatível com administradoras sólidas e autorizadas pelo Banco Central. Utilize a entrada disponível para ofertar um Lance Livre competitivo ou combine com Lance Embutido para antecipar a contemplação para os primeiros 6 a 12 meses.',
        alternative: 'Investir o valor da parcela no Tesouro Selic / CDB enquanto busca oportunidades de leilão ou compra à vista.',
        avoid: 'Entrar em consórcios de agências bancárias sem avaliar o histórico da média de lances vencedores do grupo.',
        checklist: [
          'Solicitar à consultoria o extrato das últimas 6 assembleias do grupo para verificar percentual do lance vencedor.',
          'Separar o valor de lance pretendido em aplicação de alta liquidez (CDB 100% CDI ou Tesouro Selic).',
          'Acompanhar as assembleias mensais para disparar o lance no momento estatisticamente mais favorável.'
        ]
      };
    }

    // Cenário 3: Longo Prazo (> 2 anos) ou Perfil Disciplinado
    if (answers.discipline === 'disciplined' || answers.urgency === 'long') {
      return {
        title: 'Acúmulo Estratégico & Compra à Vista com Desconto',
        badge: 'A Máxima Eficiência Financeira',
        description: 'Você tem a maior arma do capitalismo a seu favor: o tempo e os juros compostos trabalhando para você, em vez de você trabalhar para o banco.',
        strategy: 'Aplique a entrada e faça aportes mensais equivalentes à parcela em uma carteira de Renda Fixa e Renda Imobiliária (CDI / IPCA+). Ao atingir cerca de 90% do valor do bem, negocie a compra à vista com poder de barganha agressivo (desconto de 8% a 15% em dinheiro).',
        alternative: 'Consórcio de longo prazo pagando meia parcela até a contemplação.',
        avoid: 'Contratar financiamento por ansiedade antes de atingir o montante ideal.',
        checklist: [
          'Definir a meta exata de aporte mensal no módulo de "Metas e Sonhos" da AFIC.',
          'Configurar transferências automáticas no dia do recebimento do salário.',
          'Monitorar o mercado imobiliário/automotivo para identificar oportunidades com proprietários motivados a vender à vista.'
        ]
      };
    }

    // Padrão de segurança
    return {
      title: 'Consórcio Planejado com Compromisso Mensal',
      badge: 'Organização Financeira com Meta Definida',
      description: 'O consórcio funciona como uma "poupança forçada" inteligente: você tem o compromisso mensal do boleto para não gastar o dinheiro, mas sem a sangria dos juros bancários abusivos.',
      strategy: 'Escolha uma cota com parcela que caiba com folga no seu orçamento (máximo 25% da sua renda líquida) e planeje a contemplação por sorteio ou lance quando acumular recursos.',
      alternative: 'Alugar imóvel simples e aplicar via débito automático em previdência privada ou tesouro direto.',
      avoid: 'Entrar em dívidas longas de financiamento sem reserva de emergência formada.',
      checklist: [
        'Organizar o fluxo de caixa nos "Lançamentos" para garantir folga orçamentária.',
        'Manter reserva de emergência intocada antes de dar qualquer lance.',
        'Buscar orientação do seu consultor AFIC antes de assinar o contrato.'
      ]
    };
  };

  const rec = getRecommendation();

  return (
    <div className="quiz-card anim-fade-up">
      {/* Progresso */}
      <div className="quiz-steps-indicator">
        {[1, 2, 3, 4].map(s => (
          <div 
            key={s} 
            className={`quiz-step-dot ${step >= s ? 'quiz-step-dot--active' : ''}`} 
          />
        ))}
      </div>

      {step === 1 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
              Passo 1 de 4
            </span>
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            O que você planeja adquirir?
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Selecione o tipo de conquista que você quer estruturar financeiramente.
          </p>

          <div className="quiz-options-list">
            <button 
              type="button" 
              className={`quiz-option-btn ${answers.assetType === 'property' ? 'quiz-option-btn--selected' : ''}`}
              onClick={() => handleSelect('assetType', 'property')}
            >
              <span>🏠 Imóvel (Casa Própria, Apartamento ou Terreno)</span>
              <ArrowRight size={18} />
            </button>
            <button 
              type="button" 
              className={`quiz-option-btn ${answers.assetType === 'vehicle' ? 'quiz-option-btn--selected' : ''}`}
              onClick={() => handleSelect('assetType', 'vehicle')}
            >
              <span>🚗 Veículo (Carro do dia a dia, Familiar ou Utilitário)</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
              Passo 2 de 4
            </span>
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Qual é a sua urgência para ter a chave na mão?
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            O fator tempo é o que mais encarece ou barateia uma aquisição no Brasil.
          </p>

          <div className="quiz-options-list">
            <button 
              type="button" 
              className="quiz-option-btn"
              onClick={() => handleSelect('urgency', 'immediate')}
            >
              <div>
                <div style={{ fontWeight: 700 }}>Imediata (Preciso em até 90 dias)</div>
                <small style={{ color: 'var(--text-secondary)' }}>Mudança forçada, fim de contrato ou necessidade urgente</small>
              </div>
              <ArrowRight size={18} />
            </button>
            <button 
              type="button" 
              className="quiz-option-btn"
              onClick={() => handleSelect('urgency', 'medium')}
            >
              <div>
                <div style={{ fontWeight: 700 }}>Planejada (De 6 meses a 2 anos)</div>
                <small style={{ color: 'var(--text-secondary)' }}>Posso aguardar o momento ideal e preparar lances</small>
              </div>
              <ArrowRight size={18} />
            </button>
            <button 
              type="button" 
              className="quiz-option-btn"
              onClick={() => handleSelect('urgency', 'long')}
            >
              <div>
                <div style={{ fontWeight: 700 }}>Futura / Longo Prazo (Acima de 2 anos)</div>
                <small style={{ color: 'var(--text-secondary)' }}>Foco total em economia e máxima eficiência financeira</small>
              </div>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
              Passo 3 de 4
            </span>
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Quanto você já possui de capital para entrada ou lance?
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Inclua reservas financeiras, FGTS ou outro bem que será vendido/dado como parte do pagamento.
          </p>

          <div className="quiz-options-list">
            <button 
              type="button" 
              className="quiz-option-btn"
              onClick={() => handleSelect('capital', 'low')}
            >
              <div>
                <div style={{ fontWeight: 700 }}>Pouco ou nada (Menos de 15% do valor)</div>
                <small style={{ color: 'var(--text-secondary)' }}>Preciso de prazo longo ou parcelamento facilitado</small>
              </div>
              <ArrowRight size={18} />
            </button>
            <button 
              type="button" 
              className="quiz-option-btn"
              onClick={() => handleSelect('capital', 'medium')}
            >
              <div>
                <div style={{ fontWeight: 700 }}>Moderado (Entre 20% e 40% do valor)</div>
                <small style={{ color: 'var(--text-secondary)' }}>Entrada padrão de financiamento ou lance médio de consórcio</small>
              </div>
              <ArrowRight size={18} />
            </button>
            <button 
              type="button" 
              className="quiz-option-btn"
              onClick={() => handleSelect('capital', 'high')}
            >
              <div>
                <div style={{ fontWeight: 700 }}>Alto (Acima de 50% ou bem para troca)</div>
                <small style={{ color: 'var(--text-secondary)' }}>Forte poder de lance ou proximidade de compra à vista</small>
              </div>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
              Passo 4 de 4
            </span>
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Como é a sua disciplina para poupar e investir todo mês?
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Seja sincero com seus hábitos para encontrarmos a estratégia que realmente funciona para você.
          </p>

          <div className="quiz-options-list">
            <button 
              type="button" 
              className="quiz-option-btn"
              onClick={() => handleSelect('discipline', 'disciplined')}
            >
              <div>
                <div style={{ fontWeight: 700 }}>Alta Disciplina (Poupo e invisto todo mês)</div>
                <small style={{ color: 'var(--text-secondary)' }}>Não gasto o dinheiro poupado e controlo o orçamento</small>
              </div>
              <ArrowRight size={18} />
            </button>
            <button 
              type="button" 
              className="quiz-option-btn"
              onClick={() => handleSelect('discipline', 'needs_bill')}
            >
              <div>
                <div style={{ fontWeight: 700 }}>Preciso de compromisso ("Poupança Forçada")</div>
                <small style={{ color: 'var(--text-secondary)' }}>Se o dinheiro sobrar na conta eu acabo gastando com outras coisas</small>
              </div>
              <ArrowRight size={18} />
            </button>
            <button 
              type="button" 
              className="quiz-option-btn"
              onClick={() => handleSelect('discipline', 'irregular')}
            >
              <div>
                <div style={{ fontWeight: 700 }}>Renda variável / Oscilante</div>
                <small style={{ color: 'var(--text-secondary)' }}>Autônomo, empresário ou comissionado com meses fortes e fracos</small>
              </div>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Tela de Resultado */}
      {step === 5 && (
        <div>
          <div className="quiz-result-hero">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span className="plan-strategy-card__badge badge--success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Award size={14} /> Recomendação Principal AFIC
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Diagnóstico Personalizado</span>
            </div>

            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {rec.title}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
              {rec.description}
            </p>

            <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--r-lg)', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                🎯 Como Executar na Prática:
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {rec.strategy}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8125rem' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div style={{ fontWeight: 700, color: 'var(--brand-primary)', marginBottom: '0.2rem' }}>🥈 Alternativa Viável:</div>
                <div style={{ color: 'var(--text-secondary)' }}>{rec.alternative}</div>
              </div>

              <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: '0.2rem' }}>⚠️ Evite a Todo Custo:</div>
                <div style={{ color: 'var(--text-secondary)' }}>{rec.avoid}</div>
              </div>
            </div>
          </div>

          {/* Checklist de Ação */}
          <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--r-xl)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
            <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              📋 Seus Próximos Passos (Checklist de 30 Dias)
            </h4>
            <div className="quiz-checklist">
              {rec.checklist.map((item, i) => (
                <div key={i} className="quiz-checklist-item">
                  <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Button variant="outline" onClick={handleReset} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <RotateCcw size={16} /> Refazer Diagnóstico
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
