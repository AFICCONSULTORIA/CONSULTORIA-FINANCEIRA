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
  hasPortfolioAccess: boolean;
  subscriptionStatus: 'active' | 'cancelled' | 'inactive';
  subscriptionCanceledAt?: string | null;
  mustChangePassword: boolean;
  setMustChangePassword: (val: boolean) => void;
  refreshUserData: () => Promise<void>;
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
  const [hasPortfolioAccess, setHasPortfolioAccess] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'cancelled' | 'inactive'>('inactive');
  const [subscriptionCanceledAt, setSubscriptionCanceledAt] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);

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
        setHasPortfolioAccess(false);
        setSubscriptionStatus('inactive');
        setSubscriptionCanceledAt(null);
        setMustChangePassword(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role, has_completed_onboarding, has_portfolio_access, must_change_password, subscription_status, subscription_canceled_at')
        .eq('id', userId)
        .single();
        
      if (error) {
        // Fallback caso colunas novas ainda não existam no banco
        const { data: fallbackData } = await supabase
          .from('users')
          .select('role, has_completed_onboarding, has_portfolio_access')
          .eq('id', userId)
          .single();
          
        if (fallbackData) {
          setRealRole(fallbackData.role);
          setHasCompletedOnboarding(fallbackData.has_completed_onboarding || false);
          const hasAccess = fallbackData.has_portfolio_access || false;
          setHasPortfolioAccess(hasAccess);
          setSubscriptionStatus(hasAccess ? 'active' : 'inactive');
        }
      } else if (data) {
        setRealRole(data.role);
        setHasCompletedOnboarding(data.has_completed_onboarding || false);
        const hasAccess = data.has_portfolio_access || false;
        setHasPortfolioAccess(hasAccess);
        setSubscriptionStatus(data.subscription_status || (hasAccess ? 'active' : 'inactive'));
        setSubscriptionCanceledAt(data.subscription_canceled_at || null);
        setMustChangePassword(Boolean(data.must_change_password));
      }
    } catch (err) {
      console.error("Erro ao buscar papel do usuário", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signOut, 
      role, 
      realRole, 
      setMockedRole, 
      hasCompletedOnboarding, 
      hasPortfolioAccess,
      subscriptionStatus,
      subscriptionCanceledAt,
      mustChangePassword,
      setMustChangePassword,
      refreshUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

