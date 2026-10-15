import { QueryClient } from '@tanstack/react-query';

/**
 * Instância central do QueryClient para o AFIC Consultoria Financeira.
 * Configurada com estratégias de cache otimizadas para aplicações financeiras:
 * - staleTime de 5 minutos para evitar requisições redundantes a cada troca de tela.
 * - gcTime de 30 minutos em memória para reutilização rápida de dados de clientes.
 * - refetchOnWindowFocus desativado para estabilidade da UI durante navegação.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos de validade antes de marcar como obsoleto
      gcTime: 1000 * 60 * 30, // 30 minutos em cache de memória inativo
      retry: 1, // 1 tentativa em caso de falha de rede
      refetchOnWindowFocus: false, // Não recarrega ao alternar abas do navegador
      refetchOnReconnect: true, // Recarrega se a conexão com a internet cair e voltar
    },
    mutations: {
      retry: 0,
    },
  },
});
