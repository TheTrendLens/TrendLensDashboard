export interface EbayConnection {
  connected: boolean;
  marketplaceUserId: string | null;
  lastSyncAt: Date | null;
  valid: boolean;
  expiresIn: number | null;
  message: string;
}
