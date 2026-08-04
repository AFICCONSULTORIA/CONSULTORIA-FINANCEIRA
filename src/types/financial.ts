export type BucketType = 'fixed' | 'emergency' | 'invest' | 'comfort' | 'leisure' | 'dreams';

export interface BucketAllocation {
  type: BucketType;
  label: string;
  percentage: number;
  currentAmount: number;
  targetAmount?: number; // Optional target for things like emergency fund or dreams
}

export interface FinancialHealthScore {
  score: number; // 0 to 100
  status: 'critical' | 'attention' | 'good' | 'excellent';
  metrics: {
    savingRate: number; // % of income saved
    debtRatio: number; // % of income going to debt
    emergencyFundMonths: number; // months of fixed costs saved
  };
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon?: string;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate?: string;
}

export interface FinancialData {
  monthlyIncome: number;
  buckets: BucketAllocation[];
  healthScore: FinancialHealthScore;
  goals: Goal[];
  actionPlan: ActionItem[];
}
