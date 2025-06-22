export interface User {
  id: string;
  email: string;
  stripe_customer_id: string;
  depop_id?: string | "";
  active_package: string;
  admin: boolean;
  new_sub: boolean;
}
