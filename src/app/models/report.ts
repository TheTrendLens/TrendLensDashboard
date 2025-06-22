export interface Report {
  id: string;
  date: Date;
  type: string;
  data: Data;
}

export interface Data {
  type: string;
  data: Uint8Array;
}
