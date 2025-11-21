type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export class TTLCache<T> {
  private ttl: number;
  private store = new Map<string, CacheEntry<T>>();

  constructor(ttlMs: number) {
    if (ttlMs <= 0) {
      throw new Error("TTL must be greater than 0");
    }
    this.ttl = ttlMs;
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: string, value: T) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttl,
    });
  }

  delete(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}
