// ============================================================
// O PLANO - Motor de Cálculos Matemáticos e Financeiros
// ============================================================

export interface FinancingResult {
  financedAmount: number;
  monthlyRate: number;
  months: number;
  initialPayment: number;
  finalPayment: number;
  averagePayment: number;
  totalInterest: number;
  totalPaid: number;
  additionalCosts: number; // ITBI, Registro, Taxas
  totalWithAdditional: number;
  paymentSchedule: { month: number; payment: number; interest: number; amortization: number; balance: number }[];
}

export interface ConsortiumResult {
  creditAmount: number;
  months: number;
  adminFeeRate: number;
  reserveFundRate: number;
  totalFeesRate: number;
  monthlyPayment: number;
  totalPaid: number;
  totalFeesPaid: number;
  estimatedMonthsToContemplate: number;
  bidRequiredForFastContemplation: number;
}

export interface InvestToBuyResult {
  monthsToReachGoal: number;
  cashTargetAmount: number; // Com desconto à vista
  monthlyContribution: number;
  totalInvested: number;
  totalInterestEarned: number;
  totalAccumulated: number;
  savingsComparedToFinancing: number;
  timeline: { month: number; accumulated: number; invested: number }[];
}

export interface AmortizationHackResult {
  originalMonths: number;
  newMonths: number;
  monthsSaved: number;
  originalTotalInterest: number;
  newTotalInterest: number;
  interestSaved: number;
  extraMonthlyAmount: number;
  extraAnnualAmount: number;
  timeline: { year: number; originalBalance: number; acceleratedBalance: number }[];
}

export interface BuyVsRentResult {
  years: number;
  propertyValueAfterYears: number;
  rentInvestedPortfolioAfterYears: number;
  difference: number;
  verdict: 'buy' | 'rent';
  verdictDescription: string;
  timeline: { year: number; propertyEquity: number; rentInvestmentEquity: number }[];
}

export interface VehicleOwnershipResult {
  vehicleValue: number;
  monthlyDepreciation: number;
  monthlyIpva: number;
  monthlyInsurance: number;
  monthlyMaintenance: number;
  monthlyOpportunityCost: number;
  realMonthlyCost: number;
  realAnnualCost: number;
  subscriptionMonthlyEquivalent: number;
  verdict: 'buy_cash' | 'finance' | 'consortium' | 'subscription';
  recommendationReason: string;
}

// ------------------------------------------------------------
// 1. Financiamento (SAC e Price)
// ------------------------------------------------------------
export function calculateFinancing(
  totalValue: number,
  downPayment: number,
  annualInterestRate: number, // Ex: 10.5 para 10.5% a.a.
  months: number,
  system: 'SAC' | 'PRICE' = 'SAC',
  isProperty: boolean = true
): FinancingResult {
  const financedAmount = Math.max(0, totalValue - downPayment);
  // Taxa mensal equivalente: (1 + i)^(1/12) - 1
  const monthlyRate = Math.pow(1 + annualInterestRate / 100, 1 / 12) - 1;

  // Custos adicionais estimados no Brasil:
  // Imóvel: ITBI (~3%) + Cartório/Registro (~1.5%) + Taxas bancárias
  // Veículo: TAC + Gravame + Emplacamento (~2.5%)
  const additionalCosts = isProperty 
    ? totalValue * 0.045 
    : totalValue * 0.03;

  const paymentSchedule: { month: number; payment: number; interest: number; amortization: number; balance: number }[] = [];
  let balance = financedAmount;
  let totalInterest = 0;
  let initialPayment = 0;
  let finalPayment = 0;

  if (system === 'SAC') {
    const fixedAmortization = financedAmount / months;
    for (let m = 1; m <= months; m++) {
      const interest = balance * monthlyRate;
      const payment = fixedAmortization + interest;
      totalInterest += interest;
      balance = Math.max(0, balance - fixedAmortization);

      if (m === 1) initialPayment = payment;
      if (m === months) finalPayment = payment;

      if (m <= 60 || m % 12 === 0 || m === months) {
        paymentSchedule.push({
          month: m,
          payment,
          interest,
          amortization: fixedAmortization,
          balance
        });
      }
    }
  } else {
    // PRICE: Parcela constante = PV * (i / (1 - (1+i)^-n))
    const payment = monthlyRate === 0 
      ? financedAmount / months 
      : financedAmount * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -months)));
    
    initialPayment = payment;
    finalPayment = payment;

    for (let m = 1; m <= months; m++) {
      const interest = balance * monthlyRate;
      const amortization = payment - interest;
      totalInterest += interest;
      balance = Math.max(0, balance - amortization);

      if (m <= 60 || m % 12 === 0 || m === months) {
        paymentSchedule.push({
          month: m,
          payment,
          interest,
          amortization,
          balance
        });
      }
    }
  }

  const totalPaid = downPayment + financedAmount + totalInterest;
  const averagePayment = (initialPayment + finalPayment) / 2;

  return {
    financedAmount,
    monthlyRate,
    months,
    initialPayment,
    finalPayment,
    averagePayment,
    totalInterest,
    totalPaid,
    additionalCosts,
    totalWithAdditional: totalPaid + additionalCosts,
    paymentSchedule
  };
}

