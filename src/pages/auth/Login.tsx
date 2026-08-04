import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { TrendingUp, AlertCircle, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Busca o role para redirecionar corretamente
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();
        
      if (userData?.role === 'consultant') {
        navigate('/consultor');
      } else {
        navigate('/client');
      }
    }
  };

  return (
    <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '2rem', background: 'var(--bg-card)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border-color)' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <TrendingUp size={40} color="var(--brand-primary)" style={{ marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Bem-vindo de volta</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Acesse o seu painel AFIC</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: '0.875rem' }}>Credenciais inválidas.</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
              placeholder="••••••••"
            />
          </div>
          
          <Button fullWidth style={{ marginTop: '1rem' }} disabled={loading}>
            {loading ? <Loader2 className="anim-spin" size={18} /> : 'Entrar'}
          </Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Ainda não tem conta? <Link to="/register" style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 600 }}>Cadastre-se</Link>
        </p>

      </div>
    </div>
  );
};
