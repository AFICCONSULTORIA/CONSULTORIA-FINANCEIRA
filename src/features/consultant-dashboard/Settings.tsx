import React, { useState, useEffect } from 'react';
import { Save, User, Bell, Shield, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase.from('users').select('full_name').eq('id', user!.id).single();
      if (data && !error) {
        setName(data.full_name || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('users').update({ full_name: name }).eq('id', user!.id);
      if (error) throw error;
      alert('Perfil atualizado com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="anim-spin" size={40} color="var(--brand-primary)" />
      </div>
    );
  }

  return (
    <div style={{ padding: '3rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Configurações</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Gerencie seu perfil de consultor, notificações e segurança.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem' }}>
        
        {/* Menu Lateral de Configurações */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--brand-primary)', borderRadius: 'var(--r-md)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={18} /> Meu Perfil
          </div>
          <div style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => alert('Configurações de notificação em breve.')}>
            <Bell size={18} /> Notificações
          </div>
          <div style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => alert('Alteração de senha em breve.')}>
            <Shield size={18} /> Segurança
          </div>
        </div>

        {/* Formulário */}
        <Card>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Informações Básicas</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label className="afic-label">Nome Completo</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
            
            <div>
              <label className="afic-label">E-mail Profissional</label>
              <input 
                type="email" 
                value={email} 
                disabled
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-muted)', outline: 'none', cursor: 'not-allowed' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>O e-mail de acesso não pode ser alterado por aqui.</p>
            </div>

            <div>
              <label className="afic-label">Foto de Perfil</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--bg-app)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{name.charAt(0) || '?'}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => alert('Upload de foto em breve.')}>Fazer Upload</Button>
              </div>
            </div>
          </div>

          <hr className="afic-divider" style={{ margin: '2rem 0' }} />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={18} className="anim-spin" /> : <Save size={18} />}
              {saving ? ' Salvando...' : ' Salvar Alterações'}
            </Button>
          </div>
        </Card>

      </div>
    </div>
  );
};
