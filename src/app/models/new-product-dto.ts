import {NewListingDto} from './new-listing-dto';

export interface NewProductDto {
  listing:    NewListingDto;
  item_cost:  number | null;
  size:       string;
  quantity?:   number;
}
