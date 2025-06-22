export class Subscription {
  status: string | null;
  product: string | null;

  constructor(subscription: Partial<Subscription> = {}) {
    this.status = subscription?.status || null;
    this.product = subscription?.product || null;
  }

}
