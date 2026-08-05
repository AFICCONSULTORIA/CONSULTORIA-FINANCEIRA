export function calculateHealthScore(
  monthlyIncome: number,
  fixedCosts: number,
  totalDebt: number,
  totalEquity: number
): number {
  if (monthlyIncome <= 0) return 0; // Se não tem renda, o score base é 0 ou precisa de revisão manual

  let score = 100;

  // 1. Custos Fixos vs Renda
  const fixedCostsRatio = fixedCosts / monthlyIncome;
  if (fixedCostsRatio > 0.9) {
    score -= 30;
  } else if (fixedCostsRatio > 0.7) {
    score -= 20;
  } else if (fixedCostsRatio > 0.5) {
    score -= 10;
  }
  // Se for <= 0.5, mantém (0)

  // 2. Endividamento Mensal vs Renda
  const debtRatio = totalDebt / monthlyIncome;
  if (debtRatio === 0) {
    score += 10; // bônus
  } else if (debtRatio > 0.4) {
    score -= 40;
  } else if (debtRatio > 0.2) {
    score -= 20;
  } else if (debtRatio > 0) {
    score -= 10;
  }

  // 3. Patrimônio/Reserva vs Renda Mensal (Liquidez)
  const equityRatio = totalEquity / monthlyIncome;
  if (equityRatio >= 6) {
    score += 20;
  } else if (equityRatio >= 3) {
    score += 10;
  } else if (equityRatio < 1) {
    score -= 10;
  }

  // Limita o valor final entre 0 e 100
  if (score > 100) return 100;
  if (score < 0) return 0;

  return Math.round(score);
}
