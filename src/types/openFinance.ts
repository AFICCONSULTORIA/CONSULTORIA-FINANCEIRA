export interface BankConnection {
  id: string;
  user_id: string;
  provider: 'pluggy' | 'belvo' | 'sandbox';
  item_id: string;
  institution_id: string;
  institution_name: string;
  institution_color: string;
  institution_logo?: string;
  account_type: 'checking' | 'credit_card' | 'savings' | 'investment';
  account_number?: string;
  balance: number;
  status: 'UPDATING' | 'UPDATED' | 'WAITING_USER_INPUT' | 'LOGIN_ERROR' | 'OUTDATED' | 'DISCONNECTED';
  consent_expires_at: string;
  last_sync_at: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface SupportedBank {
  id: string;
  name: string;
  code: string;
  color: string;
  textColor: string;
  bgLight: string;
  logoText: string;
  category: 'bank' | 'fintech' | 'investment';
  popular?: boolean;
}

export interface SyncTransactionPayload {
  external_id: string;
  connection_id: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  category?: string;
  payment_method?: string;
  date: string;
  status: 'completed' | 'pending';
  notes?: string;
}

export interface ClientDebt {
  id: string;
  user_id: string;
  connection_id?: string | null;
  external_id?: string;
  name: string;
  type: 'imovel' | 'veiculo' | 'pessoal' | 'cartao' | 'consignado' | 'cheque_especial' | 'outros';
  total_amount: number;
  outstanding_balance: number;
  installment_amount: number;
  installments_total: number;
  installments_paid: number;
  installments_remaining: number;
  interest_rate: number;
  institution?: string;
  contract_number?: string;
  due_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OpenFinanceSyncResult {
  connection: BankConnection;
  importedTransactions: number;
  importedInvestments: number;
  importedDebts: number;
}
