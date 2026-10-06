import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, Profile, Wallet, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  wallet: Wallet | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  login: (identifier: string, password: string, otp?: string) => Promise<any>;
  demoLogin: (role: UserRole) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('flexipay_user') || localStorage.getItem('payflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('flexipay_theme') || localStorage.getItem('payflow_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    localStorage.setItem('flexipay_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const refreshUserData = async () => {
    const token = localStorage.getItem('flexipay_access_token') || localStorage.getItem('payflow_access_token');
    if (!token) {
      setUser(null);
      setProfile(null);
      setWallet(null);
      setIsLoading(false);
      return;
    }

    try {
      const [profileRes, walletRes] = await Promise.all([
        api.get('/auth/me/'),
        api.get('/wallet/'),
      ]);

      if (profileRes.data?.user) {
        setUser(profileRes.data.user);
        localStorage.setItem('flexipay_user', JSON.stringify(profileRes.data.user));
      }
      if (profileRes.data?.profile) {
        setProfile(profileRes.data.profile);
      }
      if (walletRes.data?.wallet) {
        setWallet(walletRes.data.wallet);
      }
    } catch (err: any) {
      console.warn('Authentication token expired or user record refreshed:', err);
      if (err.response?.status === 401) {
        setUser(null);
        setProfile(null);
        setWallet(null);
        localStorage.removeItem('flexipay_access_token');
        localStorage.removeItem('flexipay_refresh_token');
        localStorage.removeItem('flexipay_user');
        localStorage.removeItem('payflow_access_token');
        localStorage.removeItem('payflow_refresh_token');
        localStorage.removeItem('payflow_user');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUserData();

    const handleUnauthorized = () => {
      setUser(null);
      setProfile(null);
      setWallet(null);
    };
    window.addEventListener('flexipay:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('flexipay:unauthorized', handleUnauthorized);
  }, []);

  const login = async (identifier: string, password: string, otp?: string) => {
    const res = await api.post('/auth/login/', { identifier, password, otp });
    if (res.data.status === 'requires_2fa') {
      return res.data;
    }
    if (res.data?.tokens) {
      localStorage.setItem('flexipay_access_token', res.data.tokens.access);
      localStorage.setItem('flexipay_refresh_token', res.data.tokens.refresh);
      // Compatibility
      localStorage.setItem('payflow_access_token', res.data.tokens.access);
      localStorage.setItem('payflow_refresh_token', res.data.tokens.refresh);

      setUser(res.data.user);
      localStorage.setItem('flexipay_user', JSON.stringify(res.data.user));
      await refreshUserData();
    }
    return res.data;
  };

  const demoLogin = async (role: UserRole) => {
    setIsLoading(true);
    let email = 'user@flexipay.local';
    let password = 'DemoUser@123';

    if (role === 'MERCHANT') {
      email = 'merchant@flexipay.local';
      password = 'DemoMerchant@123';
    } else if (role === 'ADMIN') {
      email = 'admin@flexipay.local';
      password = 'DemoAdmin@123';
    }

    try {
      // Try with flexipay email, fallback to payflow if seeded under old alias
      try {
        await login(email, password, '123456');
      } catch (e) {
        const fallbackEmail = email.replace('@flexipay.local', '@payflow.local');
        await login(fallbackEmail, password, '123456');
      }
    } catch (err) {
      console.error('Demo login error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    const res = await api.post('/auth/register/', data);
    if (res.data?.tokens) {
      localStorage.setItem('flexipay_access_token', res.data.tokens.access);
      localStorage.setItem('flexipay_refresh_token', res.data.tokens.refresh);
      localStorage.setItem('payflow_access_token', res.data.tokens.access);
      localStorage.setItem('payflow_refresh_token', res.data.tokens.refresh);

      setUser(res.data.user);
      localStorage.setItem('flexipay_user', JSON.stringify(res.data.user));
      await refreshUserData();
    }
  };

  const logout = () => {
    const refresh = localStorage.getItem('flexipay_refresh_token') || localStorage.getItem('payflow_refresh_token');
    if (refresh) {
      api.post('/auth/logout/', { refresh }).catch(() => {});
    }
    localStorage.removeItem('flexipay_access_token');
    localStorage.removeItem('flexipay_refresh_token');
    localStorage.removeItem('flexipay_user');
    localStorage.removeItem('payflow_access_token');
    localStorage.removeItem('payflow_refresh_token');
    localStorage.removeItem('payflow_user');
    setUser(null);
    setProfile(null);
    setWallet(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        wallet,
        isAuthenticated: !!user,
        isLoading,
        theme,
        toggleTheme,
        login,
        demoLogin,
        register,
        logout,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
