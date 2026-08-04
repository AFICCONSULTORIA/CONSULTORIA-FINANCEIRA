import type { ClientProfile } from '../types/client';

export const mockClient: ClientProfile = {
  id: 'c1',
  name: 'João Silva',
  email: 'joao.silva@email.com',
  joinedAt: '2025-01-15T00:00:00Z',
  financialData: {
    monthlyIncome: 8500,
    healthScore: {
      score: 72,
      status: 'good',
      metrics: {
        savingRate: 15,
        debtRatio: 10,
        emergencyFundMonths: 2.5,
      },
    },
    buckets: [
      { type: 'fixed', label: 'Custos Fixos', percentage: 55, currentAmount: 4675 },
      { type: 'emergency', label: 'Reserva de Emergência', percentage: 15, currentAmount: 1275, targetAmount: 25000 },
      { type: 'invest', label: 'Investimentos', percentage: 10, currentAmount: 850 },
      { type: 'comfort', label: 'Conforto', percentage: 10, currentAmount: 850 },
      { type: 'leisure', label: 'Lazer', percentage: 5, currentAmount: 425 },
      { type: 'dreams', label: 'Sonhos', percentage: 5, currentAmount: 425 },
    ],
    goals: [
      {
        id: 'g1',
        title: 'Trocar de Carro',
        targetAmount: 50000,
        currentAmount: 15000,
        deadline: '2027-12-31',
        icon: 'Car'
      },
      {
        id: 'g2',
        title: 'Viagem Europa',
        targetAmount: 25000,
        currentAmount: 5000,
        deadline: '2026-10-15',
        icon: 'Plane'
      }
    ],
    actionPlan: [
      {
        id: 'a1',
        title: 'Renegociar Dívida Cartão',
        description: 'Ligar para o banco e renegociar os juros da fatura em atraso.',
        status: 'completed',
      },
      {
        id: 'a2',
        title: 'Atingir 3 meses de Reserva',
        description: 'Focar aportes na conta poupança/tesouro selic até atingir R$ 25.000.',
        status: 'in-progress',
      }
    ]
  }
};

export const mockConsultant = {
  id: 'consultant1',
  name: 'Consultor Premium',
  clients: [mockClient]
};
