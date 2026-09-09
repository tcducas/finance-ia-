import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { fetchMe, type Me } from '../services/account';
import { setSessionToken } from '../services/data';

interface AuthContextValue {
  ready: boolean;
  configured: boolean;
  session: Session | null;
  profile: Me | null;
  profileError: string | null;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, fullName: string): Promise<void>;
  signOut(): Promise<void>;
  reloadProfile(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!supabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Me | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadProfile = useCallback(async (nextSession: Session | null) => {
    setSessionToken(nextSession?.access_token ?? null);
    if (!nextSession) {
      setProfile(null);
      setProfileError(null);
      return;
    }
    try {
      setProfile(await fetchMe());
      setProfileError(null);
    } catch (err) {
      setProfile(null);
      setProfileError(err instanceof Error ? err.message : 'Erro ao carregar o perfil.');
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadProfile(data.session);
      if (active) setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void loadProfile(nextSession);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSessionToken(null);
  }, []);

  const reloadProfile = useCallback(() => loadProfile(session), [loadProfile, session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      configured: supabaseConfigured,
      session,
      profile,
      profileError,
      signIn,
      signUp,
      signOut,
      reloadProfile,
    }),
    [ready, session, profile, profileError, signIn, signUp, signOut, reloadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa do AuthProvider.');
  return ctx;
}
