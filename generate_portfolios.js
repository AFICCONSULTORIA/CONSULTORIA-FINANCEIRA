const fs = require('fs');
const path = require('path');

const newProfiles = `export const RECOMMENDED_PROFILES: PortfolioProfile[] = [
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
      { id: 'c9', ticker: 'BBAS3', name: 'Banco do Brasil', category: 'Ações', currentPrice: 28.50, maxPrice: 32.00, dy: 11.0, plPvP: '4.5x P/L', targetWeight: 10, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Banco sólido da estratégia BESST, com resultados consistentes e dividend yield excelente.', highlights: ['Valuation Atrativo', 'Dividendos', 'Forte no Agro'] },
      { id: 'c10', ticker: 'TAEE11', name: 'Transmissora Aliança', category: 'Ações', currentPrice: 35.80, maxPrice: 40.00, dy: 10.2, plPvP: '1.8x P/VP', targetWeight: 10, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Setor elétrico altamente defensivo (estratégia BESST). Contratos longos atrelados à inflação.', highlights: ['Receita Previsível', 'Defensiva', 'Dividendos Constantes'] }
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
      { id: 'm7', ticker: 'ITUB4', name: 'Itaú Unibanco S.A.', category: 'Ações', currentPrice: 32.40, maxPrice: 38.00, dy: 6.8, plPvP: '8.2x P/L', targetWeight: 10, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Maior banco privado, ROE elevado e consistência. Pilar (Bancos) do BESST.', highlights: ['ROE > 20%', 'Líder Financeiro', 'Bancos'] },
      { id: 'm8', ticker: 'TAEE11', name: 'Transmissora Aliança', category: 'Ações', currentPrice: 35.80, maxPrice: 40.00, dy: 10.2, plPvP: '1.8x P/VP', targetWeight: 10, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Atua na transmissão de energia. Receitas previsíveis e alta distribuição. Pilar (Energia) BESST.', highlights: ['Energia Elétrica', 'Receita Estável', 'Defensiva'] },
      { id: 'm9', ticker: 'BBSE3', name: 'BB Seguridade', category: 'Ações', currentPrice: 33.20, maxPrice: 38.00, dy: 9.5, plPvP: '8.5x P/L', targetWeight: 10, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Negócio asset-light de altíssima geração de caixa. Pilar (Seguros) do BESST.', highlights: ['Seguros', 'Alta Geração Caixa', 'Asset Light'] },
      { id: 'm10', ticker: 'VIVT3', name: 'Telefônica (Vivo)', category: 'Ações', currentPrice: 52.40, maxPrice: 60.00, dy: 7.8, plPvP: '13.0x P/L', targetWeight: 10, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Líder de telecom com forte infraestrutura de fibra. Pilar (Telecom) do BESST.', highlights: ['Telecomunicações', 'Liderança', 'Fibra'] },
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
    description: 'Foco total em valorização de capital no longo prazo com Ações BESST, Crescimento e ativos globais/cripto.',
    assets: [
      { id: 'a1', ticker: 'TESOURO IPCA+ 2045', name: 'Tesouro IPCA+ Longo', category: 'Renda Fixa', currentPrice: 1200.00, maxPrice: 0, dy: 6.5, plPvP: 'IPCA + 6.5%', targetWeight: 5, riskLevel: 'Alto', status: 'COMPRAR', thesis: 'Marcação a mercado forte em cenários de queda de juros com carrego alto.', highlights: ['Marcação a Mercado', 'Longo Prazo', 'Ganho Real'] },
      { id: 'a2', ticker: 'DEB VALE', name: 'Debênture Vale IPCA+', category: 'Renda Fixa', currentPrice: 1000.00, maxPrice: 0, dy: 6.0, plPvP: 'IPCA + 6.0%', targetWeight: 5, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Crédito premium de gigante corporativa, proteção inflacionária isenta de IR.', highlights: ['Isento de IR', 'Crédito Premium', 'Proteção'] },
      { id: 'a3', ticker: 'ALZR11', name: 'Alianza Trust Renda', category: 'FIIs', currentPrice: 112.00, maxPrice: 118.00, dy: 9.1, plPvP: '1.02x P/VP', targetWeight: 5, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Fundo atípico com contratos longos (10+ anos) e reajuste garantido por inflação.', highlights: ['Contratos Atípicos', 'Inquilinos Fortes', 'Proteção'] },
      { id: 'a4', ticker: 'KNIP11', name: 'Kinea Índices de Preços', category: 'FIIs', currentPrice: 94.50, maxPrice: 100.00, dy: 11.5, plPvP: '0.96x P/VP', targetWeight: 5, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Fundo de CRIs atrelados à inflação (IPCA), excelente para manutenção do poder de compra.', highlights: ['Proteção Inflação', 'Gestão Kinea', 'Desconto'] },
      { id: 'a5', ticker: 'BBAS3', name: 'Banco do Brasil', category: 'Ações', currentPrice: 28.50, maxPrice: 32.00, dy: 11.0, plPvP: '4.5x P/L', targetWeight: 7, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Pilar Bancos (BESST). Valuation descontado com dividend yield duplo dígito.', highlights: ['Bancos', 'Dividendos', 'Desconto'] },
      { id: 'a6', ticker: 'EGIE3', name: 'Engie Brasil', category: 'Ações', currentPrice: 42.10, maxPrice: 48.00, dy: 8.5, plPvP: '12.0x P/L', targetWeight: 7, riskLevel: 'Baixo', status: 'COMPRAR', thesis: 'Pilar Energia (BESST). Matriz 100% renovável e forte capacidade de execução de novos projetos.', highlights: ['Energia Renovável', 'Execução', 'ESG'] },
      { id: 'a7', ticker: 'BBSE3', name: 'BB Seguridade', category: 'Ações', currentPrice: 33.20, maxPrice: 38.00, dy: 9.5, plPvP: '8.5x P/L', targetWeight: 7, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Pilar Seguros (BESST). Crescimento em prêmios e sinistralidade controlada.', highlights: ['Seguros', 'Rentabilidade', 'Sem CAPEX'] },
      { id: 'a8', ticker: 'SAPR4', name: 'Sanepar', category: 'Ações', currentPrice: 5.60, maxPrice: 6.50, dy: 6.5, plPvP: '0.7x P/VP', targetWeight: 7, riskLevel: 'Alto', status: 'COMPRAR', thesis: 'Pilar Saneamento (BESST). Monopólio natural descontado com novo marco do saneamento.', highlights: ['Saneamento', 'Desconto P/VP', 'Monopólio'] },
      { id: 'a9', ticker: 'VIVT3', name: 'Telefônica (Vivo)', category: 'Ações', currentPrice: 52.40, maxPrice: 60.00, dy: 7.8, plPvP: '13.0x P/L', targetWeight: 7, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Pilar Telecom (BESST). Expansão acelerada de fibra e controle de custos operacionais.', highlights: ['Telecom', 'Fibra Óptica', 'Liderança'] },
      { id: 'a10', ticker: 'WEGE3', name: 'WEG S.A.', category: 'Ações', currentPrice: 42.50, maxPrice: 52.00, dy: 2.4, plPvP: '28.5x P/L', targetWeight: 5, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Ação de crescimento secular, líder global em motores elétricos, beneficiada por dólar.', highlights: ['Crescimento', 'Global', 'Tecnologia'] },
      { id: 'a11', ticker: 'RENT3', name: 'Localiza', category: 'Ações', currentPrice: 50.10, maxPrice: 65.00, dy: 2.1, plPvP: '18.0x P/L', targetWeight: 5, riskLevel: 'Alto', status: 'COMPRAR', thesis: 'Liderança absoluta em mobilidade e aluguel de carros, escala traz vantagem competitiva intransponível.', highlights: ['Mobilidade', 'Escala Absoluta', 'Crescimento'] },
      { id: 'a12', ticker: 'PRIO3', name: 'PetroRio', category: 'Ações', currentPrice: 45.20, maxPrice: 55.00, dy: 0, plPvP: '8.0x P/L', targetWeight: 5, riskLevel: 'Alto', status: 'COMPRAR', thesis: 'Produtora independente de petróleo mais eficiente do mundo (lifting cost muito baixo).', highlights: ['Eficiência Extrema', 'O&G', 'Crescimento'] },
      { id: 'a13', ticker: 'IVVB11', name: 'iShares S&P 500 ETF', category: 'Internacional', currentPrice: 298.50, maxPrice: 320.00, dy: 1.4, plPvP: '22.4x P/L', targetWeight: 10, riskLevel: 'Médio', status: 'COMPRAR', thesis: 'Exposição direta aos líderes globais de inovação e tecnologia do S&P 500.', highlights: ['Dólar', 'EUA', 'Líderes de Mercado'] },
      { id: 'a14', ticker: 'NASD11', name: 'Nasdaq 100 ETF', category: 'Internacional', currentPrice: 12.50, maxPrice: 15.00, dy: 0.5, plPvP: '28.0x P/L', targetWeight: 5, riskLevel: 'Alto', status: 'COMPRAR', thesis: 'Focado em tecnologia extrema, engloba Inteligência Artificial e Semiconductors.', highlights: ['Tech Pura', 'Nasdaq', 'Inteligência Artificial'] },
      { id: 'a15', ticker: 'HASH11', name: 'Hashdex Nasdaq Crypto', category: 'Cripto', currentPrice: 48.00, maxPrice: 65.00, dy: 0, plPvP: 'N/A', targetWeight: 10, riskLevel: 'Alto', status: 'COMPRAR', thesis: 'Diversificação inteligente em criptomoedas com custódia regulada via ETF B3.', highlights: ['Criptomoedas', 'Regulação B3', 'Reserva de Valor'] }
    ]
  }
];
`;

const filePath = path.join(__dirname, 'src', 'features', 'portfolio', 'RecommendedPortfolio.tsx');
let fileContent = fs.readFileSync(filePath, 'utf8');

const regex = /export const RECOMMENDED_PROFILES: PortfolioProfile\[\] = \[[\s\S]*?\];/m;

if (regex.test(fileContent)) {
  fileContent = fileContent.replace(regex, newProfiles);
  fs.writeFileSync(filePath, fileContent, 'utf8');
  console.log('Successfully updated RECOMMENDED_PROFILES');
} else {
  console.log('Regex did not match RECOMMENDED_PROFILES block.');
}
