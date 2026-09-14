import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, LogOut, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

export const ForcePasswordResetModal: React.FC = () => {
  const { user, mustChangePassword, setMustChangePassword, signOut } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Não renderiza se o usuário não estiver logado ou não precisar trocar a senha
  if (!user || !mustChangePassword) {
    return null;
  }

  const isMinLength = newPassword.length >= 6;
  const isMatching = newPassword !== '' && newPassword === confirmPassword;
  const isNotGeneric = !['afic@123', 'padrao@123', 'mudar@123', '123456'].includes(newPassword.toLowerCase().trim());
  const canSubmit = isMinLength && isMatching && isNotGeneric && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isMinLength) {
      setErrorMsg('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (!isMatching) {
      setErrorMsg('As senhas digitadas não coincidem.');
      return;
    }

    if (!isNotGeneric) {
      setErrorMsg('A nova senha não pode ser a senha temporária padrão. Escolha uma senha pessoal segura.');
      return;
    }

    setLoading(true);

    try {
      // 1. Atualiza a senha no Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (authError) {
        throw authError;
      }

      // 2. Desmarca a flag must_change_password via RPC ou tabela direta
      const { error: rpcError } = await supabase.rpc('complete_password_reset');
      
      if (rpcError) {
        // Fallback: atualização direta na tabela users
        await supabase
          .from('users')
          .update({ must_change_password: false })
          .eq('id', user.id);
      }

      // 3. Atualiza estado global do AuthContext
      setMustChangePassword(false);
      toast.success('Senha atualizada com sucesso! Seu acesso está liberado.');
    } catch (err: any) {
      console.error('Erro ao redefinir senha:', err);
      setErrorMsg(err.message || 'Erro ao redefinir senha. Tente novamente.');
      toast.error('Erro ao atualizar senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast('Sessão encerrada.');
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backgroundColor: 'rgba(5, 10, 18, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--bg-card, #121826)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--r-xl, 16px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 24px rgba(16, 185, 129, 0.15)',
          padding: '2rem',
          color: 'var(--text-primary, #ffffff)',
          position: 'relative'
        }}
      >
        {/* Header com ícone de segurança */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div 
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(59, 130, 246, 0.2))',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.25)'
            }}
          >
            <ShieldAlert size={28} color="var(--brand-primary, #10b981)" />
          </div>

          <span 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              background: 'rgba(234, 179, 8, 0.15)',
              color: '#facc15',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              marginBottom: '0.75rem'
            }}
          >
            <KeyRound size={13} /> Primeiro Acesso / Senha Temporária
          </span>

          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.5rem', lineHeight: 1.25 }}>
            Cadastre sua Nova Senha
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.5 }}>
            Você entrou com uma senha temporária fornecida pela administração. Para sua segurança e privacidade, defina uma nova senha pessoal antes de continuar.
          </p>
        </div>

        {/* Mensagem de erro */}
        {errorMsg && (
          <div 
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--danger, #ef4444)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--r-md, 8px)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              marginBottom: '1.25rem',
              fontSize: '0.875rem'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Nova Senha */}
          <div>
            <label className="afic-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
              <span>Nova Senha Pessoal</span>
              <span style={{ fontSize: '0.75rem', color: isMinLength ? 'var(--brand-primary, #10b981)' : 'var(--text-muted, #64748b)' }}>
                Mínimo 6 caracteres
              </span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Digite sua nova senha"
                required
                minLength={6}
                autoFocus
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted, #64748b)',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirmar Nova Senha */}
          <div>
            <label className="afic-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
              <span>Confirmar Nova Senha</span>
              {confirmPassword && (
                <span style={{ 
                  fontSize: '0.75rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.25rem',
                  color: isMatching ? 'var(--brand-primary, #10b981)' : 'var(--danger, #ef4444)' 
                }}>
                  {isMatching ? <><CheckCircle2 size={12} /> Senhas conferem</> : 'As senhas não coincidem'}
                </span>
              )}
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              required
              minLength={6}
            />
          </div>

          {/* Checklist de requisitos visuais */}
          <div style={{ background: 'var(--bg-input, rgba(255,255,255,0.03))', padding: '0.75rem', borderRadius: 'var(--r-md, 8px)', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isMinLength ? 'var(--brand-primary, #10b981)' : 'var(--text-muted, #64748b)', marginBottom: '0.25rem' }}>
              <CheckCircle2 size={14} /> Mínimo de 6 caracteres
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isMatching ? 'var(--brand-primary, #10b981)' : 'var(--text-muted, #64748b)' }}>
              <CheckCircle2 size={14} /> Confirmação de senha idêntica
            </div>
          </div>

          {/* Botão de Envio */}
          <Button 
            type="submit" 
            fullWidth 
            disabled={!canSubmit}
            style={{ 
              height: '46px', 
              fontSize: '0.9375rem', 
              fontWeight: 700,
              gap: '0.5rem'
            }}
          >
            {loading ? (
              <>
                <Loader2 className="anim-spin" size={18} />
                Salvando nova senha...
              </>
            ) : (
              <>
                <Lock size={18} />
                Salvar Nova Senha e Acessar
              </>
            )}
          </Button>
        </form>

        {/* Footer / Opção de Sair */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.08))', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary, #94a3b8)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'color 0.2s'
            }}
            onMouseOver={e => (e.currentTarget.style.color = 'var(--text-primary, #ffffff)')}
            onMouseOut={e => (e.currentTarget.style.color = 'var(--text-secondary, #94a3b8)')}
          >
            <LogOut size={16} /> Sair da conta e trocar depois
          </button>
        </div>
      </div>
    </div>
  );
};
