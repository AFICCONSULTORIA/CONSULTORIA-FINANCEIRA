import type { FinancialData } from './financial';

export interface ClientProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  joinedAt: string;
  financialData: FinancialData;
}

// We can also add consultant types here or in a separate file
export interface ConsultantProfile {
  id: string;
  name: string;
  clients: string[]; // array of client IDs
}
