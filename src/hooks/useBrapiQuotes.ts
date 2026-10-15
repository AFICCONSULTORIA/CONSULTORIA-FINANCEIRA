import { useQuery } from '@tanstack/react-query';
import { fetchMultipleQuotes, type BrapiQuote } from '../lib/brapi';

export interface UseBrapiQuotesOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
}

export const brapiKeys = {
  all: ['brapi_quotes'] as const,
  list: (tickersKey: string) => [...brapiKeys.all, tickersKey] as const,
};

/**
 * Hook customizado com TanStack Query v5 para carregar e cachear cotações da B3.
 *
 * Benefícios:
 * - Desduplica requisições idênticas na mesma tela ou entre abas.
 * - staleTime de 3 minutos para respeitar a volatilidade do mercado sem onerar a API.
 * - gcTime de 15 minutos em memória.
 * - Fornece métodos utilitários `getPrice` e `getQuote` com fallback seguro.
 *
 * @example
 * const { getPrice, isLoading } = useBrapiQuotes(['ITUB4', 'BBAS3', 'TAEE11']);
 * const itubPrice = getPrice('ITUB4', 32.50);
 */
export function useBrapiQuotes(tickers: string[], options: UseBrapiQuotesOptions = {}) {
  const normalizedTickers = [...new Set(tickers.map((t) => t.trim().toUpperCase()))].filter(Boolean);
  const tickersKey = [...normalizedTickers].sort().join(',');

  const query = useQuery({
    queryKey: brapiKeys.list(tickersKey),
    enabled: options.enabled !== undefined ? options.enabled && normalizedTickers.length > 0 : normalizedTickers.length > 0,
    staleTime: 1000 * 60 * 3, // 3 minutos
    gcTime: 1000 * 60 * 15, // 15 minutos
    refetchInterval: options.refetchInterval ?? false,
    queryFn: async (): Promise<Record<string, BrapiQuote>> => {
      if (normalizedTickers.length === 0) return {};

      const list = await fetchMultipleQuotes(normalizedTickers);
      const map: Record<string, BrapiQuote> = {};

      for (const item of list) {
        if (item?.symbol) {
          map[item.symbol] = item;
        }
      }

      return map;
    },
  });

  const quotesMap = query.data ?? {};

  /**
   * Retorna o preço atual de mercado para um ticker específico.
   * Se a cotação ainda não carregou ou falhou, retorna o `fallbackPrice`.
   */
  const getPrice = (ticker: string, fallbackPrice = 0): number => {
    const symbol = ticker.trim().toUpperCase();
    const quote = quotesMap[symbol];
    if (quote && typeof quote.regularMarketPrice === 'number' && quote.regularMarketPrice > 0) {
      return quote.regularMarketPrice;
    }
    return fallbackPrice;
  };

  /**
   * Retorna o objeto de cotação completo (preço, variação percentual, nome).
   */
  const getQuote = (ticker: string): BrapiQuote | undefined => {
    return quotesMap[ticker.trim().toUpperCase()];
  };

  return {
    ...query,
    quotes: quotesMap,
    getPrice,
    getQuote,
  };
}
