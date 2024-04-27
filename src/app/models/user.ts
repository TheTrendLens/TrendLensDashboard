export class User {
  id: string | null;
  email: string | null;
  stripe_customer_id: string | null;
  depop_id: string | null;

  constructor(user: Partial<User> = {}) {
    this.email = user?.email || null;
    this.id = user?.id || null;
    this.stripe_customer_id = user?.stripe_customer_id || null;
    this.depop_id = user?.depop_id || null;
  }

}
