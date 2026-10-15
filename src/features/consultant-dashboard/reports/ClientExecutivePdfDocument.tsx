import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export interface ClientExecutivePdfProps {
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  consultantName?: string;
  date: string;
  healthScore: number;
  healthStatus: string;
  monthlyIncome: number;
  fixedCosts: number;
  totalDebt: number;
  totalEquity: number;
  savingRate: number;
  emergencyFundMonths: number;
  riskProfile?: string;
  buckets: {
    type: string;
    label: string;
    percentage: number;
    amount: number;
    description?: string;
  }[];
  actionPlans: {
    id: string;
    title: string;
    description?: string;
    category?: 'urgent' | 'organization' | 'growth';
    status: 'pending' | 'completed';
    due_date?: string;
  }[];
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  // Cabeçalho
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: '#0284c7',
    paddingBottom: 14,
    marginBottom: 18,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0284c7',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerMeta: {
    alignItems: 'flex-end',
  },
  metaTextBold: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  metaTextMuted: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },

  // Título da Seção
  sectionTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 10,
    marginTop: 12,
  },
  sectionTitleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Grid de Métricas Principais (Health Score e Patrimônio)
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  kpiCard: {
    width: '23%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 8,
  },
  kpiLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 3,
  },
  kpiHighlight: {
    color: '#0284c7',
  },

  // Tabela dos 5 Baldes
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCol: {
    color: '#ffffff',
    fontSize: 7.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRowEven: {
    backgroundColor: '#f8fafc',
  },
  colBucketName: { width: '25%' },
  colBucketPct: { width: '15%', textAlign: 'center' },
  colBucketAmount: { width: '25%', textAlign: 'right' },
  colBucketDesc: { width: '35%', paddingLeft: 10 },

  cellText: {
    fontSize: 8,
    color: '#334155',
  },
  cellTextBold: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#0f172a',
  },

  // Diretriz de Investimentos BESST
  besstBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
  },
  besstTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0284c7',
    marginBottom: 4,
  },
  besstText: {
    fontSize: 8,
    color: '#475569',
    lineHeight: 1.35,
  },

  // Plano de Ação
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '75%',
  },
  actionBadge: {
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 2,
    fontSize: 6.5,
    fontWeight: 'bold',
    marginRight: 6,
    textTransform: 'uppercase',
  },
  badgeUrgent: { backgroundColor: '#fee2e2', color: '#b91c1c' },
  badgeOrg: { backgroundColor: '#fef3c7', color: '#b45309' },
  badgeGrowth: { backgroundColor: '#dcfce7', color: '#15803d' },

  actionTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  actionDue: {
    fontSize: 7.5,
    color: '#64748b',
    width: '25%',
    textAlign: 'right',
  },

  // Assinaturas e Rodapé
  signaturesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 12,
  },
  signatureBlock: {
    width: '45%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#94a3b8',
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  signatureRole: {
    fontSize: 7,
    color: '#64748b',
  },

  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: '#94a3b8',
  },
});

