import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'trainer';
  avatar?: string;
  code?: string | null;
  profilePicture?: string | null;
  authProvider?: string;
  blockMessage?: string | null;
  status?: string;
  updatedAt?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  fetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    // Specifically NOT setting isLoading here if called from inside the init effect
    // but the fetchProfile itself might be called from elsewhere.
    // Let's keep it simple.
    try {
      const response = await authApi.getTrainerDetail();
      const data = response.data;

      setUser(prev => ({
        ...prev,
        id: data.id,
        name: data.name,
        email: data.email,
        code: data.code,
        status: data.status,
        profilePicture: data.profilePicture,
        role: (prev?.role || 'trainer') as 'admin' | 'trainer',
      }));
    } catch (err: any) {
      console.error('Failed to fetch profile:', err);
      throw new Error(err.response?.data?.message || 'Failed to fetch profile');
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await fetchProfile();
        } catch (error) {
          console.error('Session restoration failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(email, password);
      const data = response.data;

      // Map API user to local User type
      const userData: User = {
        ...data.user,
        role: 'trainer', // Default role since API doesn't specify
      };

      setUser(userData);
      if (data.accessToken) {
        localStorage.setItem('token', data.accessToken);
      }
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }, []);



  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  }, []);

  const updateProfile = useCallback((data: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateProfile,
        fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
