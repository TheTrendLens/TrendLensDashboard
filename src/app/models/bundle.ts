import {User} from "./user";

export interface Bundle {
  id:              string;
  name:              string;
  date_sold:       Date;
  platform_fee:    number;
  buyer_postage_cost:    number;
  seller_postage_cost:    number;
  total:           number;
  payment_fee:     number;
  total_fee:       number;
  sold_price:      number;
  offer:           string;
  user:            User;
}
