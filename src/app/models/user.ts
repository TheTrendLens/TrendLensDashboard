export interface User {
  id: string;
  email: string;
  stripe_customer_id: string;
  depop_id?: string | "";
  active_package: string;
  addons?: string[];
  admin: boolean;
  new_sub: boolean;
  currency: string;
  currencySymbol: string;
  experimental_features?: boolean;
}
