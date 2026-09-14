import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'admin' | 'client';
export type AccountStatus = 'pending' | 'active' | 'suspended';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: AccountStatus;
  cliente_id?: string | null;
  plan_status?: 'trial' | 'active' | 'suspended' | 'expired';
  plan_ends_at?: string | null;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId?: string) {
    const id = userId || session?.user.id;
    if (!id) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id,email,full_name,role,status')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return setProfile(null);
    const { data: plan } = await supabase
      .from('account_subscriptions')
      .select('status,ends_at')
      .eq('user_id', id)
      .maybeSingle();
    setProfile({ ...data, plan_status: plan?.status, plan_ends_at: plan?.ends_at || null } as UserProfile);
  }

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      try {
        if (data.session) await loadProfile(data.session.user.id);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setLoading(false);
        return;
      }
      window.setTimeout(() => {
        loadProfile(nextSession.user.id).catch(console.error).finally(() => setLoading(false));
      }, 0);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user || null,
    profile,
    loading,
    refreshProfile: () => loadProfile(),
    signOut: async () => { await supabase.auth.signOut({ scope: 'local' }); },
  }), [session, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return value;
}
