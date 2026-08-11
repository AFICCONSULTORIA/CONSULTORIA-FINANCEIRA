import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, Play, BookOpen, Award, CheckCircle2, 
  Search, Shield, ArrowRight,
  Lock, Wrench, Sparkles, ArrowLeft
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EducationCardModal, type EducationItem } from './components/EducationCardModal';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const ACADEMY_ITEMS: EducationItem[] = [
  // Vídeos Rápidos (Reels Style / Aulas Curtas)
  {
    id: 'vid-1',
    title: 'O que é a Estratégia dos Baldes?',
    category: 'Baldes',
    duration: '2:30 min',
    level: 'Iniciante',
    type: 'video',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder video embed
    summary: 'Entenda como a AFIC organiza seu patrimônio em baldes estratégicos (Custo Fixo, Conforto, Metas, Lazer e Investimentos) para proteger seu estilo de vida.',
    contentPoints: [
      'Separação clara entre dinheiro de gastos recorrentes e patrimônio de longo prazo',
      'Proteção psicológica contra volatilidade do mercado',
      'Matemática financeira aplicada à paz de espírito'
    ],
    keyTakeaway: 'Não existe investimento perfeito se o seu fluxo de caixa diário estiver desorganizado. Os baldes trazem clareza!'
  },
  {
    id: 'vid-2',
    title: 'Por que a Poupança faz você PERDER dinheiro?',
    category: 'Fundamentos',
    duration: '3:15 min',
    level: 'Iniciante',
    type: 'video',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    summary: 'A ilusão do rendimento fixo. Descubra como a inflação corroeu mais de 40% do poder de compra de quem deixou dinheiro parado na poupança.',
    contentPoints: [
      'Regra dos 70% do CDI na poupança',
      'Efeito silencioso do IPCA na perda de poder de compra',
      'Alternativas de liquidez diária com garantia do Tesouro Nacional'
    ],
    keyTakeaway: 'Deixar dinheiro na poupança não é ter segurança, é aceitar perder poder de compra todo mês.'
  },
  {
    id: 'vid-3',
    title: 'Como Funcionam os Dividendos Mensais dos FIIs?',
    category: 'FIIs',
    duration: '4:00 min',
    level: 'Intermediário',
    type: 'video',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    summary: 'Tudo sobre Fundos Imobiliários de Tijolo e Papel. Saiba como receber aluguéis pingando na conta sem ter que gerenciar imóveis.',
    contentPoints: [
      'Isenção de Imposto de Renda nos proventos mensais para pessoas físicas',
      'Diversificação em galpões logísticos AAA, shoppings e lajes corporativas',
      'Diferença entre FII de Tijolo (imóveis reais) e FII de Papel (títulos de crédito)'
    ],
    keyTakeaway: 'FIIs geram renda passiva previsível enquanto você mantém liquidez que um imóvel físico jamais ofereceria.'
  },
  {
    id: 'vid-4',
    title: 'Ações de Dividendos vs Ações de Crescimento',
    category: 'Ações',
    duration: '3:45 min',
    level: 'Intermediário',
    type: 'video',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    summary: 'Entenda os dois pilares da bolsa de valores: empresas maduras pagadoras de dividendos (Baldes) vs empresas de expansão.',
    contentPoints: [
      'Setores perenes (Bancos, Energia, Saneamento, Seguros e Telecom)',
      'Como reinvestir os dividendos acelera os juros compostos exponencialmente',
      'Garantia de margem de segurança ao comprar abaixo do preço teto'
    ],
    keyTakeaway: 'Investir em ações de dividendos é se tornar sócio das empresas mais lucravas do país.'
  },

  // Flashcards Explicativos Rápido
  {
    id: 'card-1',
    title: 'O que é a Taxa Selic e como ela afeta seu bolso?',
    category: 'Fundamentos',
    duration: '1 min leitura',
    level: 'Iniciante',
    type: 'card',
    summary: 'A Selic é a taxa básica de juros da economia brasileira, definida pelo Banco Central (COPOM). Ela guia todas as taxas de juros no país.',
    contentPoints: [
      'Selic Alta: Favorece investimentos em Renda Fixa (CDI, Tesouro Selic) e encarece empréstimos',
      'Selic Baixa: Estimula o consumo e força o investidor a buscar Renda Variável (FIIs e Ações)',
      'CDI roda sempre bem próximo da taxa Selic (ex: Selic 11.25% -> CDI ~11.15%)'
    ],
    keyTakeaway: 'Aproveite momentos de Selic alta para travar boas taxas de renda fixa e acumular liquidez!'
  },
  {
    id: 'card-2',
    title: 'O que significa P/L e P/VP nas ações?',
    category: 'Ações',
    duration: '1.5 min leitura',
    level: 'Intermediário',
    type: 'card',
    summary: 'Múltiplos de Valuation essenciais para não pagar caro em uma empresa ou fundo imobiliário.',
    contentPoints: [
      'P/L (Preço sobre Lucro): Quantos anos levaria para o investimento se pagar apenas pelos lucros da empresa',
      'P/VP (Preço sobre Valor Patrimonial): Mede se o ativo está sendo negociado acima (>1.0) ou abaixo (<1.0) do seu patrimônio real',
      'Em FIIs de tijolo, comprar com P/VP < 1.0 significa comprar imóveis com desconto!'
    ],
    keyTakeaway: 'Nunca compre uma ação apenas porque "subiu". Analise se o preço cobrado faz sentido comparado ao lucro.'
  },
  {
    id: 'card-3',
    title: 'Por que ter exposição Internacional (Dólar)?',
    category: 'Internacional',
    duration: '2 min leitura',
    level: 'Intermediário',
    type: 'card',
    summary: 'O Brasil representa menos de 2% do mercado de capitais global. Diversificar em dólar protege seu poder de compra contra crises locais.',
    contentPoints: [
      'Acesso às maiores inovações tecnológicas do planeta (Apple, Microsoft, Nvidia, Google)',
      'Proteção cambial automática: o dólar tende a valorizar em momentos de incerteza global',
      'Investimento simplificado através de ETFs negociados na B3 (ex: IVVB11, WRLD11)'
    ],
    keyTakeaway: 'Seus custos indiretos (tecnologia, viagens, combustível) são em dólar. Seu patrimônio também deve ser.'
  },
  {
    id: 'card-4',
    title: 'Entendendo a Marcação a Mercado no Tesouro Direto',
    category: 'Renda Fixa',
    duration: '2 min leitura',
    level: 'Avançado',
    type: 'card',
    summary: 'Descubra por que o saldo do seu título de renda fixa às vezes flutua diariamente antes do vencimento.',
    contentPoints: [
      'Se você carregar o título até o vencimento, receberá EXATAMENTE a taxa contratada no dia da compra',
      'Se resgatar antes do prazo, o título é precificado pelo valor de mercado atual',
      'Queda nas taxas futuras valoriza o título prefixado/IPCA+ antecipadamente (ganho de capital)'
    ],
    keyTakeaway: 'Marcação a mercado não é prejuízo real se você mantiver a estratégia até o vencimento estipulado.'
  }
];

