import { t } from '@/i18n';
import { create } from 'zustand';

import { apiClient } from '@/api/client/api-client';
import { tokenResponseSchema, type User } from '@/api/schemas';
import { secureStorage } from '@/lib/secure-storage';
import {
  verificationChallengeSchema,
  type VerificationChallenge,
} from '@/features/auth/email-verification';

type AuthState = {
  user: User | null;
  accessToken: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithApple: (
    identityToken: string,
    appleUserId: string,
    email?: string,
    displayName?: string,
  ) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<VerificationChallenge>;
  updateProfile: (data: {
    displayName: string;
    notifyPartnerActivity?: boolean;
    pushNotificationsEnabled?: boolean;
  }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (currentPassword?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<boolean>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  hydrated: false,
  async hydrate() {
    const tokens = await secureStorage.getTokens();
    if (!tokens.accessToken) {
      set({ hydrated: true });
      return;
    }
    try {
      const user = await apiClient<User>('/api/v1/users/me', {
        accessToken: tokens.accessToken,
      });
      set({ user, accessToken: tokens.accessToken, hydrated: true });
    } catch {
      const refreshed = await get().refresh();
      set({ hydrated: true });
      if (!refreshed) await secureStorage.clear();
    }
  },
  async signIn(email, password) {
    const raw = await apiClient<unknown>('/api/v1/auth/sign-in', {
      method: 'POST',
      body: { email, password },
    });
    const result = tokenResponseSchema.parse(raw);
    await secureStorage.setTokens(result.access_token, result.refresh_token);
    set({ user: result.user, accessToken: result.access_token });
  },
  async signInWithApple(identityToken, appleUserId, email, displayName) {
    const raw = await apiClient<unknown>('/api/v1/auth/apple', {
      method: 'POST',
      body: {
        identity_token: identityToken,
        apple_user_id: appleUserId,
        ...(email ? { email } : {}),
        ...(displayName ? { display_name: displayName } : {}),
      },
    });
    const result = tokenResponseSchema.parse(raw);
    await secureStorage.setTokens(result.access_token, result.refresh_token);
    set({ user: result.user, accessToken: result.access_token });
  },
  async signInWithGoogle(idToken) {
    const raw = await apiClient<unknown>('/api/v1/auth/google', {
      method: 'POST',
      body: {
        id_token: idToken,
      },
    });
    const result = tokenResponseSchema.parse(raw);
    await secureStorage.setTokens(result.access_token, result.refresh_token);
    set({ user: result.user, accessToken: result.access_token });
  },
  async signUp(email, password, displayName) {
    const result = await apiClient('/api/v1/auth/sign-up', {
      method: 'POST',
      body: { email, password, display_name: displayName },
    });
    return verificationChallengeSchema.parse(result);
  },
  async updateProfile({ displayName, notifyPartnerActivity, pushNotificationsEnabled }) {
    const token = get().accessToken;
    if (!token) throw new Error(t('common.noActiveSession'));
    const user = await apiClient<User>('/api/v1/users/me', {
      method: 'PATCH',
      accessToken: token,
      body: {
        display_name: displayName.trim(),
        ...(notifyPartnerActivity !== undefined
          ? { notify_partner_activity: notifyPartnerActivity }
          : {}),
        ...(pushNotificationsEnabled !== undefined
          ? { push_notifications_enabled: pushNotificationsEnabled }
          : {}),
      },
    });
    set({ user });
  },
  async changePassword(currentPassword, newPassword) {
    const token = get().accessToken;
    if (!token) throw new Error(t('common.noActiveSession'));
    await apiClient<void>('/api/v1/auth/change-password', {
      method: 'POST',
      accessToken: token,
      body: { current_password: currentPassword, new_password: newPassword },
    });
    await secureStorage.clear();
    set({ user: null, accessToken: null });
  },
  async deleteAccount(currentPassword) {
    const token = get().accessToken;
    if (token) {
      await apiClient<void>('/api/v1/users/me', {
        method: 'DELETE',
        accessToken: token,
        body: currentPassword ? { current_password: currentPassword } : {},
      });
    }
    await secureStorage.clear();
    set({ user: null, accessToken: null });
  },
  async signOut() {
    const token = get().accessToken;
    if (token) {
      try {
        await apiClient('/api/v1/auth/sign-out-all', {
          method: 'POST',
          accessToken: token,
        });
      } catch {
        /* local logout still succeeds */
      }
    }
    await secureStorage.clear();
    set({ user: null, accessToken: null });
  },
  async refresh() {
    const { refreshToken } = await secureStorage.getTokens();
    if (!refreshToken) return false;
    try {
      const raw = await apiClient<unknown>('/api/v1/auth/refresh', {
        method: 'POST',
        body: { refresh_token: refreshToken },
      });
      const result = tokenResponseSchema.parse(raw);
      await secureStorage.setTokens(result.access_token, result.refresh_token);
      set({ user: result.user, accessToken: result.access_token });
      return true;
    } catch {
      await secureStorage.clear();
      set({ user: null, accessToken: null });
      return false;
    }
  },
}));
