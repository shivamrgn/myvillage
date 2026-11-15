import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

export const AuthContext = createContext(null);

const DEMO_ADMIN_SESSION_KEY = 'gram_samadhan_demo_admin';
const VALID_ADMIN_ROLES = ['panchayat_admin', 'block_admin', 'super_admin'];

/**
 * Validates whether the given user object possesses a verified administrator role.
 * Role is primarily stored in app_metadata (immutable by users, set by service-role only).
 */
export function checkIsAdminUser(user) {
  if (!user) return false;
  if (user.id === 'admin-demo-id') return true;

  const appRole  = user.app_metadata?.role;
  const userRole = user.user_metadata?.role;

  return VALID_ADMIN_ROLES.includes(appRole) || VALID_ADMIN_ROLES.includes(userRole);
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync session with Supabase Auth or local demo storage
  useEffect(() => {
    let mounted = true;

    if (isSupabaseConfigured && supabase) {
      // 1. Initial session load
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!mounted) return;
        const currentUser = session?.user ?? null;
        if (currentUser && !checkIsAdminUser(currentUser)) {
          console.warn('[AuthContext] Authenticated user is not an administrator. Role:', currentUser.app_metadata?.role);
          setUser(null);
        } else {
          setUser(currentUser);
        }
        setLoading(false);
      }).catch((err) => {
        console.error('[AuthContext] Session retrieval error:', err);
        if (mounted) setLoading(false);
      });

      // 2. Auth state subscription (token refresh, sign out, sign in)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;
        const currentUser = session?.user ?? null;
        if (currentUser && !checkIsAdminUser(currentUser)) {
          setUser(null);
        } else {
          setUser(currentUser);
        }
        setLoading(false);
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    } else {
      // Demo authentication mode
      const savedDemo = localStorage.getItem(DEMO_ADMIN_SESSION_KEY);
      if (savedDemo) {
        try {
          setUser(JSON.parse(savedDemo));
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    }
  }, []);

  /**
   * Log in an administrator with email and password.
   * Rejects users lacking an authorized administrator role on the backend.
   */
  const login = useCallback(async (email, password) => {
    const trimmedEmail = (email || '').trim();
    if (!trimmedEmail || !password) {
      throw new Error('Please provide both official email and password.');
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) throw error;

      // Verify administrator role
      if (!checkIsAdminUser(data.user)) {
        await supabase.auth.signOut();
        const err = new Error(
          'Access Denied: Your account does not have administrator privileges for Gram Samadhan. (अनधिकृत पहुंच: आपके खाते के पास व्यवस्थापक अधिकार नहीं हैं)'
        );
        err.code = 'ERR_UNAUTHORIZED_ROLE';
        throw err;
      }

      setUser(data.user);
      return data.user;
    }

    // ── Demo authentication mode ───────────────────────────────────────────────
    await new Promise(r => setTimeout(r, 400)); // simulated latency
    const demoUser = {
      id: 'admin-demo-id',
      email: trimmedEmail,
      app_metadata: {
        role: 'panchayat_admin',
      },
      user_metadata: {
        full_name: 'ग्राम सचिव / सरपंच (Gram Sachiv)',
        role: 'panchayat_admin',
        village: 'सुंदरपुर (Sundarpur)',
      },
    };
    localStorage.setItem(DEMO_ADMIN_SESSION_KEY, JSON.stringify(demoUser));
    setUser(demoUser);
    return demoUser;
  }, []);

  /**
   * Log out administrator and purge active session.
   */
  const logout = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[AuthContext] Sign out error:', err);
      }
    }
    localStorage.removeItem(DEMO_ADMIN_SESSION_KEY);
    setUser(null);
  }, []);

  /**
   * Request password reset link for administrator email.
   */
  const resetPassword = useCallback(async (email) => {
    const trimmed = (email || '').trim();
    if (!trimmed) {
      throw new Error('Please enter your official administrator email.');
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${window.location.origin}/admin/login?reset=success`,
      });
      if (error) throw error;
      return true;
    }

    // Demo simulation
    await new Promise(r => setTimeout(r, 600));
    return true;
  }, []);

  const isAdmin = checkIsAdminUser(user);

  const value = {
    user,
    loading,
    isAdmin,
    adminRole: user?.app_metadata?.role || user?.user_metadata?.role || 'panchayat_admin',
    adminName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Gram Panchayat Admin',
    adminVillage: user?.user_metadata?.village || 'ग्राम पंचायत सुंदरपुर',
    login,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
