import {Listing} from "./listing";

export interface Sale {
  id:              number;
  date_sold:       Date;
  shipping_status: string;
  platform_fee:    string | number;
  buyer_postage_cost:    string | number;
  payment_fee:     string | number;
  size:            string;
  sold_price:      string | number;
  item_cost:       string | number | null;
  offer:           string;
  listing:         Listing;
}
