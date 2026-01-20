export interface SyncJob {
  id: string;
  platform: string;
  syncType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  recordsProcessed: number;
  recordsFailed: number;
  errorMessage?: string;
}
