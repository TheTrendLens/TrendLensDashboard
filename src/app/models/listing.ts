export class Listing {
  id: number | null;
  name: string | null;
  price: number;
  currency: string;
  likes: number;
  bag_count: number;
  date_listed: string;
  category: string;
  quantity: number;
  item_cost: number;
  depop_id: string;

  constructor(listing: Partial<Listing> = {}) {
    this.id = listing?.id || null;
    this.name = listing?.name || null;
    this.price = listing?.price || 0;
    this.currency = listing?.currency || "";
    this.likes = listing?.likes || 0;
    this.bag_count = listing?.bag_count || 0;
    this.date_listed = listing?.date_listed || "";
    this.category = listing?.category || "";
    this.quantity = listing?.quantity || 0;
    this.item_cost = listing?.item_cost || 0;
    this.depop_id = listing?.depop_id || "";
  }

}
