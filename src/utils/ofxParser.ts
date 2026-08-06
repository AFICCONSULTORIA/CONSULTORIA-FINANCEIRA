export interface ParsedOfxTransaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  fitid?: string;
  selected?: boolean;
  category?: string;
  paymentMethod?: string;
  installmentInfo?: string;
}

/**
 * Helper to extract tag value handling both SGML (<TAG>VALUE) and XML (<TAG>VALUE</TAG>)
 */
function getTagValue(block: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}>([^<\\r\\n]+)`, 'i');
  const match = block.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  }
  return '';
}

/**
 * Format OFX Date string (e.g., 20260805120000[-3:BRT] or 20260805) to YYYY-MM-DD
 */
function parseOfxDate(dateStr: string): string {
  if (!dateStr || dateStr.length < 8) {
    return new Date().toISOString().split('T')[0];
  }
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return `${year}-${month}-${day}`;
}

/**
 * Simple keyword-based category guesser
 */
function guessCategory(description: string, type: 'income' | 'expense'): string {
  const desc = description.toLowerCase();
  
  if (type === 'income') {
    if (desc.includes('salario') || desc.includes('folha') || desc.includes('remuneracao')) return 'Salário / Renda Principal';
    if (desc.includes('rend') || desc.includes('dividend') || desc.includes('jcp')) return 'Rendimentos';
    if (desc.includes('pix receba') || desc.includes('transferencia recebida')) return 'Renda Extra';
    return 'Outros';
  } else {
    if (desc.includes('uber') || desc.includes('99') || desc.includes('posto') || desc.includes('combustivel') || desc.includes('shell') || desc.includes('ipiranga')) return 'Transporte';
    if (desc.includes('ifood') || desc.includes('supermercado') || desc.includes('mercado') || desc.includes('padaria') || desc.includes('restaurante') || desc.includes('outback') || desc.includes('burger')) return 'Alimentação';
    if (desc.includes('farmacia') || desc.includes('drogasil') || desc.includes('droga') || desc.includes('hospital') || desc.includes('consulta') || desc.includes('unimed')) return 'Saúde';
    if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('steam') || desc.includes('cinema') || desc.includes('sympla')) return 'Lazer';
    if (desc.includes('luz') || desc.includes('agua') || desc.includes('enel') || desc.includes('sabesp') || desc.includes('internet') || desc.includes('claro') || desc.includes('vivo') || desc.includes('aluguel')) return 'Custo Fixo';
    return 'Outros';
  }
}

/**
 * Parses an OFX string into a structured array of transactions
 */
export function parseOfx(ofxText: string): ParsedOfxTransaction[] {
  const transactions: ParsedOfxTransaction[] = [];
  
  // Detect if this is a credit card OFX
  const isCreditCard = ofxText.includes('<ACCTTYPE>CREDITLINE') || /CREDITCARD/i.test(ofxText);
  
  // Extract all <STMTTRN>...</STMTTRN> or <STMTTRN>... until next tag/end
  const stmttrnRegex = /<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>)|$)/gi;
  let match;

  let index = 0;
  while ((match = stmttrnRegex.exec(ofxText)) !== null) {
    const block = match[1];
    if (!block || block.trim().length === 0) continue;

    const trnTypeRaw = getTagValue(block, 'TRNTYPE').toUpperCase();
    const rawAmt = getTagValue(block, 'TRNAMT');
    const dtPostedRaw = getTagValue(block, 'DTPOSTED');
    const memo = getTagValue(block, 'MEMO');
    const name = getTagValue(block, 'NAME');
    const fitid = getTagValue(block, 'FITID');

    // Description precedence: MEMO > NAME > default
    let description = memo || name || 'Lançamento OFX';
    // Clean up extra spaces
    description = description.replace(/\s+/g, ' ').trim();

    // Parse installment info from description like "01/05", "1/12", "02/10"
    let installmentInfo = undefined;
    const installmentMatch = description.match(/(?:PARC|PARCELA|PCD|-|\s)?\s*(\d{1,2})\/(\d{1,2})\b/i);
    if (installmentMatch) {
      installmentInfo = `Parcela ${installmentMatch[1]} de ${installmentMatch[2]}`;
    }

    // Determine payment method
    let paymentMethod = isCreditCard ? 'Cartão de Crédito' : 'Extrato Bancário';

    // Parse amount
    let numericAmt = parseFloat(rawAmt.replace(',', '.'));
    if (isNaN(numericAmt)) continue;

    // Determine type and absolute amount
    let type: 'income' | 'expense';
    if (numericAmt < 0 || trnTypeRaw === 'DEBIT') {
      type = 'expense';
      numericAmt = Math.abs(numericAmt);
    } else if (numericAmt > 0 || trnTypeRaw === 'CREDIT') {
      type = 'income';
    } else {
      type = numericAmt >= 0 ? 'income' : 'expense';
      numericAmt = Math.abs(numericAmt);
    }

    const date = parseOfxDate(dtPostedRaw);
    const category = guessCategory(description, type);

    index++;
    transactions.push({
      id: fitid || `ofx-${date}-${index}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      description,
      amount: numericAmt,
      date,
      fitid,
      selected: true,
      category,
      paymentMethod,
      installmentInfo
    });
  }

  return transactions;
}
