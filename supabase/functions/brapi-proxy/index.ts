import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuoteItem {
  symbol: string;
  shortName: string;
  longName?: string;
  currency: string;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    // Token da Brapi configurado com segurança nas variáveis de ambiente do Supabase Secrets
    const brapiToken = Deno.env.get('BRAPI_TOKEN') || Deno.env.get('VITE_BRAPI_TOKEN') || '';

    let tickers: string[] = [];

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      tickers = Array.isArray(body.tickers) ? body.tickers : [];
    } else {
      const url = new URL(req.url);
      const tickersParam = url.searchParams.get('tickers');
      if (tickersParam) {
        tickers = tickersParam.split(',').map((t) => t.trim()).filter(Boolean);
      }
    }

    if (tickers.length === 0) {
      return new Response(JSON.stringify({ error: 'Nenhum ticker informado' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalizar para maiúsculas e remover duplicatas
    const normalizedTickers = [...new Set(tickers.map((t) => t.trim().toUpperCase()))];
    const results: Record<string, QuoteItem> = {};
    const tickersToFetch: string[] = [];

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verificar cache no banco PostgreSQL (validade padrão: 5 minutos)
    const cacheTtlMinutes = 5;
    const cacheThreshold = new Date(Date.now() - cacheTtlMinutes * 60 * 1000).toISOString();

    const { data: cachedRows } = await supabaseAdmin
      .from('stock_quotes_cache')
      .select('ticker, price, change_percent, short_name, updated_at')
      .in('ticker', normalizedTickers);

    if (cachedRows && cachedRows.length > 0) {
      for (const row of cachedRows) {
        const isFresh = Boolean(row.updated_at && row.updated_at > cacheThreshold);
        if (isFresh && Number(row.price) > 0) {
          results[row.ticker] = {
            symbol: row.ticker,
            shortName: row.short_name || row.ticker,
            currency: 'BRL',
            regularMarketPrice: Number(row.price),
            regularMarketChangePercent: Number(row.change_percent || 0),
          };
        } else {
          tickersToFetch.push(row.ticker);
        }
      }
    }

    // Identificar tickers solicitados que ainda não estão no cache
    for (const ticker of normalizedTickers) {
      if (!results[ticker] && !tickersToFetch.includes(ticker)) {
        tickersToFetch.push(ticker);
      }
    }

    // 2. Buscar da Brapi apenas os tickers faltantes ou expirados
    if (tickersToFetch.length > 0 && brapiToken) {
      const fetchPromises = tickersToFetch.map(async (ticker) => {
        try {
          const res = await fetch(`https://brapi.dev/api/quote/${encodeURIComponent(ticker)}?token=${brapiToken}`);
          if (!res.ok) return null;

          const json = await res.json();
          if (json.results && json.results.length > 0) {
            const q = json.results[0];
            return {
              ticker,
              price: Number(q.regularMarketPrice) || 0,
              change_percent: Number(q.regularMarketChangePercent) || 0,
              short_name: q.shortName || q.longName || ticker,
              raw_data: q,
              updated_at: new Date().toISOString(),
            };
          }
        } catch (fetchErr) {
          console.error(`Erro ao buscar ${ticker} na Brapi:`, fetchErr);
        }
        return null;
      });

      const fetchedResults = (await Promise.all(fetchPromises)).filter(Boolean);

      if (fetchedResults.length > 0) {
        // Atualizar cache em lote
        await supabaseAdmin
          .from('stock_quotes_cache')
          .upsert(fetchedResults, { onConflict: 'ticker' });

        for (const item of fetchedResults) {
          if (item) {
            results[item.ticker] = {
              symbol: item.ticker,
              shortName: item.short_name,
              currency: 'BRL',
              regularMarketPrice: item.price,
              regularMarketChangePercent: item.change_percent,
            };
          }
        }
      }
    }

    // 3. Fallback: se a Brapi falhou para algum ticker, utilizar cotação anterior armazenada no cache
    if (cachedRows) {
      for (const row of cachedRows) {
        if (!results[row.ticker] && Number(row.price) > 0) {
          results[row.ticker] = {
            symbol: row.ticker,
            shortName: row.short_name || row.ticker,
            currency: 'BRL',
            regularMarketPrice: Number(row.price),
            regularMarketChangePercent: Number(row.change_percent || 0),
          };
        }
      }
    }

    return new Response(JSON.stringify({ quotes: results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Erro na Edge Function brapi-proxy:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
