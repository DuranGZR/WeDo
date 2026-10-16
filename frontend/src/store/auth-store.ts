import { t } from '@/i18n';
import { create } from 'zustand';

import { apiClient, ApiClientError } from '@/api/client/api-client';
import { authenticatedApiClient } from '@/api/client/authenticated-api-client';
import { queryClient } from '@/api/query-client';
import { useSpaceStore } from './space-store';
import { tokenResponseSchema, type User } from '@/api/schemas';
import { secureStorage } from '@/lib/secure-storage';
import {
  verificationChallengeSchema,
  type VerificationChallenge,
} from '@/features/auth/email-verification';

type AppleRevocationStatus = 'not_required' | 'pending' | 'manual';

let refreshInFlight: Promise<boolean> | null = null;

function clearAccountCache() {
  void queryClient.cancelQueries();
  queryClient.clear();
  useSpaceStore.getState().setSelectedSpaceId(undefined);
}

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
    authorizationCode?: string,
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
  deleteAccount: (currentPassword?: string) => Promise<AppleRevocationStatus>;
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
      await get().refresh();
      set({ hydrated: true });
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
  async signInWithApple(
    identityToken,
    appleUserId,
    email,
    displayName,
    authorizationCode,
  ) {
    const raw = await apiClient<unknown>('/api/v1/auth/apple', {
      method: 'POST',
      body: {
        identity_token: identityToken,
        apple_user_id: appleUserId,
        ...(authorizationCode ? { authorization_code: authorizationCode } : {}),
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
    const user = await authenticatedApiClient<User>('/api/v1/users/me', {
      method: 'PATCH',
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
    await authenticatedApiClient<void>('/api/v1/auth/change-password', {
      method: 'POST',
      body: { current_password: currentPassword, new_password: newPassword },
    });
    await secureStorage.clear();
    set({ user: null, accessToken: null });
  },
  async deleteAccount(currentPassword) {
    const token = get().accessToken;
    let appleRevocation: AppleRevocationStatus = 'not_required';
    if (token) {
      const result = await authenticatedApiClient<{
        apple_revocation: AppleRevocationStatus;
      }>('/api/v1/users/me', {
        method: 'DELETE',
        body: currentPassword ? { current_password: currentPassword } : {},
      });
      appleRevocation = result?.apple_revocation ?? 'not_required';
    }
    await secureStorage.clear();
    set({ user: null, accessToken: null });
    return appleRevocation;
  },
  async signOut() {
    const token = get().accessToken;
    if (token) {
      try {
        await authenticatedApiClient('/api/v1/auth/sign-out-all', {
          method: 'POST',
        });
      } catch {
        /* local logout still succeeds */
      }
    }
    await secureStorage.clear();
    set({ user: null, accessToken: null });
  },
  async refresh() {
    if (refreshInFlight) return refreshInFlight;
    const startingToken = get().accessToken;
    refreshInFlight = (async () => {
      const { refreshToken } = await secureStorage.getTokens();
      if (!refreshToken) return false;
      try {
        const raw = await apiClient<unknown>('/api/v1/auth/refresh', {
          method: 'POST',
          body: { refresh_token: refreshToken },
        });
        if (get().accessToken !== startingToken) return false;
        const result = tokenResponseSchema.parse(raw);
        await secureStorage.setTokens(result.access_token, result.refresh_token);
        set({ user: result.user, accessToken: result.access_token });
        return true;
      } catch (error) {
        // A temporary network/server failure must not destroy a valid session.
        if (
          error instanceof ApiClientError &&
          error.status === 401 &&
          get().accessToken === startingToken
        ) {
          await secureStorage.clear();
          set({ user: null, accessToken: null });
        }
        return false;
      }
    })();
    try {
      return await refreshInFlight;
    } finally {
      refreshInFlight = null;
    }
  },
}));

// Query keys and the selected space belong to one account, never to the device.
useAuthStore.subscribe((state, previous) => {
  if (state.user?.id !== previous.user?.id) clearAccountCache();
});
