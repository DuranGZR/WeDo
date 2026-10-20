import { authenticatedApiClient } from '@/api/client/authenticated-api-client';
import type { Page } from '@/features/collaboration/api';

export type ReportReason =
  'harassment' | 'sexual' | 'violence' | 'spam' | 'copyright' | 'other';
export type ReportInput = {
  target_type: 'item' | 'user' | 'app';
  target_id?: string;
  space_id?: string;
  reason: ReportReason;
  details: string;
};
export type ReportReceipt = { id: string; status: string; created_at: string };
export type BlockedUser = { user_id: string; display_name: string; created_at: string };

export const safetyApi = {
  report: (body: ReportInput) =>
    authenticatedApiClient<ReportReceipt>('/api/v1/safety/reports', {
      method: 'POST',
      body,
    }),
  blocks: (page = 1) =>
    authenticatedApiClient<Page<BlockedUser>>(
      `/api/v1/safety/blocks?page=${page}&page_size=50`,
    ),
  block: (userId: string) =>
    authenticatedApiClient<void>(`/api/v1/safety/blocks/${userId}`, { method: 'PUT' }),
  unblock: (userId: string) =>
    authenticatedApiClient<void>(`/api/v1/safety/blocks/${userId}`, { method: 'DELETE' }),
};
