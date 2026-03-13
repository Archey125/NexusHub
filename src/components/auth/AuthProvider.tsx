import {useEffect, useState } from 'react';
import { AuthContext } from './useAuth';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { Center, Spinner } from '@chakra-ui/react';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
     await supabase.auth.signOut();
  };

  if (loading) return <Center h="100vh"><Spinner size="xl" /></Center>;

  return (
    <AuthContext.Provider value={{ session, user, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};