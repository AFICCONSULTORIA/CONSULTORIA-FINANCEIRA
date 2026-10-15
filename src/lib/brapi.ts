import { supabase } from './supabase';

export interface BrapiQuote {
  symbol: string;
  shortName: string;
  longName?: string;
  currency: string;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
}

export interface BrapiResponse {
  results?: BrapiQuote[];
  error?: boolean;
  message?: string;
}

const BRAPI_TOKEN = import.meta.env.VITE_BRAPI_TOKEN;
const BASE_URL = 'https://brapi.dev/api/quote';

// Cache em memória de curta duração para evitar requisições idênticas simultâneas no client
const memoryQuoteCache = new Map<string, { quote: BrapiQuote; timestamp: number }>();
const CLIENT_CACHE_TTL_MS = 1000 * 60 * 3; // 3 minutos

/**
 * Busca cotações de múltiplos ativos com estratégia de resiliência multicamadas:
 * 1. Verifica cache local em memória (3 minutos)
 * 2. Invoca a Supabase Edge Function 'brapi-proxy' (com cache no PostgreSQL)
 * 3. Fallback para leitura direta da tabela 'stock_quotes_cache' do Supabase
 * 4. Fallback final para chamada direta à API da Brapi (caso VITE_BRAPI_TOKEN esteja definido localmente)
 */
export const fetchMultipleQuotes = async (tickers: string[]): Promise<BrapiQuote[]> => {
  if (!tickers || tickers.length === 0) return [];

  const normalized = [...new Set(tickers.map((t) => t.trim().toUpperCase()))].filter(Boolean);
  const now = Date.now();
  const missingTickers: string[] = [];
  const resolvedQuotes: BrapiQuote[] = [];

  // 1. Verificar cache local em memória
  for (const ticker of normalized) {
    const cached = memoryQuoteCache.get(ticker);
    if (cached && now - cached.timestamp < CLIENT_CACHE_TTL_MS) {
      resolvedQuotes.push(cached.quote);
    } else {
      missingTickers.push(ticker);
    }
  }

  if (missingTickers.length === 0) {
    return resolvedQuotes;
  }

  // 2. Tentar via Supabase Edge Function 'brapi-proxy'
  try {
    const { data, error } = await supabase.functions.invoke('brapi-proxy', {
      body: { tickers: missingTickers },
    });

    if (!error && data?.quotes && typeof data.quotes === 'object') {
      const edgeQuotes = Object.values(data.quotes) as BrapiQuote[];
      for (const q of edgeQuotes) {
        if (q?.symbol && typeof q.regularMarketPrice === 'number') {
          memoryQuoteCache.set(q.symbol, { quote: q, timestamp: now });
          resolvedQuotes.push(q);
        }
      }

      // Se todos os ativos foram resolvidos pela Edge Function, retorna
      if (resolvedQuotes.length >= normalized.length) {
        return resolvedQuotes;
      }
    }
  } catch (edgeErr) {
    console.warn('Edge Function brapi-proxy indisponível, acionando fallback:', edgeErr);
  }

  // 3. Fallback: Ler diretamente da tabela de cache no PostgreSQL
  try {
    const remainingMissing = normalized.filter((t) => !resolvedQuotes.some((r) => r.symbol === t));
    if (remainingMissing.length > 0) {
      const { data: dbRows } = await supabase
        .from('stock_quotes_cache')
        .select('ticker, price, change_percent, short_name')
        .in('ticker', remainingMissing);

      if (dbRows && dbRows.length > 0) {
        for (const row of dbRows) {
          if (Number(row.price) > 0) {
            const fallbackQuote: BrapiQuote = {
              symbol: row.ticker,
              shortName: row.short_name || row.ticker,
              currency: 'BRL',
              regularMarketPrice: Number(row.price),
              regularMarketChangePercent: Number(row.change_percent || 0),
            };
            memoryQuoteCache.set(row.ticker, { quote: fallbackQuote, timestamp: now });
            resolvedQuotes.push(fallbackQuote);
          }
        }
      }
    }
  } catch (dbErr) {
    console.warn('Falha ao ler cache no PostgreSQL:', dbErr);
  }

  // 4. Fallback final: Chamada direta à Brapi se token client estiver presente
  const stillMissing = normalized.filter((t) => !resolvedQuotes.some((r) => r.symbol === t));
  if (stillMissing.length > 0 && BRAPI_TOKEN) {
    const directPromises = stillMissing.map(async (ticker) => {
      try {
        const response = await fetch(`${BASE_URL}/${encodeURIComponent(ticker)}?token=${BRAPI_TOKEN}`);
        if (!response.ok) return null;
        const data: BrapiResponse = await response.json();
        if (!data.results || data.results.length === 0) return null;

        const q = data.results[0];
        const quoteObj: BrapiQuote = {
          symbol: ticker,
          shortName: q.shortName || ticker,
          longName: q.longName,
          currency: q.currency || 'BRL',
          regularMarketPrice: q.regularMarketPrice || 0,
          regularMarketChangePercent: q.regularMarketChangePercent || 0,
        };
        memoryQuoteCache.set(ticker, { quote: quoteObj, timestamp: now });
        return quoteObj;
      } catch (directErr) {
        console.error(`Erro ao buscar cotação direta de ${ticker}:`, directErr);
        return null;
      }
    });

    const directResults = (await Promise.all(directPromises)).filter((q): q is BrapiQuote => q !== null);
    resolvedQuotes.push(...directResults);
  }

  return resolvedQuotes;
};

/**
 * Busca cotação de um único ativo com cache e fallback
 */
export const fetchAssetQuote = async (ticker: string): Promise<BrapiQuote | null> => {
  if (!ticker) return null;
  const quotes = await fetchMultipleQuotes([ticker]);
  return quotes[0] || null;
};
