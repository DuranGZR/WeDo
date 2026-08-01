export const queryKeys = {
  spaces: ['spaces'] as const,
  space: (id: string) => ['spaces', id] as const,
  lists: (spaceId: string) => ['spaces', spaceId, 'lists'] as const,
  items: (listId: string) => ['lists', listId, 'items'] as const,
  item: (id: string) => ['items', id] as const,
  notifications: ['notifications'] as const,
};
