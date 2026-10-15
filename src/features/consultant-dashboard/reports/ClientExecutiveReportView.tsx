import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Download, Printer, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ClientExecutivePdfDocument, type ClientExecutivePdfProps } from './ClientExecutivePdfDocument';

interface ClientExecutiveReportViewProps {
  reportData: ClientExecutivePdfProps;
}

export const ClientExecutiveReportView: React.FC<ClientExecutiveReportViewProps> = ({ reportData }) => {
  const fileName = `Dossie_Financeiro_AFIC_${reportData.clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

  const formatCurrency = (val: number) =>
    Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="anim-fade-up">
      {/* Barra de Ações do Relatório */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Dossiê Financeiro & Relatório Executivo 360°
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
            Documento consolidado pronto para apresentação, arquivamento ou envio ao cliente.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Button variant="outline" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Printer size={16} /> Imprimir Tela
          </Button>

          {/* Download nativo de PDF vetorizado gerado por @react-pdf/renderer */}
          <PDFDownloadLink
            document={<ClientExecutivePdfDocument {...reportData} />}
            fileName={fileName}
            style={{ textDecoration: 'none' }}
          >
            {({ loading }) => (
              <Button
                variant="primary"
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '180px', justifyContent: 'center' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="anim-spin" /> Compilando PDF...
                  </>
                ) : (
                  <>
                    <Download size={16} /> Baixar Dossiê em PDF
                  </>
                )}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      {/* Visualização Prévia do Dossiê Formatada */}
      <Card style={{ padding: '2.5rem', background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        {/* Header do Dossiê */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0284c7', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0284c7', margin: 0, letterSpacing: '0.5px' }}>
              AFIC CONSULTORIA FINANCEIRA
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>
              Wealth Management & Planejamento Patrimonial 360°
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <strong style={{ fontSize: '1rem', color: '#0f172a', display: 'block' }}>
              Cliente: {reportData.clientName}
            </strong>
            {reportData.clientEmail && (
              <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>{reportData.clientEmail}</span>
            )}
            <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>
              Emissão: {reportData.date}
            </span>
          </div>
        </div>

        {/* 1. Diagnóstico & Indicadores de Saúde */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', background: '#f1f5f9', padding: '0.5rem 0.75rem', borderRadius: '4px', textTransform: 'uppercase', marginBottom: '1rem' }}>
            1. Diagnóstico & Indicadores de Saúde Financeira
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Health Score</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0284c7', margin: '0.25rem 0 0' }}>
                {reportData.healthScore}/100
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>
                Status: {reportData.healthStatus}
              </span>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Renda Mensal Líquida</span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0 0' }}>
                {formatCurrency(reportData.monthlyIncome)}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
                Poupança: {reportData.savingRate}%
              </span>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Custos Fixos</span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0 0' }}>
                {formatCurrency(reportData.fixedCosts)}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {reportData.monthlyIncome > 0 ? Math.round((reportData.fixedCosts / reportData.monthlyIncome) * 100) : 0}% da renda
              </span>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Patrimônio Líquido</span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#16a34a', margin: '0.25rem 0 0' }}>
                {formatCurrency(reportData.totalEquity)}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Reserva: {reportData.emergencyFundMonths} meses
              </span>
            </div>
          </div>
        </div>

        {/* 2. Estratégia dos 5 Baldes de Orçamento */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', background: '#f1f5f9', padding: '0.5rem 0.75rem', borderRadius: '4px', textTransform: 'uppercase', marginBottom: '1rem' }}>
            2. Estratégia dos 5 Baldes de Orçamento Mensal
          </h4>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Balde / Categoria</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700, textAlign: 'center' }}>% Alvo</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700, textAlign: 'right' }}>Teto Orçado (R$)</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Diretriz Estratégica</th>
                </tr>
              </thead>
              <tbody>
                {reportData.buckets.map((b, i) => (
                  <tr key={b.type || i} style={{ borderTop: '1px solid #e2e8f0', background: i % 2 === 1 ? '#f8fafc' : '#ffffff' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>{b.label}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 800, color: '#0284c7' }}>{b.percentage}%</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(b.amount)}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{b.description || 'Gestão estratégica de fluxo.'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Diretriz de Investimentos BESST */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', background: '#f1f5f9', padding: '0.5rem 0.75rem', borderRadius: '4px', textTransform: 'uppercase', marginBottom: '1rem' }}>
            3. Diretriz de Investimentos & Estratégia BESST
          </h4>

          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <strong style={{ fontSize: '0.95rem', color: '#0284c7', display: 'block', marginBottom: '0.4rem' }}>
              Perfil de Investidor: {(reportData.riskProfile || 'Moderado').toUpperCase()}
            </strong>
            <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
              A alocação recomendada prioriza a construção de renda passiva sólida através do método BESST (Bancos, Energia,
              Saneamento, Seguros e Telecomunicações), ativos indexados ao IPCA+ para blindagem da inflação no longo prazo e
              Fundos Imobiliários de tijolo/logística para proventos mensais isentos. Rebalanceamento orientado por aportes sem necessidade de giro desnecessário de carteira.
            </p>
          </div>
        </div>

        {/* 4. Plano de Ação Estratégico */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', background: '#f1f5f9', padding: '0.5rem 0.75rem', borderRadius: '4px', textTransform: 'uppercase', marginBottom: '1rem' }}>
            4. Plano de Ação Estratégico & Checklist
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {reportData.actionPlans.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                Nenhuma pendência ou plano de ação crítico registrado para este ciclo.
              </p>
            ) : (
              reportData.actionPlans.map((plan, i) => (
                <div key={plan.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.85rem' }}>{i + 1}.</span>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>{plan.title}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: plan.status === 'completed' ? '#dcfce7' : '#fef3c7', color: plan.status === 'completed' ? '#166534' : '#92400e' }}>
                    {plan.status === 'completed' ? 'Concluída' : 'Em andamento'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assinatura do Consultor e Cliente */}
        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>AFIC Consultoria Financeira • Gestão Patrimonial</p>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Documento emitido para fins de consultoria estratégica confidencial.</p>
          </div>
          <div style={{ textAlign: 'center', minWidth: '220px' }}>
            <div style={{ borderBottom: '1px solid #334155', marginBottom: '0.35rem', height: '30px' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block' }}>
              {reportData.consultantName || 'Consultor Financeiro AFIC'}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Planejador Financeiro Responsável</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
