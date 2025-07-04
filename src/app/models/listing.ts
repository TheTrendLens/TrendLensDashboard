export interface Listing {
  id:           string;
  slug:         string;
  date_listed:  Date;
  brand:        string | null;
  category:     string;
  listed_price: number;
  item_cost:    number | null;
  quantity:     number;
  description?: string;
  user?:        any;
  userId?:      string;
  isEdit?:      boolean;
}
