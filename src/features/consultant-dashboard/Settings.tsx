import React, { useState } from 'react';
import { Save, User, Bell, Shield } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const Settings: React.FC = () => {
  const [name, setName] = useState('Consultor AFIC');
  const [email, setEmail] = useState('consultor@afic.com');

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
          <div style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={18} /> Notificações
          </div>
          <div style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
              />
            </div>
            
            <div>
              <label className="afic-label">E-mail Profissional</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>

            <div>
              <label className="afic-label">Foto de Perfil</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--bg-app)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User color="var(--text-muted)" />
                </div>
                <Button variant="outline" size="sm">Fazer Upload</Button>
              </div>
            </div>
          </div>

          <hr className="afic-divider" style={{ margin: '2rem 0' }} />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button><Save size={18} /> Salvar Alterações</Button>
          </div>
        </Card>

      </div>
    </div>
  );
};
