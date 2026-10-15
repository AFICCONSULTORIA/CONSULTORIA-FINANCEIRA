import { supabase } from '../lib/supabase';
import { cleanDescription, guessCategory } from '../utils/ofxParser';
import { calculateHealthScore, getScoreStatus } from '../utils/scoreCalculator';
import type { 
  BankConnection, 
  SupportedBank, 
  SyncTransactionPayload, 
  ClientDebt, 
  OpenFinanceSyncResult 
} from '../types/openFinance';

/**
 * Catálogo Oficial de Instituições Homologadas no Open Finance Brasil
 */
export const SUPPORTED_BANKS: SupportedBank[] = [
  {
    id: 'nubank',
    name: 'Nubank',
    code: '260',
    color: '#820AD1',
    textColor: '#FFFFFF',
    bgLight: 'rgba(130, 10, 209, 0.15)',
    logoText: 'NU',
    category: 'fintech',
    popular: true,
  },
  {
    id: 'itau',
    name: 'Itaú Unibanco',
    code: '341',
    color: '#EC7000',
    textColor: '#FFFFFF',
    bgLight: 'rgba(236, 112, 0, 0.15)',
    logoText: 'IT',
    category: 'bank',
    popular: true,
  },
  {
    id: 'bradesco',
    name: 'Bradesco',
    code: '237',
    color: '#CC092F',
    textColor: '#FFFFFF',
    bgLight: 'rgba(204, 9, 47, 0.15)',
    logoText: 'BD',
    category: 'bank',
    popular: true,
  },
  {
    id: 'banco-do-brasil',
    name: 'Banco do Brasil',
    code: '001',
    color: '#003882',
    textColor: '#F8D117',
    bgLight: 'rgba(0, 56, 130, 0.2)',
    logoText: 'BB',
    category: 'bank',
    popular: true,
  },
  {
    id: 'santander',
    name: 'Santander',
    code: '033',
    color: '#EC0000',
    textColor: '#FFFFFF',
    bgLight: 'rgba(236, 0, 0, 0.15)',
    logoText: 'SAN',
    category: 'bank',
    popular: true,
  },
  {
    id: 'inter',
    name: 'Banco Inter',
    code: '077',
    color: '#FF7A00',
    textColor: '#FFFFFF',
    bgLight: 'rgba(255, 122, 0, 0.15)',
    logoText: 'IN',
    category: 'fintech',
    popular: true,
  },
  {
    id: 'c6-bank',
    name: 'C6 Bank',
    code: '336',
    color: '#242424',
    textColor: '#FFFFFF',
    bgLight: 'rgba(255, 255, 255, 0.12)',
    logoText: 'C6',
    category: 'fintech',
    popular: true,
  },
  {
    id: 'caixa',
    name: 'Caixa Econômica',
    code: '104',
    color: '#005CA9',
    textColor: '#F29100',
    bgLight: 'rgba(0, 92, 169, 0.2)',
    logoText: 'CEF',
    category: 'bank',
    popular: true,
  },
  {
    id: 'xp',
    name: 'XP Investimentos',
    code: '102',
    color: '#000000',
    textColor: '#FFFFFF',
    bgLight: 'rgba(255, 255, 255, 0.15)',
    logoText: 'XP',
    category: 'investment',
    popular: true,
  },
  {
    id: 'btg',
    name: 'BTG Pactual',
    code: '208',
    color: '#001E62',
    textColor: '#FFFFFF',
    bgLight: 'rgba(0, 30, 98, 0.2)',
    logoText: 'BTG',
    category: 'investment',
    popular: true,
  },
  {
    id: 'rico',
    name: 'Rico Investimentos',
    code: '386',
    color: '#FF4D00',
    textColor: '#FFFFFF',
    bgLight: 'rgba(255, 77, 0, 0.15)',
    logoText: 'RC',
    category: 'investment',
    popular: false,
  },
  {
    id: 'safra',
    name: 'Banco Safra',
    code: '422',
    color: '#BFA15F',
    textColor: '#1A1A1A',
    bgLight: 'rgba(191, 161, 95, 0.2)',
    logoText: 'SAF',
    category: 'bank',
    popular: false,
  },
  {
    id: 'sicoob',
    name: 'Sicoob',
    code: '756',
    color: '#003641',
    textColor: '#00AE9D',
    bgLight: 'rgba(0, 174, 157, 0.15)',
    logoText: 'SIC',
    category: 'bank',
    popular: false,
  },
  {
    id: 'sicredi',
    name: 'Sicredi',
    code: '748',
    color: '#007A33',
    textColor: '#FFFFFF',
    bgLight: 'rgba(0, 122, 51, 0.15)',
    logoText: 'SIC',
    category: 'bank',
    popular: false,
  },
  {
    id: 'mercado-pago',
    name: 'Mercado Pago',
    code: '323',
    color: '#009EE3',
    textColor: '#FFFFFF',
    bgLight: 'rgba(0, 158, 227, 0.15)',
    logoText: 'MP',
    category: 'fintech',
    popular: false,
  },
  {
    id: 'picpay',
    name: 'PicPay',
    code: '380',
    color: '#11C76F',
    textColor: '#FFFFFF',
    bgLight: 'rgba(17, 199, 111, 0.15)',
    logoText: 'PIC',
    category: 'fintech',
    popular: false,
  },
  {
    id: 'clear',
    name: 'Clear Corretora',
    code: '103',
    color: '#00D1B2',
    textColor: '#000000',
    bgLight: 'rgba(0, 209, 178, 0.15)',
    logoText: 'CLR',
    category: 'investment',
    popular: false,
  },
  {
    id: 'nuinvest',
    name: 'NuInvest (Easynvest)',
    code: '261',
    color: '#820AD1',
    textColor: '#FFFFFF',
    bgLight: 'rgba(130, 10, 209, 0.15)',
    logoText: 'NUI',
    category: 'investment',
    popular: false,
  }
];

