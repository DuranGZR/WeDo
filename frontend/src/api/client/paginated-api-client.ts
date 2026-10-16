import { authenticatedApiClient } from './authenticated-api-client';

type Page<T> = {
  data: T[];
  pagination: { page: number; page_size: number; has_more: boolean };
};

// These screens render the whole collection and do not expose a next-page UI.
// Read every API page so older saved items never silently disappear after 50.
export async function allPages<T>(path: string): Promise<Page<T>> {
  const data: T[] = [];
  let page = 1;
  while (true) {
    const params = new URLSearchParams({ page: String(page), page_size: '100' });
    const result = await authenticatedApiClient<Page<T>>(
      `${path}?${params.toString()}`,
    );
    data.push(...result.data);
    if (!result.pagination.has_more) break;
    page += 1;
  }
  return { data, pagination: { page: 1, page_size: data.length, has_more: false } };
}
