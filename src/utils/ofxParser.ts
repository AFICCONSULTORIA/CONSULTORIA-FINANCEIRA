import { OfxTransactionSchema, type ValidatedOfxTransaction } from '../schemas/financialSchemas';

export type ParsedOfxTransaction = ValidatedOfxTransaction;

export interface OfxMetadata {
  bankName: string;
  accountType: 'checking' | 'credit_card' | 'savings';
  accountNumber?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Mapeamento de códigos de bancos brasileiros comuns
 */
const KNOWN_BANKS: Record<string, string> = {
  '001': 'Banco do Brasil',
  '033': 'Santander',
  '104': 'Caixa Econômica Federal',
  '237': 'Bradesco',
  '260': 'Nubank',
  '341': 'Itaú Unibanco',
  '077': 'Banco Inter',
  '336': 'C6 Bank',
  '212': 'Banco Original / PicPay',
  '290': 'PagBank',
  '422': 'Banco Safra',
  '748': 'Sicredi',
  '756': 'Sicoob',
};

/**
 * Helper para extrair valor de tags suportando formatos SGML (<TAG>VALOR) e XML (<TAG>VALOR</TAG>)
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
 * Formata data de padrão OFX (ex: 20260805120000[-3:BRT] ou 20260805) para AAAA-MM-DD
 */
export function parseOfxDate(dateStr: string): string {
  if (!dateStr || dateStr.length < 8) {
    return new Date().toISOString().split('T')[0];
  }
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return `${year}-${month}-${day}`;
}

/**
 * Limpa prefixos bancários e códigos automáticos para deixar o nome do estabelecimento amigável
 */
export function cleanDescription(rawDesc: string): string {
  let cleaned = rawDesc.replace(/\s+/g, ' ').trim();

  // Remove prefixos comuns de extratos de bancos brasileiros
  const prefixes = [
    /^(COMPRA\s+(?:NO\s+)?(?:DEBITO|CREDITO|ELO|VISA|MASTER|MASTERCARD)\*?\s*)/i,
    /^(PAGTO\s+ELETRON\s+(?:COBRANCA|TITULO)?\*?\s*)/i,
    /^(PAGAMENTO\s+(?:DE\s+)?(?:BOLETO|TITULO|CONTA|CONVENIO)\*?\s*)/i,
    /^(TRANSFERENCIA\s+(?:PIX|TED|DOC|ENTRE\s+CONTAS)\*?\s*)/i,
    /^(PIX\s+(?:ENVIADO|RECEBIDO|TRANSF|PAGTO)\*?\s*)/i,
    /^(DEB(?:ITO)?\s+(?:AUTOM(?:ATICO)?|CONTA)\*?\s*)/i,
    /^(DOC\/TED\s+(?:INTERNET|ELETRON)?\*?\s*)/i,
    /^(TAR(?:IFA)?\s+(?:BANCARIA|MENSAL|EXTRATO)?\*?\s*)/i,
  ];

  for (const regex of prefixes) {
    cleaned = cleaned.replace(regex, '');
  }

  // Remove caracteres residuais no início
  cleaned = cleaned.replace(/^[\*\-\:\.\s]+/, '').trim();

  return cleaned.length > 2 ? cleaned : rawDesc;
}

/**
 * Classificador inteligente de categorias baseado em ampla base de estabelecimentos e palavras-chave
 */
export function guessCategory(description: string, type: 'income' | 'expense'): string {
  const desc = description.toLowerCase();

  if (type === 'income') {
    if (
      desc.includes('salario') || 
      desc.includes('folha') || 
      desc.includes('remuneracao') ||
      desc.includes('vencimento') ||
      desc.includes('provento') ||
      desc.includes('ordenado')
    ) {
      return 'Salário / Renda Principal';
    }

    if (
      desc.includes('rend') || 
      desc.includes('dividend') || 
      desc.includes('jcp') ||
      desc.includes('resgate') ||
      desc.includes('aplicacao') ||
      desc.includes('cdb') ||
      desc.includes('tesouro') ||
      desc.includes('b3')
    ) {
      return 'Rendimentos';
    }

    if (
      desc.includes('pix receba') || 
      desc.includes('transferencia recebida') ||
      desc.includes('estorno') ||
      desc.includes('cashback') ||
      desc.includes('reembolso')
    ) {
      return 'Renda Extra';
    }

    return 'Outros';
  } else {
    // Transporte
    if (
      desc.includes('uber') || 
      desc.includes('99app') || 
      desc.includes('99 tecnologia') || 
      desc.includes('99*') || 
      desc.includes('posto') || 
      desc.includes('combustivel') || 
      desc.includes('gasolina') || 
      desc.includes('etanol') || 
      desc.includes('shell') || 
      desc.includes('ipiranga') || 
      desc.includes('br mania') || 
      desc.includes('pedagio') || 
      desc.includes('sem parar') || 
      desc.includes('conectcar') || 
      desc.includes('veloe') || 
      desc.includes('estapar') || 
      desc.includes('estacionamento') || 
      desc.includes('bilhete unico') || 
      desc.includes('metro') || 
      desc.includes('passagem')
    ) {
      return 'Transporte';
    }

    // Alimentação
    if (
      desc.includes('ifood') || 
      desc.includes('rappi') || 
      desc.includes('supermercado') || 
      desc.includes('mercado') || 
      desc.includes('pao de acucar') || 
      desc.includes('carrefour') || 
      desc.includes('assai') || 
      desc.includes('atacadao') || 
      desc.includes('padaria') || 
      desc.includes('panificadora') || 
      desc.includes('restaurante') || 
      desc.includes('churrascaria') || 
      desc.includes('pizzaria') || 
      desc.includes('hamburguer') || 
      desc.includes('outback') || 
      desc.includes('mcdonald') || 
      desc.includes('burger king') || 
      desc.includes('subway') || 
      desc.includes('cafeteria') || 
      desc.includes('starbucks') || 
      desc.includes('hortifruti') || 
      desc.includes('acougue')
    ) {
      return 'Alimentação';
    }

    // Saúde
    if (
      desc.includes('farmacia') || 
      desc.includes('droga') || 
      desc.includes('drogasil') || 
      desc.includes('droga raia') || 
      desc.includes('pacheco') || 
      desc.includes('panvel') || 
      desc.includes('pague menos') || 
      desc.includes('hospital') || 
      desc.includes('consulta') || 
      desc.includes('clinica') || 
      desc.includes('laboratorio') || 
      desc.includes('odonto') || 
      desc.includes('dentista') || 
      desc.includes('unimed') || 
      desc.includes('amil') || 
      desc.includes('bradesco saude') || 
      desc.includes('sulamerica') || 
      desc.includes('otica')
    ) {
      return 'Saúde';
    }

    // Lazer
    if (
      desc.includes('netflix') || 
      desc.includes('spotify') || 
      desc.includes('amazon prime') || 
      desc.includes('disney') || 
      desc.includes('hbo') || 
      desc.includes('steam') || 
      desc.includes('playstation') || 
      desc.includes('xbox') || 
      desc.includes('nintendo') || 
      desc.includes('cinema') || 
      desc.includes('cinemark') || 
      desc.includes('sympla') || 
      desc.includes('ingresso') || 
      desc.includes('bar') || 
      desc.includes('pub') || 
      desc.includes('cervejaria') || 
      desc.includes('show') || 
      desc.includes('teatro')
    ) {
      return 'Lazer';
    }

    // Moradia e Custos Fixos
    if (
      desc.includes('enel') || 
      desc.includes('cpfl') || 
      desc.includes('cemig') || 
      desc.includes('light') || 
      desc.includes('sabesp') || 
      desc.includes('copasa') || 
      desc.includes('compesa') || 
      desc.includes('internet') || 
      desc.includes('claro') || 
      desc.includes('vivo') || 
      desc.includes('tim') || 
      desc.includes('aluguel') || 
      desc.includes('condominio') || 
      desc.includes('iptu') || 
      desc.includes('gas') || 
      desc.includes('seguro')
    ) {
      return 'Custo Fixo';
    }

    // Educação
    if (
      desc.includes('faculdade') || 
      desc.includes('universidade') || 
      desc.includes('escola') || 
      desc.includes('colegio') || 
      desc.includes('curso') || 
      desc.includes('udemy') || 
      desc.includes('alura') || 
      desc.includes('livraria') || 
      desc.includes('saraiva')
    ) {
      return 'Educação';
    }

    // Investimento
    if (
      desc.includes('xp invest') || 
      desc.includes('rico') || 
      desc.includes('clear') || 
      desc.includes('nu invest') || 
      desc.includes('btg pactual') || 
      desc.includes('corretora') || 
      desc.includes('aporte') || 
      desc.includes('tesouro direto')
    ) {
      return 'Investimento';
    }

    return 'Outros';
  }
}

/**
 * Extrai metadados do cabeçalho do arquivo OFX (Instituição financeira, conta, período)
 */
export function extractOfxMetadata(ofxText: string): OfxMetadata {
  const isCreditCard = ofxText.includes('<ACCTTYPE>CREDITLINE') || /CREDITCARD/i.test(ofxText);
  const org = getTagValue(ofxText, 'ORG');
  const fid = getTagValue(ofxText, 'FID');
  const bankId = getTagValue(ofxText, 'BANKID');
  const acctId = getTagValue(ofxText, 'ACCTID');
  const dtStart = getTagValue(ofxText, 'DTSTART');
  const dtEnd = getTagValue(ofxText, 'DTEND');

  let bankName = org;
  if (!bankName && bankId && KNOWN_BANKS[bankId]) {
    bankName = KNOWN_BANKS[bankId];
  } else if (!bankName && fid && KNOWN_BANKS[fid]) {
    bankName = KNOWN_BANKS[fid];
  } else if (!bankName) {
    bankName = isCreditCard ? 'Fatura de Cartão de Crédito' : 'Extrato Bancário';
  }

  return {
    bankName,
    accountType: isCreditCard ? 'credit_card' : 'checking',
    accountNumber: acctId || undefined,
    startDate: dtStart ? parseOfxDate(dtStart) : undefined,
    endDate: dtEnd ? parseOfxDate(dtEnd) : undefined,
  };
}

/**
 * Faz a leitura de uma string OFX com sanitização e validação estrita via Zod em tempo de execução.
 * Descarta ou filtra automaticamente qualquer anomalia que pudesse quebrar a UI ou o banco de dados.
 */
export function parseOfx(ofxText: string): ParsedOfxTransaction[] {
  if (!ofxText || typeof ofxText !== 'string') return [];

  const transactions: ParsedOfxTransaction[] = [];

  // Detectar se é extrato de cartão de crédito ou conta corrente
  const isCreditCard = ofxText.includes('<ACCTTYPE>CREDITLINE') || /CREDITCARD/i.test(ofxText);

  // Extrair todos os blocos de transação <STMTTRN>...</STMTTRN>
  const stmttrnRegex = /<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>)|$)/gi;
  let match: RegExpExecArray | null;

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

    // Ordem de precedência para descrição: MEMO > NAME > Padrão
    let rawDescription = memo || name || 'Lançamento OFX';
    let description = cleanDescription(rawDescription);

    const paymentMethod = isCreditCard ? 'Cartão de Crédito' : 'Extrato Bancário';

    // Parse numérico resiliente
    let numericAmt = parseFloat(rawAmt.replace(',', '.'));
    if (isNaN(numericAmt)) continue;

    // Determinar tipo (receita / despesa) e valor positivo absoluto
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

    // Se o valor for 0, ignora lançamento inválido
    if (numericAmt <= 0) continue;

    const date = parseOfxDate(dtPostedRaw);
    const category = guessCategory(rawDescription, type);

    index++;
    const rawCandidate = {
      id: fitid || `ofx-${date}-${index}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      description,
      amount: numericAmt,
      date,
      fitid: fitid || undefined,
      selected: true,
      category,
      paymentMethod,
    };

    // Validação estrita em tempo de execução com Zod
    const validationResult = OfxTransactionSchema.safeParse(rawCandidate);
    if (validationResult.success) {
      transactions.push(validationResult.data);
    } else {
      console.warn('Transação OFX ignorada por inconformidade com schema Zod:', validationResult.error.format());
    }
  }

  return transactions;
}