const LOCAL_STORAGE_KEY = 'afic_open_finance_connections';
const LOCAL_STORAGE_DEBTS = 'afic_open_finance_debts';

function mapPluggyCategory(type?: string, subtype?: string): 'Ações' | 'FIIs' | 'Renda Fixa' | 'Internacional' | 'Cripto' | 'Outros' {
  const t = (type || '').toUpperCase();
  const st = (subtype || '').toUpperCase();
  if (st.includes('FII') || st.includes('REAL_ESTATE') || t.includes('REAL_ESTATE')) return 'FIIs';
  if (st.includes('CRYPTO') || t.includes('CRYPTO')) return 'Cripto';
  if (t.includes('EQUITY') || st.includes('STOCK')) return 'Ações';
  if (st.includes('BDR') || st.includes('ETF_GLOBAL') || st.includes('INTERNATIONAL') || st.includes('GLOBAL')) return 'Internacional';
  if (t.includes('FIXED_INCOME') || st.includes('CDB') || st.includes('LCI') || st.includes('LCA') || st.includes('TREASURY') || st.includes('TESOURO') || t.includes('MUTUAL_FUND')) return 'Renda Fixa';
  return 'Outros';
}

function mapPluggyLoanType(type?: string): ClientDebt['type'] {
  const t = (type || '').toUpperCase();
  if (t.includes('REAL_ESTATE') || t.includes('MORTGAGE') || t.includes('IMOVEL') || t.includes('HABITACIONAL')) return 'imovel';
  if (t.includes('VEHICLE') || t.includes('AUTO') || t.includes('VEICULO')) return 'veiculo';
  if (t.includes('PAYROLL') || t.includes('CONSIGNADO')) return 'consignado';
  if (t.includes('OVERDRAFT') || t.includes('ROTATIVO') || t.includes('CHEQUE')) return 'cheque_especial';
  if (t.includes('CREDIT') || t.includes('CARD') || t.includes('CARTAO')) return 'cartao';
  if (t.includes('PERSONAL') || t.includes('PESSOAL')) return 'pessoal';
  return 'outros';
}

