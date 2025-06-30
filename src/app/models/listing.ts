export interface Listing {
  id:                 string;
  name:               string;
  brand:              null | string;
  category:           string;
  listed_price:       string | number;
  date_updated:       Date;
  date_listed:        Date;
  status:             string;
  like_count:         number;
  condition:          string;
  colour:             string[] | null;
  age:                string[] | null;
  source:             string[] | null;
  style:              string[] | null;
  sub_category:       string | null;
  attributes:         { [key: string]: string[] };
  gender:             string | null;
  is_kids:            boolean;
  sizes:              Size[];
  slug:               string;
  sold:               boolean;
  date_last_gathered: Date;
  isEdit:             boolean;
}

export interface Size {
  name: string;
  quantity: number;
}
