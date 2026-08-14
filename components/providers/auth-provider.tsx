'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { isDemoMode } from '@/lib/repo';
import type { AgencyRole } from '@/lib/types';

interface DemoUser {
  id: string;
  email: string;
  agency_id: string;
  role: AgencyRole;
  first_name: string;
  last_name: string;
}

interface AuthContextType {
  user: DemoUser | null;
  loading: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, string>) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  demoLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: DemoUser = {
  id: 'demo-user-001',
  email: 'admin@horizonfinancial.example',
  agency_id: 'a0000000-0000-0000-0000-000000000001',
  role: 'agency_owner',
  first_name: 'Sarah',
  last_name: 'Mitchell',
};

const DEMO_SESSION_KEY = 'agag-demo-session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for demo session first
    if (isDemoMode) {
      const stored = typeof window !== 'undefined' ? sessionStorage.getItem(DEMO_SESSION_KEY) : null;
      if (stored === 'true') {
        setUser(DEMO_USER);
      }
      setLoading(false);
      return;
    }

    // Supabase auth path
    if (!supabase || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        mapUser(session.user);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        mapUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const mapUser = (sbUser: User) => {
    const metaData = sbUser.user_metadata || {};
    const appData = (sbUser.app_metadata || {}) as Record<string, string>;
    setUser({
      id: sbUser.id,
      email: sbUser.email || '',
      agency_id: appData.agency_id || metaData.agency_id || '',
      role: (appData.role || metaData.role || 'agent') as AgencyRole,
      first_name: metaData.first_name || '',
      last_name: metaData.last_name || '',
    });
  };

  const signIn = async (email: string, password: string) => {
    if (isDemoMode) {
      // Demo mode: accept any credentials and log in as demo user
      setUser(DEMO_USER);
      sessionStorage.setItem(DEMO_SESSION_KEY, 'true');
      return { error: null };
    }

    if (!supabase) return { error: 'Authentication not configured' };

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, string>) => {
    if (isDemoMode) {
      setUser(DEMO_USER);
      sessionStorage.setItem(DEMO_SESSION_KEY, 'true');
      return { error: null };
    }

    if (!supabase) return { error: 'Authentication not configured' };

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    if (isDemoMode) {
      sessionStorage.removeItem(DEMO_SESSION_KEY);
      setUser(null);
      router.push('/login');
      return;
    }

    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    router.push('/login');
  };

  const demoLogin = () => {
    setUser(DEMO_USER);
    sessionStorage.setItem(DEMO_SESSION_KEY, 'true');
  };

  return (
    <AuthContext.Provider value={{ user, loading, isDemo: isDemoMode, signIn, signUp, signOut, demoLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
