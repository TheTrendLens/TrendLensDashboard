import { User } from './user';
import { Product } from './product';

export interface Sale {
  id: string;
  date_sold: Date;
  time_sold: string;
  buyer: string;
  platform_fee: number;
  seller_postage_cost: number;
  total: number;
  payment_fee: number;
  boosting_fee: number;
  total_fee: number;
  payment_type: string;
  sales_tax?: number;
  refunded_to_buyer: number;
  refunded_to_seller: number;
  offer: boolean;
  sold_price: number;
  products: Product[];
  user: User;
}
