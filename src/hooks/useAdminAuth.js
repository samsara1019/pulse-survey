import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * 관리자 인증 상태를 관리하는 커스텀 훅
 * @returns {Object} { isAdmin: boolean, loading: boolean, user: Object|null, checkAdminStatus: Function }
 */
export const useAdminAuth = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const checkAdminStatus = async () => {
    try {
      setLoading(true);

      // 현재 로그인한 사용자 확인
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error('Error fetching user:', userError);
        setIsAdmin(false);
        setUser(null);
        return;
      }

      if (!currentUser) {
        setIsAdmin(false);
        setUser(null);
        return;
      }

      setUser(currentUser);
      // admins 테이블에서 해당 사용자가 관리자인지 확인
      const { data: adminData, error: adminError } = await supabase.from('admins').select('id').eq('user_id', currentUser.id).single();

      if (adminError) {
        if (adminError.code === 'PGRST116') {
          // No rows returned - not an admin
          console.log('User is not an admin');
        } else {
          console.error('Error checking admin status:', adminError);
        }
        setIsAdmin(false);
        return;
      }

      setIsAdmin(!!adminData);
    } catch (err) {
      console.error('Unexpected error in checkAdminStatus:', err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminStatus();

    // 인증 상태 변경 리스너 설정
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkAdminStatus();
      } else if (event === 'SIGNED_OUT') {
        setIsAdmin(false);
        setUser(null);
        setLoading(false);
      }
    });

    // 클린업
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return { isAdmin, loading, user, checkAdminStatus };
};

/**
 * 로그인 함수
 */
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    return { data: null, error };
  }
};

/**
 * 로그아웃 함수
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error };
  }
};

/**
 * SSO 로그인 (Google, GitHub 등)
 */
export const signInWithProvider = async (provider) => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: `${window.location.origin}/admin`,
      },
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('OAuth sign in error:', error);
    return { data: null, error };
  }
};
