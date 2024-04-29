export class Sale {
  id: number | null;
  listing_id: number | null;
  price: number;
  date_sold: Date | undefined;
  shipping_status: string;
  platform_fee: number;
  postage_cost: number;
  payment_fee: number;
  item_cost: number | undefined;
  name: string | undefined;

  constructor(sale: Partial<Sale> = {}) {
    this.id = sale?.id || null;
    this.listing_id = sale?.listing_id || null;
    this.price = sale?.price || 0;
    this.date_sold = sale?.date_sold;
    this.shipping_status = sale?.shipping_status || "";
    this.platform_fee = sale?.platform_fee || 0;
    this.postage_cost = sale?.postage_cost || 0;
    this.payment_fee = sale?.payment_fee || 0;
    this.item_cost = sale?.item_cost || 0;
    this.name = sale?.name || "";
  }
}
