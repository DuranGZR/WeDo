import { authenticatedApiClient } from '@/api/client/authenticated-api-client';

export type Page<T> = {
  data: T[];
  pagination: { page: number; page_size: number; has_more: boolean };
};

export type SpaceMember = {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  role: string;
};
export type Invitation = {
  id: string;
  space_id: string;
  expires_at: string;
  max_uses?: number;
  use_count?: number;
  remaining_uses?: number;
  revoked_at?: string | null;
  invite_url?: string | null;
  space_name?: string;
  inviter_name?: string;
};
export type Comment = {
  id: string;
  item_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
};
export type Activity = {
  id: string;
  space_id: string;
  item_id?: string | null;
  actor_id: string;
  action: string;
  created_at: string;
};
export type Reaction = {
  id: string;
  item_id: string;
  user_id: string;
  reaction: 'want' | 'pass';
  created_at: string;
};
export type Plan = {
  id: string;
  space_id: string;
  item_id: string;
  scheduled_at: string;
  timezone: string;
  note: string | null;
  reminder_minutes_before: number;
  status: string;
  created_at: string;
  updated_at: string;
};
export type Memory = {
  id: string;
  item_id: string;
  user_id: string;
  note: string;
  rating: number | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
};
export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read_at: string | null;
  push_sent_at: string | null;
  created_at: string;
};

const page = <T>(path: string) => authenticatedApiClient<Page<T>>(path);

