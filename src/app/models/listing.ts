export class Listing {
  name: string | null;
  listedPrice: number;
  soldPrice: number;
  sold: boolean;
  listedDate: string;
  soldDate: string;
  depopFee: number;
  paymentsFee: number;
  postageFee: number;
  itemCost: number;


  constructor(listing: Partial<Listing> = {}) {
    this.name = listing?.name || null;
    this.listedPrice = listing?.listedPrice || 0;
    this.soldPrice = listing?.soldPrice || 0;
    this.sold = listing?.sold || false;
    this.listedDate = listing?.listedDate || "";
    this.soldDate = listing?.soldDate || "";
    this.depopFee = listing?.depopFee || 0;
    this.paymentsFee = listing?.paymentsFee || 0;
    this.postageFee = listing?.postageFee || 0;
    this.itemCost = listing?.itemCost || 0;
  }

}
