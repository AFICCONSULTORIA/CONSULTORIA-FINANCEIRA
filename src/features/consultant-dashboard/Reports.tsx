import React, { useEffect, useState } from 'react';
import { Download, BarChart2, PieChart as PieChartIcon, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, Tooltip as BarTooltip } from 'recharts';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

const STATUS_COLORS: Record<string, string> = {
  excellent: 'var(--success)',
  good: '#60A5FA',
  attention: 'var(--warning)',
  critical: 'var(--danger)'
};

const STATUS_LABELS: Record<string, string> = {
  excellent: 'Excelente',
  good: 'Bom',
  attention: 'Atenção',
  critical: 'Crítico'
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-card)', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
        <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{payload[0].name}</p>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{payload[0].value} cliente(s)</p>
      </div>
    );
  }
  return null;
};

export const Reports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_profiles')
        .select('health_score, status');
        
      if (error) throw error;
      
      const profiles = data || [];
      const total = profiles.length;
      
      const counts: Record<string, number> = { excellent: 0, good: 0, attention: 0, critical: 0 };
      let scoreSum = 0;
      
      profiles.forEach(p => {
        const s = p.status || 'good';
        counts[s] = (counts[s] || 0) + 1;
        scoreSum += (p.health_score || 0);
      });
      
      const avgScore = total > 0 ? Math.round(scoreSum / total) : 0;
      
      const pieData = Object.keys(counts).filter(k => counts[k] > 0).map(k => ({
        name: STATUS_LABELS[k],
        value: counts[k],
        color: STATUS_COLORS[k]
      }));

      // Mock de evolução por mês
      const barData = [
        { month: 'Jan', score: avgScore - 10 > 0 ? avgScore - 10 : avgScore },
        { month: 'Fev', score: avgScore - 5 > 0 ? avgScore - 5 : avgScore },
        { month: 'Mar', score: avgScore },
      ];

      setStats({
        total,
        avgScore,
        pieData,
        barData
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="anim-spin" size={40} color="var(--brand-primary)" />
      </div>
    );
  }

  return (
    <div style={{ padding: '1.25rem 1rem 5.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }} className="hide-on-print">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Relatórios</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Estatísticas da sua carteira de clientes e exportações em PDF.</p>
        </div>
        <Button variant="outline" onClick={handleExport}><Download size={18} /> Exportar Consolidado</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <BarChart2 size={20} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Evolução do Health Score Médio</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Acompanhe a melhoria média da saúde financeira da sua carteira nos últimos meses.
          </p>
          <div style={{ height: '250px', width: '100%' }}>
            {stats.barData && stats.barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.barData}>
                  <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <BarTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                  <Bar dataKey="score" fill="var(--brand-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Sem dados suficientes</div>
            )}
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <PieChartIcon size={20} color="var(--info)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Distribuição de Status na Carteira</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Visualização de quantos clientes estão em estado Crítico, Atenção, Bom ou Excelente.
          </p>
          <div style={{ height: '250px', width: '100%', display: 'flex', alignItems: 'center' }}>
            {stats.pieData && stats.pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="60%" height="100%">
                  <PieChart>
                    <Pie data={stats.pieData} cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" paddingAngle={2} dataKey="value">
                      {stats.pieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingLeft: '1rem' }}>
                  {stats.pieData.map((entry: any) => (
                    <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: entry.color }} />
                      {entry.name} ({entry.value})
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)' }}>Sem clientes cadastrados</div>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
};