export const AcademyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<EducationItem | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  
  // Progress tracking in LocalStorage
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('afic_academy_completed');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('afic_academy_completed', JSON.stringify(completedIds));
  }, [completedIds]);

  const handleToggleComplete = (id: string) => {
    setCompletedIds(prev => {
      const isAlready = prev.includes(id);
      const updated = isAlready ? prev.filter(item => item !== id) : [...prev, id];
      toast.success(isAlready ? 'Removido dos concluídos' : '🎉 Parabéns! Aula marcada como concluída!');
      return updated;
    });
  };

  const categories = ['Todos', 'Fundamentos', 'Baldes', 'Renda Fixa', 'FIIs', 'Ações', 'Internacional'];

  const filteredItems = ACADEMY_ITEMS.filter(item => {
    const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const progressPercent = Math.round((completedIds.length / ACADEMY_ITEMS.length) * 100);

  // If user is client and not viewing preview, show Under Construction Screen
  if (role === 'client' && !showPreview) {
    return (
      <div style={{ maxWidth: '800px', margin: '3rem auto 6rem', padding: '0 1.5rem' }}>
        <Card className="anim-fade-up" style={{ 
          padding: '3.5rem 2rem', 
          textAlign: 'center', 
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.9))',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: 'var(--r-lg)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background Glow */}
          <div style={{ 
            position: 'absolute', 
            top: '-50px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            width: '200px', 
            height: '200px', 
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, rgba(0, 0, 0, 0) 70%)', 
            pointerEvents: 'none' 
          }} />

          {/* Icon Badge */}
          <div style={{ 
            width: '80px', 
            height: '80px', 
            margin: '0 auto 1.5rem', 
            borderRadius: '50%', 
            background: 'rgba(139, 92, 246, 0.15)', 
            border: '2px solid rgba(139, 92, 246, 0.4)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#8B5CF6',
            boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)'
          }}>
            <Lock size={38} />
          </div>

          <span className="afic-badge afic-badge--warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <Wrench size={14} /> EM CONSTRUÇÃO
          </span>

          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '1rem', lineHeight: 1.2 }}>
            Academia <span className="gradient-text">AFIC</span> 🔒
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto 2rem' }}>
            Estamos preparando uma experiência completa de educação financeira para você. Em breve, você terá acesso a aulas exclusivas em vídeo, trilhas de conhecimento e pílulas práticas para investir com total clareza.
          </p>

          {/* Upcoming features preview list */}
          <div style={{ 
            background: 'var(--bg-input)', 
            padding: '1.5rem', 
            borderRadius: 'var(--r-md)', 
            border: '1px solid var(--border-color)',
            maxWidth: '520px', 
            margin: '0 auto 2.5rem',
            textAlign: 'left'
          }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={16} color="var(--brand-primary)" /> O que vem por aí:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Play size={16} color="#8B5CF6" /> Aulas Curtas em Vídeo
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={16} color="#06B6D4" /> Flashcards Explicativos
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={16} color="var(--success)" /> Guia Prático dos Baldes
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={16} color="var(--warning)" /> Gamificação & Níveis
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={() => navigate('/client')}>
              <ArrowLeft size={18} /> Voltar ao Meu Painel
            </Button>
            
            {/* Direct preview toggle */}
            <Button variant="outline" onClick={() => setShowPreview(true)}>
              Visualizar Demonstração
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem 6rem' }}>
      
      {/* Header Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(139, 92, 246, 0.2))', 
        borderRadius: 'var(--r-lg)', 
        padding: '2rem', 
        border: '1px solid rgba(6, 182, 212, 0.3)',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ maxWidth: '600px' }}>
            <span className="afic-badge afic-badge--info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <GraduationCap size={16} /> ACADEMIA AFIC DE EDUCAÇÃO FINANCIAL
            </span>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: 1.2 }}>
              Aprenda o <span className="gradient-text">Porquê</span> de Cada Investimento
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Aulas diretas ao ponto e pílulas explicativas para você dominar sua estratégia financeira e investir com total clareza e segurança.
            </p>
          </div>

          {/* User Progress Widget */}
          <div style={{ 
            background: 'var(--bg-card)', 
            padding: '1.25rem 1.5rem', 
            borderRadius: 'var(--r-md)', 
            border: '1px solid var(--border-color)',
            minWidth: '240px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Award size={18} color="var(--brand-primary)" /> Mente Investidora
              </span>
              <strong style={{ fontSize: '1rem', color: 'var(--brand-primary)' }}>{progressPercent}%</strong>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--brand-primary), #8B5CF6)', transition: 'width 0.4s ease' }} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              {completedIds.length} de {ACADEMY_ITEMS.length} conteúdos concluídos
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        {/* Categories */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem', maxWidth: '100%' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`afic-tab-btn ${selectedCategory === cat ? 'afic-tab-btn--active' : ''}`}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border-color)',
                background: selectedCategory === cat ? 'var(--brand-primary)' : 'var(--bg-card)',
                color: selectedCategory === cat ? '#fff' : 'var(--text-secondary)',
                fontWeight: selectedCategory === cat ? 600 : 400,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', minWidth: '220px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar aula ou conceito..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="afic-input"
            style={{ paddingLeft: '2.5rem', fontSize: '0.875rem' }}
          />
        </div>
      </div>

      {/* Video Pills Section (Shorts/Reels style) */}
      {(selectedCategory === 'Todos' || filteredItems.some(i => i.type === 'video')) && (
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Play size={20} color="var(--brand-primary)" fill="var(--brand-primary)" /> Aulas em Vídeo Rápidas
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Assista em menos de 5 min</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.25rem' }}>
            {filteredItems.filter(i => i.type === 'video').map(item => {
              const isDone = completedIds.includes(item.id);
              return (
                <Card 
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  style={{ 
                    cursor: 'pointer', 
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    border: isDone ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)'
                  }}
                  className="anim-fade-up"
                >
                  <div style={{ 
                    height: '140px', 
                    background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '50%', 
                      background: 'rgba(6, 182, 212, 0.9)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(6, 182, 212, 0.4)'
                    }}>
                      <Play size={22} color="#fff" fill="#fff" style={{ marginLeft: '3px' }} />
                    </div>
                    {isDone && (
                      <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'var(--success)', color: '#fff', borderRadius: '50%', padding: '0.2rem' }}>
                        <CheckCircle2 size={18} />
                      </div>
                    )}
                    <span style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {item.duration}
                    </span>
                  </div>

                  <div style={{ padding: '1rem' }}>
                    <span className="afic-badge afic-badge--info" style={{ fontSize: '0.65rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                      {item.category}
                    </span>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '0.5rem' }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
                      {item.summary}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Explanatory Concept Cards */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={20} color="var(--brand-primary)" /> Flashcards Explicativos & Guias Práticos
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Leitura em 1 minuto</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filteredItems.filter(i => i.type === 'card').map(item => {
            const isDone = completedIds.includes(item.id);
            return (
              <Card 
                key={item.id}
                onClick={() => setSelectedItem(item)}
                style={{ 
                  cursor: 'pointer', 
                  padding: '1.25rem',
                  transition: 'all 0.2s ease',
                  border: isDone ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                className="anim-fade-up"
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span className="afic-badge afic-badge--warning" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                      {item.category}
                    </span>
                    {isDone ? (
                      <span style={{ color: 'var(--success)', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle2 size={14} /> Lido
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{item.duration}</span>
                    )}
                  </div>

                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '0.5rem' }}>
                    {item.title}
                  </h4>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                    {item.summary}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--brand-primary)', fontWeight: 600, fontSize: '0.85rem', marginTop: 'auto' }}>
                  <span>Abrir guia completo</span> <ArrowRight size={14} />
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Modal Popup */}
      <EducationCardModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onMarkCompleted={handleToggleComplete}
        isCompleted={selectedItem ? completedIds.includes(selectedItem.id) : false}
      />
    </div>
  );
};
