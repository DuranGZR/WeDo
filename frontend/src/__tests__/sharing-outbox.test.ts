import { authenticatedApiClient } from '@/api/client/authenticated-api-client';
import { ApiClientError } from '@/api/client/api-client';
import { enqueue, pendingEntries, removeEntry } from '@/database/outbox';
import { syncOutbox } from '@/features/sharing/sync';

let mockOwner = 'alice';
jest.mock('@/database/client', () => ({ database: null }));
jest.mock('@/api/client/authenticated-api-client', () => ({
  authenticatedApiClient: jest.fn(),
}));
jest.mock('@/lib/env', () => ({ env: { apiUrl: 'https://api.test' } }));
jest.mock('@/store/auth-store', () => ({
  useAuthStore: { getState: () => ({ user: { id: mockOwner } }) },
}));
jest.mock('@/api/query-client', () => ({
  queryClient: { invalidateQueries: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockOwner = 'alice';
  for (const owner of ['alice', 'bob'])
    for (const entry of pendingEntries(owner)) removeEntry(entry.id);
});

it('syncs only the signed-in account entries and preserves the title', async () => {
  const aliceId = enqueue(
    'create_item',
    {
      url: 'https://example.com/alice',
      sharedText: 'Our trip',
      space_id: 'space',
      list_id: 'list',
    },
    'alice',
  );
  enqueue('create_item', { url: 'https://example.com/bob' }, 'bob');
  jest.mocked(authenticatedApiClient).mockResolvedValue({});
  await syncOutbox();
  expect(authenticatedApiClient).toHaveBeenCalledTimes(1);
  expect(authenticatedApiClient).toHaveBeenCalledWith(
    '/api/v1/items',
    expect.objectContaining({
      body: expect.objectContaining({
        original_url: 'https://example.com/alice',
        title: 'Our trip',
        client_item_id: aliceId,
      }),
    }),
  );
  expect(pendingEntries('alice')).toHaveLength(0);
  expect(pendingEntries('bob')).toHaveLength(1);
});

it('does not send an entry twice during overlapping syncs and removes duplicate acknowledgements', async () => {
  enqueue('create_item', { url: 'https://example.com/a' }, 'alice');
  jest.mocked(authenticatedApiClient).mockRejectedValue(new ApiClientError(409, {}));
  await Promise.all([syncOutbox(), syncOutbox()]);
  expect(authenticatedApiClient).toHaveBeenCalledTimes(1);
  expect(pendingEntries('alice')).toHaveLength(0);
});

it('retains a failed network request for a later retry', async () => {
  enqueue('create_item', { url: 'https://example.com/a' }, 'alice');
  jest.mocked(authenticatedApiClient).mockRejectedValue(new Error('offline'));
  await syncOutbox();
  expect(pendingEntries('alice')).toHaveLength(1);
  expect(pendingEntries('alice')[0]!.attempts).toBe(1);
});