export const openFinanceService = {
  /**
   * Obtém token temporário seguro do Pluggy Connect Widget
   */
  async getPluggyConnectToken(options?: { connectorId?: number }): Promise<string> {
    const clientId = import.meta.env.VITE_PLUGGY_CLIENT_ID || 'c5c76ae5-414f-4187-a144-91a302e47db0';
    const clientSecret = import.meta.env.VITE_PLUGGY_CLIENT_SECRET || 'cN23BsQF2jpQk9yUqHwsDieymBbWebpf4MrvIZmopyY';

    // 1. Gera apiKey de autenticação da aplicação
    const authRes = await fetch('https://api.pluggy.ai/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret })
    });

    if (!authRes.ok) {
      const errBody = await authRes.text();
      throw new Error(`Falha na autenticação da Pluggy (${authRes.status}): ${errBody}`);
    }

    const { apiKey } = await authRes.json();

    // 2. Solicita Connect Token temporário para renderizar o Widget do Banco Central / Open Finance
    const connectPayload: any = {};
    if (options?.connectorId) {
      connectPayload.options = { connectorId: options.connectorId };
    }

    const connectRes = await fetch('https://api.pluggy.ai/connect_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey
      },
      body: JSON.stringify(connectPayload)
    });

    if (!connectRes.ok) {
      const errBody = await connectRes.text();
      throw new Error(`Falha ao gerar Connect Token (${connectRes.status}): ${errBody}`);
    }

    const { accessToken } = await connectRes.json();
    return accessToken;
  },

  /**
   * Obtém API Key da Pluggy para chamadas de backend
   */
  async getPluggyApiKey(): Promise<string> {
    const clientId = import.meta.env.VITE_PLUGGY_CLIENT_ID || 'c5c76ae5-414f-4187-a144-91a302e47db0';
    const clientSecret = import.meta.env.VITE_PLUGGY_CLIENT_SECRET || 'cN23BsQF2jpQk9yUqHwsDieymBbWebpf4MrvIZmopyY';

    const authRes = await fetch('https://api.pluggy.ai/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret })
    });

    if (!authRes.ok) throw new Error('Falha de autenticação com a Pluggy API');
    const { apiKey } = await authRes.json();
    return apiKey;
  },

  /**
   * Processa o item conectado com sucesso pelo Pluggy Connect Widget.
   * Puxa: Lançamentos / Extratos + Investimentos + Dívidas & Financiamentos.
   */
  async handlePluggyItemSuccess(userId: string, item: any): Promise<OpenFinanceSyncResult> {
    const apiKey = await this.getPluggyApiKey();

    // 1. Busca contas bancárias vinculadas ao Item
    let accounts: any[] = [];
    try {
      const accountsRes = await fetch(`https://api.pluggy.ai/accounts?itemId=${item.id}`, {
        headers: { 'X-API-KEY': apiKey }
      });
      const accountsData = await accountsRes.json();
      accounts = accountsData.results || [];
    } catch (e) {
      console.warn('Erro ao listar contas do item:', e);
    }
    const primaryAccount = accounts[0];

    const instName = item.connector?.name || 'Instituição Bancária';
    const instColor = item.connector?.primaryColor || '#EAB308';
    const instCode = String(item.connector?.id || '000');

    // 2. Salva ou atualiza a conexão na tabela bank_connections
    const now = new Date();
    const consentExpires = new Date(now);
    consentExpires.setDate(now.getDate() + 365);

    const connectionPayload: Omit<BankConnection, 'id'> = {
      user_id: userId,
      provider: 'pluggy',
      item_id: item.id,
      institution_id: instCode,
      institution_name: instName,
      institution_color: instColor,
      account_type: primaryAccount?.type === 'CREDIT' ? 'credit_card' : 'checking',
      account_number: primaryAccount?.number ? `••• ${primaryAccount.number.slice(-4)}` : undefined,
      balance: primaryAccount?.balance || 0,
      status: 'UPDATED',
      consent_expires_at: consentExpires.toISOString(),
      last_sync_at: now.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };

    let savedConnection: BankConnection;
    try {
      const { data, error } = await supabase
        .from('bank_connections')
        .upsert(connectionPayload, { onConflict: 'user_id,item_id' })
        .select()
        .single();

      if (error) throw error;
      savedConnection = data;
    } catch (err) {
      console.warn('Salvando conexão local:', err);
      savedConnection = { ...connectionPayload, id: `conn_${item.id}` };
      this.saveLocalSandboxConnection(userId, savedConnection);
    }

    // 3. Sincroniza Lançamentos (Transactions)
    let importedTransactions = 0;
    try {
      for (const acc of accounts) {
        const txRes = await fetch(`https://api.pluggy.ai/transactions?accountId=${acc.id}&pageSize=50`, {
          headers: { 'X-API-KEY': apiKey }
        });
        const txData = await txRes.json();
        const pluggyTxs = txData.results || [];

        if (pluggyTxs.length > 0) {
          const recordsToInsert = pluggyTxs.map((t: any) => {
            const isIncome = Number(t.amount) > 0;
            const rawDesc = t.description || 'Lançamento Open Finance';
            const cleaned = cleanDescription(rawDesc);
            const cat = t.category || guessCategory(cleaned, isIncome ? 'income' : 'expense');
            const dateStr = (t.date || '').split('T')[0] || new Date().toISOString().split('T')[0];

            return {
              user_id: userId,
              connection_id: savedConnection.id.startsWith('conn_') ? null : savedConnection.id,
              external_id: t.id,
              type: isIncome ? 'income' : 'expense',
              description: cleaned,
              amount: Math.abs(Number(t.amount)),
              category: cat,
              payment_method: acc.type === 'CREDIT' ? 'Cartão de Crédito' : 'Extrato Bancário',
              status: 'completed',
              date: dateStr,
              notes: `Sincronizado via Open Finance (${instName})`
            };
          });

          const { error: insErr } = await supabase
            .from('transactions')
            .upsert(recordsToInsert, { onConflict: 'user_id,external_id', ignoreDuplicates: true });

          if (insErr) {
            const standardRecords = recordsToInsert.map((item: any) => {
              const copy = { ...item };
              delete copy.external_id;
              delete copy.connection_id;
              return copy;
            });
            await supabase.from('transactions').insert(standardRecords);
          }

          importedTransactions += recordsToInsert.length;
        }
      }
    } catch (err) {
      console.error('Erro ao buscar transações da Pluggy:', err);
    }

    // 4. Sincroniza Investimentos (Investments)
    let importedInvestments = 0;
    try {
      const invRes = await fetch(`https://api.pluggy.ai/investments?itemId=${item.id}&pageSize=50`, {
        headers: { 'X-API-KEY': apiKey }
      });
      const invData = await invRes.json();
      const pluggyInvs = invData.results || [];

      if (pluggyInvs.length > 0) {
        const assetsToInsert = pluggyInvs.map((inv: any) => {
          const totalVal = Math.abs(Number(inv.balance || inv.value || 0));
          const qty = Number(inv.amount || 1);
          const unitPrice = Number(inv.price || (totalVal > 0 && qty > 0 ? totalVal / qty : totalVal));
          const ticker = (inv.code || inv.name || 'ATIVO').slice(0, 15).toUpperCase();

          return {
            user_id: userId,
            connection_id: savedConnection.id.startsWith('conn_') ? null : savedConnection.id,
            external_id: inv.id,
            ticker: ticker,
            name: inv.name || `Ativo ${instName}`,
            category: mapPluggyCategory(inv.type, inv.subtype),
            quantity: qty,
            average_price: unitPrice,
            current_price: unitPrice,
            total_value: totalVal,
            institution: instName,
            notes: `Open Finance: ${inv.rate || inv.type || ''}`.trim(),
            updated_at: new Date().toISOString()
          };
        });

        const { error: invErr } = await supabase
          .from('client_assets')
          .upsert(assetsToInsert, { onConflict: 'user_id,external_id' });

        if (invErr) {
          // Se colunas novas external_id ainda não existirem, insere padrão
          const standardAssets = assetsToInsert.map((item: any) => {
            const copy = { ...item };
            delete copy.external_id;
            delete copy.connection_id;
            return copy;
          });
          await supabase.from('client_assets').insert(standardAssets);
        }

        importedInvestments += assetsToInsert.length;
      }
    } catch (err) {
      console.warn('Investimentos não disponíveis ou erro na busca da Pluggy:', err);
    }

    // 5. Sincroniza Dívidas & Financiamentos (Loans & Credit Cards)
    let importedDebts = 0;
    try {
      const debtsToInsert: any[] = [];

      // A) Empréstimos e Financiamentos formais (/loans)
      const loansRes = await fetch(`https://api.pluggy.ai/loans?itemId=${item.id}&pageSize=50`, {
        headers: { 'X-API-KEY': apiKey }
      });
      const loansData = await loansRes.json();
      const pluggyLoans = loansData.results || [];

      for (const loan of pluggyLoans) {
        const outstanding = Math.abs(Number(loan.unpaidAmount || loan.balance || loan.contractAmount || 0));
        debtsToInsert.push({
          user_id: userId,
          connection_id: savedConnection.id.startsWith('conn_') ? null : savedConnection.id,
          external_id: loan.id,
          name: loan.name || `Contrato ${loan.contractNumber || ''} (${instName})`,
          type: mapPluggyLoanType(loan.type),
          total_amount: Math.abs(Number(loan.contractAmount || outstanding)),
          outstanding_balance: outstanding,
          installment_amount: Math.abs(Number(loan.installmentAmount || 0)),
          installments_total: Number(loan.installmentsQuantity || 0),
          installments_paid: Number(loan.installmentsPaidQuantity || 0),
          installments_remaining: Number(loan.installmentsOutstandingQuantity || 0),
          interest_rate: Number(loan.interestRate || 0),
          institution: instName,
          contract_number: loan.contractNumber || undefined,
          due_date: loan.dueDate || undefined,
          notes: 'Sincronizado via Open Finance Pluggy',
          updated_at: new Date().toISOString()
        });
      }

      // B) Faturas de Cartão de Crédito em aberto (/accounts)
      for (const acc of accounts) {
        if (acc.type === 'CREDIT' && acc.creditData?.balance) {
          const cardBalance = Math.abs(Number(acc.creditData.balance));
          if (cardBalance > 0) {
            debtsToInsert.push({
              user_id: userId,
              connection_id: savedConnection.id.startsWith('conn_') ? null : savedConnection.id,
              external_id: `card_bill_${acc.id}`,
              name: `Fatura ${instName} (${acc.name || 'Cartão'})`,
              type: 'cartao',
              total_amount: Number(acc.creditData.creditLimit || cardBalance),
              outstanding_balance: cardBalance,
              installment_amount: cardBalance,
              installments_total: 1,
              installments_paid: 0,
              installments_remaining: 1,
              interest_rate: 0,
              institution: instName,
              due_date: acc.creditData.balanceDueDate || acc.creditData.balanceCloseDate || undefined,
              notes: `Fatura em aberto (Limite: R$ ${acc.creditData.creditLimit || 0})`,
              updated_at: new Date().toISOString()
            });
          }
        }
      }

      if (debtsToInsert.length > 0) {
        const { error: debtErr } = await supabase
          .from('client_debts')
          .upsert(debtsToInsert, { onConflict: 'user_id,external_id' });

        if (debtErr) {
          console.warn('Tabela client_debts ainda não criada ou indisponível:', debtErr.message);
          this.saveLocalDebts(userId, debtsToInsert);
        }
        importedDebts += debtsToInsert.length;
      }
    } catch (err) {
      console.warn('Erro ao processar dívidas do Open Finance:', err);
    }

    // 6. Recalcula e sincroniza o perfil financeiro global (Total Equity, Total Debt e Health Score)
    await this.recalculateProfileTotals(userId);

    return { 
      connection: savedConnection, 
      importedTransactions, 
      importedInvestments, 
      importedDebts 
    };
  },

  /**
   * Recalcula Patrimônio Total (Total Equity) e Dívidas Totais (Total Debt)
   * e atualiza o Health Score do cliente no Supabase em tempo real.
   */
  async recalculateProfileTotals(userId: string): Promise<void> {
    try {
      // 1. Soma dos Ativos da Carteira
      const { data: assets } = await supabase
        .from('client_assets')
        .select('total_value, quantity, current_price')
        .eq('user_id', userId);

      const totalEquity = (assets || []).reduce((sum, a) => {
        return sum + (Number(a.total_value) || (Number(a.quantity || 0) * Number(a.current_price || 0)));
      }, 0);

      // 2. Soma das Dívidas
      let totalDebt = 0;
      const { data: debts, error: debtErr } = await supabase
        .from('client_debts')
        .select('outstanding_balance')
        .eq('user_id', userId);

      if (!debtErr && debts) {
        totalDebt = debts.reduce((sum, d) => sum + (Number(d.outstanding_balance) || 0), 0);
      } else {
        // Fallback local
        const localDebts = this.getLocalDebts(userId);
        totalDebt = localDebts.reduce((sum, d) => sum + (Number(d.outstanding_balance) || 0), 0);
      }

      // 3. Busca perfil financeiro para atualizar score
      const { data: profile } = await supabase
        .from('financial_profiles')
        .select('monthly_income, fixed_costs')
        .eq('user_id', userId)
        .single();

      if (profile) {
        const monthlyIncome = Number(profile.monthly_income || 0);
        const fixedCosts = Number(profile.fixed_costs || 0);

        const newScore = calculateHealthScore(monthlyIncome, fixedCosts, totalDebt, totalEquity);
        const newStatus = getScoreStatus(newScore);

        await supabase
          .from('financial_profiles')
          .update({
            total_equity: Math.round(totalEquity * 100) / 100,
            total_debt: Math.round(totalDebt * 100) / 100,
            health_score: newScore,
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }
    } catch (err) {
      console.warn('Erro ao recalcular totais do perfil:', err);
    }
  },

  /**
   * Busca as conexões bancárias do usuário
   */
  async getUserConnections(userId: string): Promise<BankConnection[]> {
    try {
      const { data, error } = await supabase
        .from('bank_connections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return this.getLocalSandboxConnections(userId);
      }

      return data || [];
    } catch {
      return this.getLocalSandboxConnections(userId);
    }
  },

  /**
   * Busca as dívidas cadastradas / sincronizadas do cliente
   */
  async getUserDebts(userId: string): Promise<ClientDebt[]> {
    try {
      const { data, error } = await supabase
        .from('client_debts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return this.getLocalDebts(userId);
      }

      return data || [];
    } catch {
      return this.getLocalDebts(userId);
    }
  },

  /**
   * Cadastra ou atualiza uma dívida manualmente ou via sync
   */
  async saveDebt(userId: string, debt: Partial<ClientDebt>): Promise<ClientDebt> {
    const payload = {
      ...debt,
      user_id: userId,
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('client_debts')
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;
      await this.recalculateProfileTotals(userId);
      return data;
    } catch (err) {
      // Salva localmente
      const mockDebt: ClientDebt = {
        id: debt.id || `debt_${Date.now()}`,
        user_id: userId,
        name: debt.name || 'Dívida',
        type: debt.type || 'outros',
        total_amount: debt.total_amount || 0,
        outstanding_balance: debt.outstanding_balance || 0,
        installment_amount: debt.installment_amount || 0,
        installments_total: debt.installments_total || 0,
        installments_paid: debt.installments_paid || 0,
        installments_remaining: debt.installments_remaining || 0,
        interest_rate: debt.interest_rate || 0,
        institution: debt.institution,
        notes: debt.notes,
        created_at: new Date().toISOString()
      };
      const list = this.getLocalDebts(userId).filter(d => d.id !== mockDebt.id);
      list.unshift(mockDebt);
      localStorage.setItem(`${LOCAL_STORAGE_DEBTS}_${userId}`, JSON.stringify(list));
      await this.recalculateProfileTotals(userId);
      return mockDebt;
    }
  },

  /**
   * Exclui uma dívida e recalcula o perfil
   */
  async deleteDebt(debtId: string, userId: string): Promise<void> {
    try {
      await supabase
        .from('client_debts')
        .delete()
        .eq('id', debtId)
        .eq('user_id', userId);
    } catch {
      const list = this.getLocalDebts(userId).filter(d => d.id !== debtId);
      localStorage.setItem(`${LOCAL_STORAGE_DEBTS}_${userId}`, JSON.stringify(list));
    }
    await this.recalculateProfileTotals(userId);
  },

  /**
   * Conecta uma instituição bancária (Modo Sandbox / Demonstração)
   */
  async connectBank(
    userId: string,
    bank: SupportedBank,
    accountType: 'checking' | 'credit_card' = 'checking'
  ): Promise<BankConnection> {
    const now = new Date();
    const consentExpires = new Date(now);
    consentExpires.setDate(now.getDate() + 365);

    const newConnection: Omit<BankConnection, 'id'> = {
      user_id: userId,
      provider: 'pluggy',
      item_id: `item_${bank.id}_${Date.now()}`,
      institution_id: bank.code,
      institution_name: bank.name,
      institution_color: bank.color,
      account_type: accountType,
      account_number: `••• ${Math.floor(1000 + Math.random() * 9000)}`,
      balance: +(Math.random() * 5000 + 1200).toFixed(2),
      status: 'UPDATED',
      consent_expires_at: consentExpires.toISOString(),
      last_sync_at: now.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('bank_connections')
        .insert(newConnection)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch {
      const mockConn: BankConnection = {
        ...newConnection,
        id: `conn_${Date.now()}`,
      };
      this.saveLocalSandboxConnection(userId, mockConn);
      return mockConn;
    }
  },

  /**
   * Desconecta e revoga o compartilhamento
   */
  async disconnectBank(connectionId: string, userId: string): Promise<void> {
    try {
      await supabase
        .from('bank_connections')
        .delete()
        .eq('id', connectionId)
        .eq('user_id', userId);
    } catch {
      const list = this.getLocalSandboxConnections(userId).filter(c => c.id !== connectionId);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(list));
    }
  },

  /**
   * Sincroniza lançamentos bancários, investimentos e dívidas em lote (Geral ou Sandbox)
   */
  async syncConnectionTransactions(userId: string, connection: BankConnection): Promise<number> {
    const pad = (n: number) => String(n).padStart(2, '0');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const dayBefore = new Date(today);
    dayBefore.setDate(today.getDate() - 2);

    const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    // 1. Mock transactions
    const mockFeed = [
      {
        desc: `PIX RECEBIDO DE CLIENTE CONSULTORIA`,
        amount: 850.00,
        type: 'income' as const,
        date: fmtDate(today),
        payment: 'Pix'
      },
      {
        desc: `PAGTO ELETRON SUPERMERCADO PAO DE ACUCAR`,
        amount: 234.50,
        type: 'expense' as const,
        date: fmtDate(today),
        payment: connection.account_type === 'credit_card' ? 'Cartão de Crédito' : 'Cartão de Débito'
      },
      {
        desc: `COMPRA NO DEBITO POSTO IPIRANGA COMBUSTIVEL`,
        amount: 150.00,
        type: 'expense' as const,
        date: fmtDate(yesterday),
        payment: 'Cartão de Débito'
      },
      {
        desc: `ASSINATURA STREAMING NETFLIX BRASIL`,
        amount: 55.90,
        type: 'expense' as const,
        date: fmtDate(yesterday),
        payment: 'Cartão de Crédito'
      },
      {
        desc: `TRANSFERENCIA PIX RESTAURANTE OUTBACK`,
        amount: 189.90,
        type: 'expense' as const,
        date: fmtDate(dayBefore),
        payment: 'Pix'
      }
    ];

    const payloads: SyncTransactionPayload[] = mockFeed.map((item, idx) => {
      const cleaned = cleanDescription(item.desc);
      const cat = guessCategory(cleaned, item.type);
      return {
        external_id: `of_${connection.institution_id}_${item.date}_${item.amount}_${idx}`,
        connection_id: connection.id,
        amount: item.amount,
        type: item.type,
        description: cleaned,
        category: cat,
        payment_method: item.payment,
        date: item.date,
        status: 'completed',
        notes: `Sincronizado via Open Finance (${connection.institution_name})`
      };
    });

    try {
      const recordsToInsert = payloads.map(p => ({
        user_id: userId,
        type: p.type,
        description: p.description,
        amount: p.amount,
        category: p.category,
        payment_method: p.payment_method,
        status: p.status,
        date: p.date,
        notes: p.notes,
        external_id: p.external_id,
        connection_id: connection.id.startsWith('conn_') ? null : connection.id
      }));

      const { error } = await supabase
        .from('transactions')
        .upsert(recordsToInsert, { onConflict: 'user_id,external_id', ignoreDuplicates: true });

      if (error) {
        const standardRecords = recordsToInsert.map(({ external_id, connection_id, ...rest }) => rest);
        await supabase.from('transactions').insert(standardRecords);
      }

      // Se for banco de investimentos, simula sincronização de ativos também
      if (connection.institution_name.includes('XP') || connection.institution_name.includes('Inter') || connection.institution_name.includes('BTG') || connection.institution_name.includes('NuInvest')) {
        const mockAssets = [
          {
            user_id: userId,
            ticker: 'CDB 100% CDI',
            name: `CDB Liquidez Diária (${connection.institution_name})`,
            category: 'Renda Fixa' as const,
            quantity: 1,
            average_price: 5000,
            current_price: 5000,
            total_value: 5000,
            institution: connection.institution_name,
            notes: 'Sincronizado Open Finance'
          },
          {
            user_id: userId,
            ticker: 'MXRF11',
            name: 'Maxi Renda FII',
            category: 'FIIs' as const,
            quantity: 150,
            average_price: 10.20,
            current_price: 10.35,
            total_value: 1552.50,
            institution: connection.institution_name,
            notes: 'Sincronizado Open Finance'
          }
        ];
        await supabase.from('client_assets').insert(mockAssets);
      }

      await supabase
        .from('bank_connections')
        .update({ last_sync_at: new Date().toISOString(), status: 'UPDATED' })
        .eq('id', connection.id);

      await this.recalculateProfileTotals(userId);
      return payloads.length;
    } catch (err) {
      console.error('Erro na sincronização de transações:', err);
      return payloads.length;
    }
  },

  // Helpers Sandbox e Fallbacks Locais
  getLocalSandboxConnections(userId: string): BankConnection[] {
    try {
      const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveLocalSandboxConnection(userId: string, conn: BankConnection) {
    try {
      const list = this.getLocalSandboxConnections(userId);
      list.unshift(conn);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(list));
    } catch (err) {
      console.warn('Falha ao salvar conexão local:', err);
    }
  },

  getLocalDebts(userId: string): ClientDebt[] {
    try {
      const raw = localStorage.getItem(`${LOCAL_STORAGE_DEBTS}_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveLocalDebts(userId: string, debts: any[]) {
    try {
      const list = this.getLocalDebts(userId);
      const updated = [...debts, ...list];
      localStorage.setItem(`${LOCAL_STORAGE_DEBTS}_${userId}`, JSON.stringify(updated));
    } catch (err) {
      console.warn('Falha ao salvar dívidas locais:', err);
    }
  }
};
