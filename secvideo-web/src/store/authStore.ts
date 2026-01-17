import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { deviceFingerprintService } from '@/services/security/deviceFingerprint';
import { sessionManager } from '@/services/security/sessionManager';
import { authApi } from '@/services/api/authApi';
import type { User, AuthState } from '@/types';

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  verifyDevice: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<boolean>;
  clearError: () => void;
  setTempToken: (token: string) => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  token: null,
  deviceId: null,
  sessionId: null,
  isAuthenticated: false,
  isDeviceVerified: false,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApi.login(email, password);

          if (response.requiresDeviceVerification) {
            // New device detected - need verification
            set({
              isLoading: false,
              isDeviceVerified: false,
              token: response.tempToken || null,
              user: null,
              isAuthenticated: false,
            });
            return;
          }

          // Device already verified - login successful
          set({
            user: response.user,
            token: response.token,
            deviceId: response.deviceId,
            sessionId: response.sessionId,
            isAuthenticated: true,
            isDeviceVerified: true,
            isLoading: false,
            error: null,
          });

          // Start session heartbeat
          sessionManager.connect(response.token);

        } catch (error) {
          const message = error instanceof Error 
            ? error.message 
            : 'Login failed. Please try again.';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      verifyDevice: async (code: string) => {
        const { token } = get();
        if (!token) {
          set({ error: 'No temporary token found. Please login again.' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await authApi.verifyDevice(code, token);

          set({
            user: response.user,
            token: response.token,
            deviceId: response.deviceId,
            sessionId: response.sessionId,
            isAuthenticated: true,
            isDeviceVerified: true,
            isLoading: false,
            error: null,
          });

          // Start session heartbeat
          sessionManager.connect(response.token);

        } catch (error) {
          const message = error instanceof Error 
            ? error.message 
            : 'Device verification failed. Please try again.';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Ignore logout API errors
        }

        // Disconnect session manager
        sessionManager.disconnect();

        // Clear fingerprint cache
        deviceFingerprintService.clearCache();

        // Reset state
        set(initialState);
      },

      checkSession: async (): Promise<boolean> => {
        const { token, isAuthenticated } = get();
        
        if (!token || !isAuthenticated) {
          return false;
        }

        try {
          const response = await authApi.validateSession();
          
          if (response.valid) {
            // Update user data if needed
            set({ user: response.user });
            
            // Ensure session manager is connected
            if (!sessionManager.isConnected()) {
              sessionManager.connect(token);
            }
            
            return true;
          }
          
          // Session invalid - logout
          await get().logout();
          return false;

        } catch {
          await get().logout();
          return false;
        }
      },

      clearError: () => set({ error: null }),

      setTempToken: (token: string) => set({ token }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        deviceId: state.deviceId,
        sessionId: state.sessionId,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isDeviceVerified: state.isDeviceVerified,
      }),
    }
  )
);

// Selectors
export const selectUser = (state: AuthStore): User | null => state.user;
export const selectIsAuthenticated = (state: AuthStore): boolean => state.isAuthenticated;
export const selectIsAdmin = (state: AuthStore): boolean => state.user?.role === 'admin';
export const selectIsInstructor = (state: AuthStore): boolean => 
  state.user?.role === 'instructor' || state.user?.role === 'admin';
export const selectIsStudent = (state: AuthStore): boolean => state.user?.role === 'student';

