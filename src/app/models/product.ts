import { Listing } from './listing';
import { Sale } from './sale';

export interface Product {
  id?: string;
  listing: Listing;
  sale: Sale;
  item_cost: number;
  size: string;
}
