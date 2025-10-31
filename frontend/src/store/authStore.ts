import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import api from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: string, stellarAccountId?: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        set({
          user: response.data.user,
          token: response.data.token,
          isAuthenticated: true,
        });
        localStorage.setItem('token', response.data.token);
      },
      register: async (email: string, password: string, role: string, stellarAccountId?: string) => {
        const response = await api.post('/auth/register', {
          email,
          password,
          role,
          stellarAccountId,
        });
        set({
          user: response.data.user,
          token: response.data.token,
          isAuthenticated: true,
        });
        localStorage.setItem('token', response.data.token);
      },
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        localStorage.removeItem('token');
      },
      setUser: (user: User) => set({ user, isAuthenticated: true }),
      setToken: (token: string) => {
        set({ token, isAuthenticated: true });
        localStorage.setItem('token', token);
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

