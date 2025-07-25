export interface NewListingDto {
  date_listed:  Date;
  brand:        string | null;
  category:     string;
  listed_price: number;
  item_cost:    number | null;
  quantity:     number;
  description:  string;
  source:       string;
}
