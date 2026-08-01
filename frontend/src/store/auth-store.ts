import { create } from 'zustand';

import { apiClient } from '@/api/client/api-client';
import { tokenResponseSchema, type User } from '@/api/schemas';
import { secureStorage } from '@/lib/secure-storage';

type AuthState = {
  user: User | null;
  accessToken: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  updateProfile: (data: {
    displayName: string;
    avatarUrl?: string | null;
    notifyPartnerActivity?: boolean;
    pushNotificationsEnabled?: boolean;
  }) => Promise<void>;
  deleteAccount: () => Promise<void>;
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
  async signUp(email, password, displayName) {
    const raw = await apiClient<unknown>('/api/v1/auth/sign-up', {
      method: 'POST',
      body: { email, password, display_name: displayName },
    });
    const result = tokenResponseSchema.parse(raw);
    await secureStorage.setTokens(result.access_token, result.refresh_token);
    set({ user: result.user, accessToken: result.access_token });
  },
  async updateProfile({
    displayName,
    avatarUrl,
    notifyPartnerActivity,
    pushNotificationsEnabled,
  }) {
    const token = get().accessToken;
    if (!token) throw new Error('Oturum bulunamadı.');
    const user = await apiClient<User>('/api/v1/users/me', {
      method: 'PATCH',
      accessToken: token,
      body: {
        display_name: displayName.trim(),
        ...(avatarUrl !== undefined ? { avatar_url: avatarUrl?.trim() || null } : {}),
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
  async deleteAccount() {
    const token = get().accessToken;
    if (token) {
      await apiClient<void>('/api/v1/users/me', { method: 'DELETE', accessToken: token });
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