export const collaborationApi = {
  space: (id: string) => authenticatedApiClient(`/api/v1/spaces/${id}`),
  updateSpace: (id: string, body: { name?: string; type?: string }) =>
    authenticatedApiClient(`/api/v1/spaces/${id}`, { method: 'PATCH', body }),
  deleteSpace: (id: string) =>
    authenticatedApiClient<void>(`/api/v1/spaces/${id}`, { method: 'DELETE' }),
  members: (spaceId: string, pageNumber = 1) =>
    page<SpaceMember>(
      `/api/v1/spaces/${spaceId}/members?page=${pageNumber}&page_size=50`,
    ),
  removeMember: (spaceId: string, memberId: string) =>
    authenticatedApiClient<void>(`/api/v1/spaces/${spaceId}/members/${memberId}`, {
      method: 'DELETE',
    }),
  invitations: (spaceId: string, pageNumber = 1) =>
    page<Invitation>(
      `/api/v1/spaces/${spaceId}/invitations?page=${pageNumber}&page_size=50`,
    ),
  invite: (spaceId: string) =>
    authenticatedApiClient<Invitation>(`/api/v1/spaces/${spaceId}/invitations`, {
      method: 'POST',
      body: { max_uses: 1 },
    }),
  activities: (spaceId: string, pageNumber = 1) =>
    page<Activity>(
      `/api/v1/spaces/${spaceId}/activities?page=${pageNumber}&page_size=50`,
    ),
  comments: (itemId: string, pageNumber = 1) =>
    page<Comment>(`/api/v1/items/${itemId}/comments?page=${pageNumber}&page_size=50`),
  createComment: (itemId: string, body: string) =>
    authenticatedApiClient<Comment>(`/api/v1/items/${itemId}/comments`, {
      method: 'POST',
      body: { body },
    }),
  updateComment: (commentId: string, body: string) =>
    authenticatedApiClient<Comment>(`/api/v1/comments/${commentId}`, {
      method: 'PATCH',
      body: { body },
    }),
  deleteComment: (commentId: string) =>
    authenticatedApiClient<void>(`/api/v1/comments/${commentId}`, { method: 'DELETE' }),
  reactions: (itemId: string) =>
    authenticatedApiClient<Page<Reaction>>(
      `/api/v1/items/${itemId}/reactions?page=1&page_size=50`,
    ),
  activitiesForItem: (itemId: string) =>
    authenticatedApiClient<Page<Activity>>(
      `/api/v1/items/${itemId}/activity?page=1&page_size=50`,
    ),
  updateItem: (itemId: string, body: Record<string, unknown>) =>
    authenticatedApiClient(`/api/v1/items/${itemId}`, { method: 'PATCH', body }),
  deleteItem: (itemId: string) =>
    authenticatedApiClient<void>(`/api/v1/items/${itemId}`, { method: 'DELETE' }),
  moveItem: (itemId: string, listId: string) =>
    authenticatedApiClient(`/api/v1/items/${itemId}/move`, {
      method: 'POST',
      body: { list_id: listId },
    }),
  restoreItem: (itemId: string) =>
    authenticatedApiClient(`/api/v1/items/${itemId}/restore`, { method: 'POST' }),
  updateList: (
    listId: string,
    body: { name?: string; icon?: string; position?: number },
  ) => authenticatedApiClient(`/api/v1/lists/${listId}`, { method: 'PATCH', body }),
  deleteList: (listId: string) =>
    authenticatedApiClient<void>(`/api/v1/lists/${listId}`, { method: 'DELETE' }),
  reorderLists: (spaceId: string, listIds: string[]) =>
    authenticatedApiClient(`/api/v1/lists/reorder`, {
      method: 'POST',
      body: { space_id: spaceId, list_ids: listIds },
    }),
  plans: (spaceId: string, pageNumber = 1) =>
    page<Plan>(`/api/v1/spaces/${spaceId}/plans?page=${pageNumber}&page_size=50`),
  createPlan: (body: {
    space_id: string;
    item_id: string;
    scheduled_at: string;
    timezone?: string;
    note?: string;
    reminder_minutes_before?: number;
  }) => authenticatedApiClient<Plan>('/api/v1/plans', { method: 'POST', body }),
  plan: (id: string) => authenticatedApiClient<Plan>(`/api/v1/plans/${id}`),
  updatePlan: (id: string, body: Record<string, unknown>) =>
    authenticatedApiClient<Plan>(`/api/v1/plans/${id}`, { method: 'PATCH', body }),
  planAction: (id: string, action: 'approve' | 'reject' | 'cancel' | 'complete') =>
    authenticatedApiClient<Plan>(`/api/v1/plans/${id}/${action}`, { method: 'POST' }),
  memories: (spaceId: string, pageNumber = 1) =>
    page<Memory>(`/api/v1/spaces/${spaceId}/memories?page=${pageNumber}&page_size=50`),
  itemMemories: (itemId: string, pageNumber = 1) =>
    page<Memory>(`/api/v1/items/${itemId}/memories?page=${pageNumber}&page_size=50`),
  createMemory: (
    itemId: string,
    body: { note: string; rating?: number; photo_url?: string },
  ) =>
    authenticatedApiClient<Memory>(`/api/v1/items/${itemId}/memories`, {
      method: 'POST',
      body,
    }),
  memory: (id: string) => authenticatedApiClient<Memory>(`/api/v1/memories/${id}`),
  updateMemory: (
    id: string,
    body: { note?: string; rating?: number; photo_url?: string },
  ) =>
    authenticatedApiClient<Memory>(`/api/v1/memories/${id}`, { method: 'PATCH', body }),
  deleteMemory: (id: string) =>
    authenticatedApiClient<void>(`/api/v1/memories/${id}`, { method: 'DELETE' }),
  notifications: (pageNumber = 1) =>
    page<Notification>(`/api/v1/notifications?page=${pageNumber}&page_size=50`),
  unreadCount: () =>
    authenticatedApiClient<{ count: number }>('/api/v1/notifications/unread-count'),
  readNotification: (id: string) =>
    authenticatedApiClient<void>(`/api/v1/notifications/${id}/read`, { method: 'POST' }),
  readAllNotifications: () =>
    authenticatedApiClient<void>('/api/v1/notifications/read-all', { method: 'POST' }),
  invitation: (token: string) =>
    authenticatedApiClient<Invitation>(`/api/v1/invitations/token/${token}`),
  acceptInvitation: (token: string) =>
    authenticatedApiClient<Invitation>(`/api/v1/invitations/token/${token}/accept`, {
      method: 'POST',
    }),
  deleteInvitation: (id: string) =>
    authenticatedApiClient<void>(`/api/v1/invitations/${id}`, { method: 'DELETE' }),
};
