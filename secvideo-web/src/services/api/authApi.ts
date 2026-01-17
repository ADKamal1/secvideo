import { api } from './apiClient';
import { deviceFingerprintService } from '../security/deviceFingerprint';
import type { AuthResponse, User, DeviceVerificationRequest } from '@/types';

export interface LoginRequest {
  email: string;
  password: string;
  deviceHash: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'student' | 'instructor';
}

export const authApi = {
  /**
   * Login with email and password
   * Will return requiresDeviceVerification if device is not recognized
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const deviceHash = await deviceFingerprintService.getDeviceHash();
    
    return api.post<AuthResponse>('/auth/login', {
      email,
      password,
      deviceHash,
    });
  },

  /**
   * Verify a new device with the code sent via email
   */
  async verifyDevice(code: string, tempToken: string): Promise<AuthResponse> {
    const deviceHash = await deviceFingerprintService.getDeviceHash();
    const deviceInfo = await deviceFingerprintService.getFingerprint();

    const request: DeviceVerificationRequest = {
      code,
      deviceHash,
      deviceInfo,
    };

    return api.post<AuthResponse>('/auth/verify-device', request, {
      headers: {
        Authorization: `Bearer ${tempToken}`,
      },
    });
  },

  /**
   * Request a new device verification code
   */
  async resendVerificationCode(tempToken: string): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/resend-verification', {}, {
      headers: {
        Authorization: `Bearer ${tempToken}`,
      },
    });
  },

  /**
   * Check if current session is valid
   */
  async validateSession(): Promise<{ valid: boolean; user: User }> {
    const deviceHash = await deviceFingerprintService.getDeviceHash();
    
    return api.get<{ valid: boolean; user: User }>('/auth/session', {
      headers: {
        'X-Device-Hash': deviceHash,
      },
    });
  },

  /**
   * Logout and invalidate session
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    }
  },

  /**
   * Register a new user (admin only or open registration)
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const deviceHash = await deviceFingerprintService.getDeviceHash();
    
    return api.post<AuthResponse>('/auth/register', {
      ...data,
      deviceHash,
    });
  },

  /**
   * Request password reset email
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/forgot-password', { email });
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/reset-password', {
      token,
      password,
    });
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    return api.get<User>('/auth/profile');
  },

  /**
   * Update current user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    return api.patch<User>('/auth/profile', data);
  },

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  /**
   * Get user's registered devices (for admin or self)
   */
  async getDevices(): Promise<Array<{
    id: string;
    deviceInfo: string;
    isVerified: boolean;
    lastUsed: string;
  }>> {
    return api.get('/auth/devices');
  },

  /**
   * Remove a registered device
   */
  async removeDevice(deviceId: string): Promise<void> {
    return api.delete(`/auth/devices/${deviceId}`);
  },
};

