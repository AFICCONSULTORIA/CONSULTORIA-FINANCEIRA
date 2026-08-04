import React, { useState } from 'react';
import { Shield, Plus, Users, Search, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export const AdminDashboard: React.FC = () => {
  const { signOut } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleCreateConsultant = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Cria a conta do consultor (Nota: Numa app real, use Edge Functions com Service Role 
      // para não deslogar o Admin. Aqui, estamos simplificando para o MVP)
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password
      });

      if (authError) throw authError;

      if (data.user) {
        const { error: dbError } = await supabase.from('users').insert({
          id: data.user.id,
          full_name: name,
          role: 'consultant'
        });
        
        if (dbError) throw dbError;
        
        setMessage(`Consultor ${name} criado com sucesso! (Atenção: Você pode ter sido deslogado pelo Supabase)`);
        setName('');
        setEmail('');
        setPassword('');
      }
    } catch (err: any) {
      setMessage(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-app)', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: 'var(--r-md)' }}>
              <Shield size={24} color="var(--brand-primary)" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Painel Master (Admin)</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Gestão Global da Plataforma</p>
            </div>
          </div>
          
          <Button variant="outline" onClick={signOut}>Sair</Button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
          
          {/* Formulário de Novo Consultor */}
          <Card>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={20} color="var(--brand-primary)" /> Cadastrar Consultor
            </h2>

            <form onSubmit={handleCreateConsultant} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="afic-label">Nome do Consultor</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                />
              </div>
              <div>
                <label className="afic-label">E-mail Profissional</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                />
              </div>
              <div>
                <label className="afic-label">Senha Inicial</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  minLength={6}
                />
              </div>
              
              <Button style={{ marginTop: '1rem' }} disabled={loading}>
                {loading ? <Loader2 className="anim-spin" size={18} /> : 'Gerar Acesso'}
              </Button>

              {message && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--r-md)', fontSize: '0.875rem', color: message.includes('Erro') ? 'var(--danger)' : 'var(--success)' }}>
                  {message}
                </div>
              )}
            </form>
          </Card>

          {/* Lista de Consultores (Mockada para o front visual) */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="var(--info)" /> Consultores Ativos
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-input)', padding: '0.5rem 1rem', borderRadius: '20px' }}>
                <Search size={16} color="var(--text-muted)" />
                <input type="text" placeholder="Buscar..." style={{ border: 'none', background: 'transparent', width: '150px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--r-md)' }}>
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Carlos Especialista</strong>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>carlos@afic.com</span>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--brand-primary)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700 }}>
                  12 Clientes
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--r-md)' }}>
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Ana Consultora</strong>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ana@afic.com</span>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--brand-primary)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700 }}>
                  8 Clientes
                </div>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};
