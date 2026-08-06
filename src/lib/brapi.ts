export interface BrapiQuote {
  symbol: string;
  shortName: string;
  longName: string;
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

export const fetchAssetQuote = async (ticker: string): Promise<BrapiQuote | null> => {
  if (!BRAPI_TOKEN) {
    console.warn('VITE_BRAPI_TOKEN is not defined.');
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}/${ticker.toUpperCase()}?token=${BRAPI_TOKEN}`);
    if (!response.ok) {
      return null;
    }
    
    const data: BrapiResponse = await response.json();
    if (data.error || !data.results || data.results.length === 0) {
      return null;
    }

    return data.results[0];
  } catch (error) {
    console.error('Error fetching from Brapi:', error);
    return null;
  }
};

export const fetchMultipleQuotes = async (tickers: string[]): Promise<BrapiQuote[]> => {
  if (!BRAPI_TOKEN || tickers.length === 0) {
    return [];
  }

  try {
    const tickersString = tickers.map(t => t.toUpperCase()).join(',');
    const response = await fetch(`${BASE_URL}/${tickersString}?token=${BRAPI_TOKEN}`);
    if (!response.ok) {
      return [];
    }
    
    const data: BrapiResponse = await response.json();
    if (data.error || !data.results) {
      return [];
    }

    return data.results;
  } catch (error) {
    console.error('Error fetching multiple quotes from Brapi:', error);
    return [];
  }
};