// ------------------------------------------------------------
// 2. Consórcio Estratégico
// ------------------------------------------------------------
export function calculateConsortium(
  creditAmount: number,
  months: number,
  adminFeeRate: number = 18, // 18% para imóvel, 14% para auto
  reserveFundRate: number = 2 // 2%
): ConsortiumResult {
  const totalFeesRate = adminFeeRate + reserveFundRate;
  const totalCost = creditAmount * (1 + totalFeesRate / 100);
  const monthlyPayment = totalCost / months;
  const totalFeesPaid = totalCost - creditAmount;

  // Estimativa empírica de lance médio vencedor no mercado brasileiro (30% a 40% para contemplar nos primeiros meses)
  const bidRequiredForFastContemplation = creditAmount * 0.35;
  const estimatedMonthsToContemplate = Math.round(months * 0.4); // sem lance, mediana de sorteio

  return {
    creditAmount,
    months,
    adminFeeRate,
    reserveFundRate,
    totalFeesRate,
    monthlyPayment,
    totalPaid: totalCost,
    totalFeesPaid,
    estimatedMonthsToContemplate,
    bidRequiredForFastContemplation
  };
}

// ------------------------------------------------------------
// 3. Comprar à Vista (Investir a Parcela)
// ------------------------------------------------------------
export function calculateInvestToBuy(
  totalValue: number,
  initialCapital: number,
  monthlyInvestment: number,
  annualYieldRate: number = 10.5, // 10.5% a.a. (CDB/Tesouro Selic líquido)
  cashDiscountPercentage: number = 8 // 8% desconto na compra à vista
): InvestToBuyResult {
  const cashTargetAmount = totalValue * (1 - cashDiscountPercentage / 100);
  const monthlyRate = Math.pow(1 + annualYieldRate / 100, 1 / 12) - 1;

  let accumulated = initialCapital;
  let totalInvested = initialCapital;
  let months = 0;
  const maxMonths = 360;
  const timeline: { month: number; accumulated: number; invested: number }[] = [
    { month: 0, accumulated: initialCapital, invested: initialCapital }
  ];

  while (accumulated < cashTargetAmount && months < maxMonths) {
    months++;
    accumulated = (accumulated + monthlyInvestment) * (1 + monthlyRate);
    totalInvested += monthlyInvestment;

    if (months % 6 === 0 || accumulated >= cashTargetAmount) {
      timeline.push({
        month: months,
        accumulated: Math.round(accumulated),
        invested: Math.round(totalInvested)
      });
    }
  }

  const totalInterestEarned = Math.max(0, accumulated - totalInvested);

  return {
    monthsToReachGoal: months,
    cashTargetAmount,
    monthlyContribution: monthlyInvestment,
    totalInvested,
    totalInterestEarned,
    totalAccumulated: accumulated,
    savingsComparedToFinancing: 0, // Será preenchido na comparação
    timeline
  };
}

