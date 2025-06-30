import { User } from './user';

export interface Report {
  id: number;
  user: User;
  data: Uint8Array;
  date: Date;
  type: string;
}
