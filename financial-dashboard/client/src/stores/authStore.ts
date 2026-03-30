import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name?: string;
  companyName?: string;
  baseCurrency?: string;
  timezone?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setIsAuthenticated: (value: boolean) => void;
  setIsLoading: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user }),
      setAccessToken: (token) => {
        if (token) {
          localStorage.setItem('access_token', token);
        } else {
          localStorage.removeItem('access_token');
        }
        set({ accessToken: token });
      },
      setIsAuthenticated: (value) => set({ isAuthenticated: value }),
      setIsLoading: (value) => set({ isLoading: value }),
      logout: () => {
        localStorage.removeItem('access_token');
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated, accessToken: state.accessToken }),
    }
  )
);