// ------------------------------------------------------------
// 4. Acelerador de Quitação (Amortização Extraordinária)
// ------------------------------------------------------------
export function calculateAmortizationHack(
  financedAmount: number,
  annualInterestRate: number,
  originalMonths: number,
  extraMonthlyAmount: number = 300,
  extraAnnualAmount: number = 0 // Ex: 13º salário
): AmortizationHackResult {
  const monthlyRate = Math.pow(1 + annualInterestRate / 100, 1 / 12) - 1;
  const standardAmortization = financedAmount / originalMonths;

  // 1. Simulação Original (SAC padrão)
  let originalBalance = financedAmount;
  let originalTotalInterest = 0;
  for (let m = 1; m <= originalMonths; m++) {
    const interest = originalBalance * monthlyRate;
    originalTotalInterest += interest;
    originalBalance = Math.max(0, originalBalance - standardAmortization);
  }

  // 2. Simulação Acelerada (abatendo prazo direto do saldo devedor)
  let acceleratedBalance = financedAmount;
  let newTotalInterest = 0;
  let newMonths = 0;
  const timeline: { year: number; originalBalance: number; acceleratedBalance: number }[] = [];

  let simOriginalBalance = financedAmount;

  while (acceleratedBalance > 0 && newMonths < originalMonths) {
    newMonths++;
    const monthlyInterest = acceleratedBalance * monthlyRate;
    newTotalInterest += monthlyInterest;

    let extraAmortization = extraMonthlyAmount;
    if (newMonths % 12 === 0) {
      extraAmortization += extraAnnualAmount;
    }

    const totalAmortization = standardAmortization + extraAmortization;
    acceleratedBalance = Math.max(0, acceleratedBalance - totalAmortization);

    // Track original parallel balance
    simOriginalBalance = Math.max(0, simOriginalBalance - standardAmortization);

    if (newMonths % 12 === 0 || acceleratedBalance === 0) {
      timeline.push({
        year: Math.ceil(newMonths / 12),
        originalBalance: Math.round(simOriginalBalance),
        acceleratedBalance: Math.round(acceleratedBalance)
      });
    }
  }

  const monthsSaved = Math.max(0, originalMonths - newMonths);
  const interestSaved = Math.max(0, originalTotalInterest - newTotalInterest);

  return {
    originalMonths,
    newMonths,
    monthsSaved,
    originalTotalInterest,
    newTotalInterest,
    interestSaved,
    extraMonthlyAmount,
    extraAnnualAmount,
    timeline
  };
}

// ------------------------------------------------------------
// 5. Comprar vs. Alugar & Investir
// ------------------------------------------------------------
export function calculateBuyVsRent(
  propertyValue: number,
  downPayment: number,
  years: number = 20,
  annualFinancingRate: number = 10.5,
  annualInvestmentRate: number = 10.5,
  annualPropertyAppreciationRate: number = 5.0, // Inflação + valorização real
  rentalYieldAnnualRate: number = 4.5 // 4.5% a.a. (aluguel típico = ~0.38% a.m.)
): BuyVsRentResult {
  const months = years * 12;
  const financedAmount = propertyValue - downPayment;
  const monthlyFinancingRate = Math.pow(1 + annualFinancingRate / 100, 1 / 12) - 1;
  const monthlyInvestmentRate = Math.pow(1 + annualInvestmentRate / 100, 1 / 12) - 1;

  // Parcela inicial estimada do financiamento SAC
  const baseAmortization = financedAmount / months;

  // Aluguel inicial
  const initialRent = (propertyValue * (rentalYieldAnnualRate / 100)) / 12;

  // Cenário Compra: Valor do imóvel valorizado ao longo dos anos
  // Cenário Aluguel: Carteira com a entrada investida + a diferença entre parcela e aluguel
  let investedPortfolio = downPayment;
  let currentRent = initialRent;
  let currentPropertyValue = propertyValue;

  const timeline: { year: number; propertyEquity: number; rentInvestmentEquity: number }[] = [];

  for (let m = 1; m <= months; m++) {
    // Reajuste anual do aluguel e do imóvel (a cada 12 meses)
    if (m > 1 && m % 12 === 1) {
      currentRent *= 1 + (annualPropertyAppreciationRate / 100);
      currentPropertyValue *= 1 + (annualPropertyAppreciationRate / 100);
    }

    // Parcela SAC do mês
    const currentFinancingPmt = baseAmortization + ((financedAmount - baseAmortization * (m - 1)) * monthlyFinancingRate);

    // O que sobra da parcela comparado ao aluguel
    const monthlyDifference = Math.max(0, currentFinancingPmt - currentRent);

    // Investe a diferença
    investedPortfolio = (investedPortfolio + monthlyDifference) * (1 + monthlyInvestmentRate);

    if (m % 12 === 0) {
      timeline.push({
        year: m / 12,
        propertyEquity: Math.round(currentPropertyValue),
        rentInvestmentEquity: Math.round(investedPortfolio)
      });
    }
  }

  const finalPropertyValue = timeline[timeline.length - 1]?.propertyEquity || propertyValue;
  const finalInvestedPortfolio = timeline[timeline.length - 1]?.rentInvestmentEquity || investedPortfolio;
  const difference = finalInvestedPortfolio - finalPropertyValue;

  const verdict = difference > 0 ? 'rent' : 'buy';
  const verdictDescription = verdict === 'rent'
    ? `Alugar e investir a entrada com a diferença gerou R$ ${Math.abs(difference).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} a mais em patrimônio líquido do que a compra financiada.`
    : `A compra do imóvel foi mais vantajosa neste cenário, superando o aluguel investido por R$ ${Math.abs(difference).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}.`;

  return {
    years,
    propertyValueAfterYears: finalPropertyValue,
    rentInvestedPortfolioAfterYears: finalInvestedPortfolio,
    difference,
    verdict,
    verdictDescription,
    timeline
  };
}

