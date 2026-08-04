import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { TrendingUp, AlertCircle, Loader2 } from 'lucide-react';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'client' | 'consultant'>('client');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Criar Auth User no Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // 2. Inserir o perfil na tabela customizada 'users'
      const { error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          full_name: name,
          role: role
        });

      if (dbError) {
        console.error("Erro ao criar perfil:", dbError);
        setError("Conta criada, mas houve um erro ao salvar o perfil.");
      } else {
        // Redireciona
        if (role === 'consultant') navigate('/consultor');
        else navigate('/onboarding');
      }
    }
    
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', padding: '2rem 0' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '2rem', background: 'var(--bg-card)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border-color)' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <TrendingUp size={40} color="var(--brand-primary)" style={{ marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Crie sua conta</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Comece sua jornada financeira</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: '0.875rem' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
            <div 
              onClick={() => setRole('client')}
              style={{ flex: 1, padding: '0.75rem', textAlign: 'center', border: `1px solid ${role === 'client' ? 'var(--brand-primary)' : 'var(--border-color)'}`, borderRadius: 'var(--r-md)', cursor: 'pointer', background: role === 'client' ? 'rgba(16, 185, 129, 0.1)' : 'transparent', color: role === 'client' ? 'var(--brand-primary-light)' : 'var(--text-secondary)', fontWeight: role === 'client' ? 600 : 400 }}
            >
              Sou Cliente
            </div>
            <div 
              onClick={() => setRole('consultant')}
              style={{ flex: 1, padding: '0.75rem', textAlign: 'center', border: `1px solid ${role === 'consultant' ? 'var(--info)' : 'var(--border-color)'}`, borderRadius: 'var(--r-md)', cursor: 'pointer', background: role === 'consultant' ? 'rgba(96, 165, 250, 0.1)' : 'transparent', color: role === 'consultant' ? 'var(--info)' : 'var(--text-secondary)', fontWeight: role === 'consultant' ? 600 : 400 }}
            >
              Sou Consultor
            </div>
          </div>

          <div>
            <label className="afic-label">Nome Completo</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>

          <div>
            <label className="afic-label">E-mail</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="afic-label">Senha</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
            />
          </div>
          
          <Button fullWidth style={{ marginTop: '1rem' }} disabled={loading}>
            {loading ? <Loader2 className="anim-spin" size={18} /> : 'Cadastrar'}
          </Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Já possui conta? <Link to="/login" style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 600 }}>Faça Login</Link>
        </p>

      </div>
    </div>
  );
};
