'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setUser(null);
      setLoading(false);
      return;
    }
    
    // Fetch extended user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
      
    setUser({ ...session.user, ...profile });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMe();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      fetchMe();
    });
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [fetchMe]);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    // Fetch profile to get role
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    const fullUser = { ...data.user, ...profile };
    setUser(fullUser);
    return fullUser;
  };

  const register = async (role, formData) => {
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          role: role,
          first_name: formData.firstName,
          last_name: formData.lastName,
        }
      }
    });
    if (error) throw error;

    const userId = data.user?.id;
    if (!userId) throw new Error('User creation failed. Please try again.');

    // Attempt to upsert profile — non-blocking (trigger may handle it too)
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone: formData.phone || null,
      city: formData.city || null,
      role: role,
    });
    // Log error but don't block — trigger will create profile on email confirm
    if (profileError) {
      console.warn('Profile upsert warning (may be normal if email not confirmed yet):', profileError.message);
    }

    // If lawyer, insert extra lawyer record
    if (role === 'lawyer' && !profileError) {
      const { error: lawyerError } = await supabase.from('lawyers').upsert({
        id: userId,
        bar_number: formData.barNumber || null,
        bio: formData.biography || null,
        years_experience: parseInt(formData.yearsOfExperience) || 0,
        consultation_fee: parseFloat(formData.consultationFee) || 1000,
        verification_status: 'PENDING',
      });
      if (lawyerError) console.warn('Lawyer upsert warning:', lawyerError.message);
    }

    await fetchMe();
    return data.user;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