// ------------------------------------------------------------
// 6. Custo Real de Propriedade de Veículo (TCO)
// ------------------------------------------------------------
export function calculateVehicleOwnership(
  vehicleValue: number,
  _annualKm: number = 15000,
  annualDepreciationRate: number = 12.0, // 12% a.a. FIPE
  ipvaRate: number = 4.0, // 4% padrão SP/RJ
  insuranceRate: number = 4.5, // 4.5%
  monthlyMaintenance: number = 250, // Revisões, pneus, pastilhas
  annualOpportunityRate: number = 10.0 // Rendimento que teria se o dinheiro estivesse investido
): VehicleOwnershipResult {
  const monthlyDepreciation = (vehicleValue * (annualDepreciationRate / 100)) / 12;
  const monthlyIpva = (vehicleValue * (ipvaRate / 100)) / 12;
  const monthlyInsurance = (vehicleValue * (insuranceRate / 100)) / 12;
  const monthlyOpportunityCost = (vehicleValue * (annualOpportunityRate / 100)) / 12;

  const realMonthlyCost = monthlyDepreciation + monthlyIpva + monthlyInsurance + monthlyMaintenance + monthlyOpportunityCost;
  const realAnnualCost = realMonthlyCost * 12;

  // Valor médio de assinatura para o mesmo porte de veículo no Brasil (geralmente entre 2.2% e 2.8% do valor do carro/mês)
  const subscriptionMonthlyEquivalent = vehicleValue * 0.024;

  let verdict: 'buy_cash' | 'finance' | 'consortium' | 'subscription' = 'buy_cash';
  let recommendationReason = '';

  if (realMonthlyCost > subscriptionMonthlyEquivalent * 1.15) {
    verdict = 'subscription';
    recommendationReason = 'O custo total de posse (desvalorização + IPVA + seguro + oportunidade do capital) é superior à assinatura anual com tudo incluso.';
  } else {
    verdict = 'buy_cash';
    recommendationReason = 'Comprar à vista ou com consórcio planejado é mais barato no médio/longo prazo se você pretende manter o carro por mais de 3 anos.';
  }

  return {
    vehicleValue,
    monthlyDepreciation,
    monthlyIpva,
    monthlyInsurance,
    monthlyMaintenance,
    monthlyOpportunityCost,
    realMonthlyCost,
    realAnnualCost,
    subscriptionMonthlyEquivalent,
    verdict,
    recommendationReason
  };
}
