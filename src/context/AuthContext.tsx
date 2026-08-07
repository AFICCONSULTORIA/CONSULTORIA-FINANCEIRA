import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  role: 'client' | 'consultant' | 'admin' | null;
  realRole: 'client' | 'consultant' | 'admin' | null;
  setMockedRole?: (role: 'client' | 'consultant' | 'admin' | null) => void;
  hasCompletedOnboarding: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [realRole, setRealRole] = useState<'client' | 'consultant' | 'admin' | null>(null);
  const [mockedRole, setMockedRoleState] = useState<'client' | 'consultant' | 'admin' | null>(() => {
    return (localStorage.getItem('afic_mock_role') as any) || null;
  });
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  const setMockedRole = (newRole: 'client' | 'consultant' | 'admin' | null) => {
    if (newRole) {
      localStorage.setItem('afic_mock_role', newRole);
    } else {
      localStorage.removeItem('afic_mock_role');
    }
    setMockedRoleState(newRole);
  };

  const role = realRole === 'admin' && mockedRole ? mockedRole : realRole;

  useEffect(() => {
    // Busca a sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escuta mudanças de autenticação (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setRealRole(null);
        setHasCompletedOnboarding(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role, has_completed_onboarding')
        .eq('id', userId)
        .single();
        
      if (data && !error) {
        setRealRole(data.role);
        setHasCompletedOnboarding(data.has_completed_onboarding || false);
      }
    } catch (err) {
      console.error("Erro ao buscar papel do usuário", err);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, role, realRole, setMockedRole, hasCompletedOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
