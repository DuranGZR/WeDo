export type List = {
  id: string;
  space_id: string;
  name: string;
  position: number;
  icon: string | null;
  created_by: string;
  is_default: boolean;
  item_count?: number;
  created_at: string;
  updated_at: string;
};
