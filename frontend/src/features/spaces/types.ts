export type Space = {
  id: string;
  name: string;
  type: 'personal' | 'couple' | 'family' | 'friends' | 'roommates' | 'group' | 'other';
  member_count: number;
  created_at: string;
  updated_at: string;
};
export type List = {
  id: string;
  space_id: string;
  name: string;
  position: number;
  item_count: number;
  created_at: string;
  updated_at: string;
};