export const ClientExecutivePdfDocument: React.FC<ClientExecutivePdfProps> = ({
  clientName,
  clientEmail,
  clientPhone,
  consultantName = 'Consultor Especialista AFIC',
  date,
  healthScore,
  healthStatus,
  monthlyIncome,
  fixedCosts,
  totalDebt,
  totalEquity,
  savingRate,
  emergencyFundMonths,
  riskProfile = 'Moderado',
  buckets,
  actionPlans,
}) => {
  const formatCurrency = (val: number) =>
    `R$ ${Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const fixedCostPct = monthlyIncome > 0 ? Math.round((fixedCosts / monthlyIncome) * 100) : 0;

  return (
    <Document title={`Relatorio_Executivo_${clientName.replace(/\s+/g, '_')}`} author="AFIC Consultoria">
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.brandTitle}>AFIC CONSULTORIA FINANCEIRA</Text>
            <Text style={styles.brandSubtitle}>Wealth Management & Planejamento Patrimonial 360°</Text>
          </View>
          <View style={styles.headerMeta}>
            <Text style={styles.metaTextBold}>Cliente: {clientName}</Text>
            {clientEmail ? <Text style={styles.metaTextMuted}>{clientEmail}</Text> : null}
            {clientPhone ? <Text style={styles.metaTextMuted}>{clientPhone}</Text> : null}
            <Text style={styles.metaTextMuted}>Emissão: {date}</Text>
          </View>
        </View>

        {/* 1. Raio-X & Indicadores de Saúde Financeira */}
        <View style={styles.sectionTitleBox}>
          <Text style={styles.sectionTitleText}>1. Diagnóstico & Indicadores de Saúde Financeira</Text>
        </View>

        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Health Score</Text>
            <Text style={[styles.kpiValue, styles.kpiHighlight]}>{healthScore}/100</Text>
            <Text style={{ fontSize: 7, color: '#64748b', marginTop: 2 }}>Status: {healthStatus.toUpperCase()}</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Renda Líquida Mensal</Text>
            <Text style={styles.kpiValue}>{formatCurrency(monthlyIncome)}</Text>
            <Text style={{ fontSize: 7, color: '#64748b', marginTop: 2 }}>Poupança: {savingRate}%</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Custos Fixos</Text>
            <Text style={styles.kpiValue}>{formatCurrency(fixedCosts)}</Text>
            <Text style={{ fontSize: 7, color: '#64748b', marginTop: 2 }}>Consumo: {fixedCostPct}% da renda</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Patrimônio Líquido</Text>
            <Text style={[styles.kpiValue, { color: '#16a34a' }]}>{formatCurrency(totalEquity)}</Text>
            <Text style={{ fontSize: 7, color: '#64748b', marginTop: 2 }}>
              {totalDebt > 0 ? `Dívida: ${formatCurrency(totalDebt)}` : `Reserva: ${emergencyFundMonths} meses`}
            </Text>
          </View>
        </View>

        {/* 2. Metodologia dos 5 Baldes de Orçamento */}
        <View style={styles.sectionTitleBox}>
          <Text style={styles.sectionTitleText}>2. Estratégia dos 5 Baldes de Orçamento Mensal</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCol, styles.colBucketName]}>Pote / Balde</Text>
            <Text style={[styles.tableHeaderCol, styles.colBucketPct]}>% Alvo</Text>
            <Text style={[styles.tableHeaderCol, styles.colBucketAmount]}>Teto Orçado (R$)</Text>
            <Text style={[styles.tableHeaderCol, styles.colBucketDesc]}>Diretriz Estratégica</Text>
          </View>

          {buckets.map((b, index) => (
            <View key={b.type || index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowEven : {}]}>
              <Text style={[styles.cellTextBold, styles.colBucketName]}>{b.label}</Text>
              <Text style={[styles.cellTextBold, styles.colBucketPct, styles.kpiHighlight]}>{b.percentage}%</Text>
              <Text style={[styles.cellText, styles.colBucketAmount]}>{formatCurrency(b.amount)}</Text>
              <Text style={[styles.cellText, styles.colBucketDesc]}>
                {b.description || 'Gestão estratégica de fluxo de caixa.'}
              </Text>
            </View>
          ))}
        </View>

        {/* 3. Estratégia de Investimentos BESST */}
        <View style={styles.sectionTitleBox}>
          <Text style={styles.sectionTitleText}>3. Diretriz de Investimentos & Estratégia BESST</Text>
        </View>

        <View style={styles.besstBox}>
          <Text style={styles.besstTitle}>Perfil do Investidor: {riskProfile.toUpperCase()}</Text>
          <Text style={styles.besstText}>
            A alocação recomendada prioriza a construção de renda passiva sólida através do método BESST (Bancos, Energia,
            Saneamento, Seguros e Telecomunicações), ativos indexados ao IPCA+ para blindagem da inflação no longo prazo e
            Fundos Imobiliários de tijolo/logística para proventos mensais isentos. Rebalanceamento orientado por aportes sem necessidade de giro desnecessário de carteira.
          </Text>
        </View>

        {/* 4. Plano de Ação & Próximos Passos */}
        <View style={styles.sectionTitleBox}>
          <Text style={styles.sectionTitleText}>4. Plano de Ação Estratégico & Checklist</Text>
        </View>

        <View style={{ marginBottom: 12 }}>
          {actionPlans.length === 0 ? (
            <Text style={{ fontSize: 8, color: '#64748b', fontStyle: 'italic', padding: 6 }}>
              Nenhuma pendência ou plano de ação crítico registrado para este ciclo.
            </Text>
          ) : (
            actionPlans.slice(0, 6).map((plan) => (
              <View key={plan.id} style={styles.actionRow}>
                <View style={styles.actionLeft}>
                  <Text
                    style={[
                      styles.actionBadge,
                      plan.category === 'urgent'
                        ? styles.badgeUrgent
                        : plan.category === 'growth'
                        ? styles.badgeGrowth
                        : styles.badgeOrg,
                    ]}
                  >
                    {plan.category || 'Geral'}
                  </Text>
                  <Text style={styles.actionTitle}>{plan.title}</Text>
                </View>
                <Text style={styles.actionDue}>
                  {plan.status === 'completed' ? 'CONCLUÍDO' : plan.due_date ? `Prazo: ${new Date(plan.due_date).toLocaleDateString('pt-BR')}` : 'EM ANDAMENTO'}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Assinaturas Formais */}
        <View style={styles.signaturesContainer}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{consultantName}</Text>
            <Text style={styles.signatureRole}>Planejador Financeiro • AFIC</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{clientName}</Text>
            <Text style={styles.signatureRole}>Cliente / Investidor</Text>
          </View>
        </View>

        {/* Rodapé / Compliance */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            AFIC Consultoria Financeira • Relatório Confidencial de Planejamento Patrimonial
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
};
