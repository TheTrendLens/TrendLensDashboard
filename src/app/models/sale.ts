import {Listing} from "./listing";

export interface Sale {
  id:              number;
  date_sold:       Date;
  shipping_status: string;
  platform_fee:    string;
  postage_cost:    string;
  payment_fee:     string;
  size:            string;
  sold_price:      string;
  item_cost:       string | null;
  offer:           string;
  listing:         Listing;
}
