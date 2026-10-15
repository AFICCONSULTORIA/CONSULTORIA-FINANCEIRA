import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

export interface ProactiveAlert {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  type: 'imbalance' | 'inactivity' | 'fixed_costs_overrun';
  severity: 'high' | 'medium';
  title: string;
  description: string;
  metric: string;
  suggestedAction: string;
  whatsappMessage?: string;
}

export interface ClientDataForAlerts {
  id: string;
  full_name: string;
  phone?: string;
  created_at: string;
  financial_profiles?: any;
}

/**
 * Hook com TanStack Query v5 para avaliar regras de negócio e gerar alertas proativos
 * para a carteira de clientes do consultor.
 */
export function useConsultantAlerts(clients: ClientDataForAlerts[]) {
  const clientIds = clients.map((c) => c.id).filter(Boolean);

  const query = useQuery({
    queryKey: ['consultant_proactive_alerts', clientIds.sort().join(',')],
    enabled: clientIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
    gcTime: 1000 * 60 * 20, // 20 minutos
    queryFn: async (): Promise<ProactiveAlert[]> => {
      if (clientIds.length === 0) return [];

      // Buscar portfólio e transações em lote paralelo
      const [portfolioRes, transactionsRes] = await Promise.all([
        supabase
          .from('client_portfolio')
          .select('user_id, ticker, quantity, average_price, target_weight')
          .in('user_id', clientIds),
        supabase
          .from('transactions')
          .select('user_id, date')
          .in('user_id', clientIds)
          .order('date', { ascending: false }),
      ]);

      const alerts: ProactiveAlert[] = [];
      const now = Date.now();

      // Mapear transações mais recentes por cliente
      const latestTxMap: Record<string, string> = {};
      if (transactionsRes.data) {
        for (const tx of transactionsRes.data) {
          if (!latestTxMap[tx.user_id] || tx.date > latestTxMap[tx.user_id]) {
            latestTxMap[tx.user_id] = tx.date;
          }
        }
      }

      // Mapear portfólio por cliente
      const portfolioMap: Record<string, any[]> = {};
      if (portfolioRes.data) {
        for (const item of portfolioRes.data) {
          if (!portfolioMap[item.user_id]) {
            portfolioMap[item.user_id] = [];
          }
          portfolioMap[item.user_id].push(item);
        }
      }

      // Iterar sobre cada cliente e aplicar as 3 regras proativas
      for (const client of clients) {
        const rawProfile = Array.isArray(client.financial_profiles)
          ? client.financial_profiles[0]
          : client.financial_profiles;

        const monthlyIncome = Number(rawProfile?.monthly_income || 0);
        const fixedCosts = Number(rawProfile?.fixed_costs || 0);
        const buckets = Array.isArray(rawProfile?.buckets) ? rawProfile.buckets : [];

        // ──────────────────────────────────────────────────────────
        // REGRA 1: Estouro de Orçamento no Balde de Custos Fixos
        // ──────────────────────────────────────────────────────────
        if (monthlyIncome > 0 && fixedCosts > 0) {
          const fixedBucket = buckets.find((b: any) => b.type === 'fixed');
          const maxAllowedPct = Number(fixedBucket?.percentage || 50);
          const currentFixedPct = (fixedCosts / monthlyIncome) * 100;

          if (currentFixedPct > maxAllowedPct) {
            const difference = currentFixedPct - maxAllowedPct;
            const isHigh = difference >= 15;

            alerts.push({
              id: `alert-fixed-${client.id}`,
              clientId: client.id,
              clientName: client.full_name,
              clientPhone: client.phone,
              type: 'fixed_costs_overrun',
              severity: isHigh ? 'high' : 'medium',
              title: `Estouro no Balde de Custos Fixos (${currentFixedPct.toFixed(0)}%)`,
              description: `Custos fixos de R$ ${fixedCosts.toLocaleString('pt-BR')} consom ${currentFixedPct.toFixed(0)}% da renda (teto planejado: ${maxAllowedPct}%).`,
              metric: `+${difference.toFixed(0)}% acima do teto`,
              suggestedAction: 'Revisar despesas recorrentes e ajustar percentuais de baldes.',
              whatsappMessage: `Olá ${client.full_name}! Ao analisar seu planejamento no AFIC, notei que seus custos fixos estão consumindo ${currentFixedPct.toFixed(0)}% da sua renda (teto ideal: ${maxAllowedPct}%). Que tal agendarmos uma rápida revisão de gastos?`,
            });
          }
        }

        // ──────────────────────────────────────────────────────────
        // REGRA 2: Inatividade de Lançamentos (>15 dias sem transações)
        // ──────────────────────────────────────────────────────────
        const lastTxDateStr = latestTxMap[client.id] || client.created_at;
        const lastTxTimestamp = new Date(lastTxDateStr).getTime();
        const daysSinceLastTx = Math.floor((now - lastTxTimestamp) / (1000 * 60 * 60 * 24));

        if (daysSinceLastTx >= 15) {
          const isHigh = daysSinceLastTx >= 30;

          alerts.push({
            id: `alert-inactive-${client.id}`,
            clientId: client.id,
            clientName: client.full_name,
            clientPhone: client.phone,
            type: 'inactivity',
            severity: isHigh ? 'high' : 'medium',
            title: `Inatividade de Registros (${daysSinceLastTx} dias)`,
            description: `Cliente não registra movimentações financeiras há ${daysSinceLastTx} dias consecutivos.`,
            metric: `${daysSinceLastTx} dias sem lançamentos`,
            suggestedAction: 'Solicitar envio do extrato bancário (OFX) ou lançamento rápido.',
            whatsappMessage: `Olá ${client.full_name}! Para manter seu diagnóstico 100% atualizado no AFIC, não esqueça de subir seu extrato bancário recente (OFX) na plataforma. Qualquer dúvida estou por aqui!`,
          });
        }

        // ──────────────────────────────────────────────────────────
        // REGRA 3: Desbalanceamento de Carteira (>10% de target_weight)
        // ──────────────────────────────────────────────────────────
        const assets = portfolioMap[client.id] || [];
        if (assets.length > 0) {
          const totalPortfolioVal = assets.reduce(
            (acc, a) => acc + (Number(a.quantity) || 0) * (Number(a.average_price) || 0),
            0
          );

          if (totalPortfolioVal > 0) {
            for (const asset of assets) {
              const assetVal = (Number(asset.quantity) || 0) * (Number(asset.average_price) || 0);
              const currentWeight = (assetVal / totalPortfolioVal) * 100;
              const targetWeight = Number(asset.target_weight || 0);

              if (targetWeight > 0) {
                const divergence = Math.abs(currentWeight - targetWeight);

                if (divergence >= 10) {
                  alerts.push({
                    id: `alert-imbalance-${client.id}-${asset.ticker}`,
                    clientId: client.id,
                    clientName: client.full_name,
                    clientPhone: client.phone,
                    type: 'imbalance',
                    severity: divergence >= 20 ? 'high' : 'medium',
                    title: `Desbalanceamento em ${asset.ticker}`,
                    description: `O ativo ${asset.ticker} está com peso de ${currentWeight.toFixed(1)}% contra o alvo planejado de ${targetWeight.toFixed(1)}%.`,
                    metric: `Divergência de ${divergence.toFixed(1)}%`,
                    suggestedAction: 'Ajustar no Simulador de Aportes para calibrar no próximo aporte.',
                    whatsappMessage: `Olá ${client.full_name}! Notei que sua alocação em ${asset.ticker} está com divergência de ${divergence.toFixed(1)}% em relação ao alvo da sua carteira. Podemos equilibrar isso no seu próximo aporte mensal.`,
                  });
                  break; // 1 alerta de desbalanceamento por cliente para não poluir
                }
              }
            }
          }
        }
      }

      // Ordenar: alta severidade primeiro
      return alerts.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'high' ? -1 : 1));
    },
  });

  const alerts = query.data || [];

  const counts = {
    total: alerts.length,
    high: alerts.filter((a) => a.severity === 'high').length,
    medium: alerts.filter((a) => a.severity === 'medium').length,
    fixedCosts: alerts.filter((a) => a.type === 'fixed_costs_overrun').length,
    inactivity: alerts.filter((a) => a.type === 'inactivity').length,
    imbalance: alerts.filter((a) => a.type === 'imbalance').length,
  };

  return {
    ...query,
    alerts,
    counts,
  };
}
