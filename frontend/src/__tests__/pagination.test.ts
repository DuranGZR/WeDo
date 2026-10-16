import { authenticatedApiClient } from '@/api/client/authenticated-api-client';
import { allPages } from '@/api/client/paginated-api-client';

jest.mock('@/api/client/authenticated-api-client', () => ({
  authenticatedApiClient: jest.fn(),
}));

beforeEach(() => jest.clearAllMocks());

it('keeps older saved items beyond the first server page', async () => {
  jest
    .mocked(authenticatedApiClient)
    .mockResolvedValueOnce({ data: [{ id: 'recent' }], pagination: { has_more: true } })
    .mockResolvedValueOnce({ data: [{ id: 'older' }], pagination: { has_more: false } });
  const result = await allPages('/api/v1/lists/list/items');
  expect(result.data).toEqual([{ id: 'recent' }, { id: 'older' }]);
  expect(authenticatedApiClient).toHaveBeenNthCalledWith(
    2,
    '/api/v1/lists/list/items?page=2&page_size=100',
  );
});

it('reports later-page failures instead of pretending a partial collection is complete', async () => {
  jest
    .mocked(authenticatedApiClient)
    .mockResolvedValueOnce({ data: [{ id: 'recent' }], pagination: { has_more: true } })
    .mockRejectedValueOnce(new Error('offline'));
  await expect(allPages('/api/v1/spaces')).rejects.toThrow('offline');
});
