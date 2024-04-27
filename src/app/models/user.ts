export class User {
  trendlens_id: string | null;
  depop_id: string | null;

  constructor(user: Partial<User> = {}) {
    this.trendlens_id = user?.trendlens_id || null;
    this.depop_id = user?.depop_id || null;
  }

}
