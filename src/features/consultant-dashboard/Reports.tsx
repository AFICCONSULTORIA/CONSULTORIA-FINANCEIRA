import React from 'react';
import { Download, BarChart2, PieChart } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const Reports: React.FC = () => {
  return (
    <div style={{ padding: '3rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Relatórios</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Estatísticas da sua carteira de clientes e exportações em PDF.</p>
        </div>
        <Button variant="outline"><Download size={18} /> Exportar Consolidado</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <BarChart2 size={20} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Evolução do Health Score</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            A média do Health Score da sua carteira subiu <strong>+12 pontos</strong> neste trimestre. A maioria dos clientes saiu da zona de alerta.
          </p>
          <div style={{ height: '150px', background: 'var(--bg-input)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>[Gráfico de Barras - Em breve]</span>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <PieChart size={20} color="var(--info)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Distribuição de Status</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Visualização de quantos clientes estão em estado Crítico, Atenção, Bom ou Excelente.
          </p>
          <div style={{ height: '150px', background: 'var(--bg-input)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>[Gráfico de Pizza - Em breve]</span>
          </div>
        </Card>

      </div>
    </div>
  );
};
