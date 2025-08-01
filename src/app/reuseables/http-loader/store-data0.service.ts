import { Injectable } from '@angular/core';

interface CachedItem {
  data: any;
  timestamp: number;
  ttl?: number; // optional TTL in ms
}

@Injectable({ providedIn: 'root' })
export class StoreDataService {

  private cache = new Map<string, CachedItem>();
  public workingDir: { [key: string]: any } = {};

  /** Set a single key/value */
  set(key: string, data: any, ttl?: number): void {this.cache.set(key, { data, timestamp: Date.now(), ttl })}
  // set(key: string, data: any, ttl?: number): void {this.cache.set(key, { data, timestamp: Date.now(), ttl })}

  /** Set multiple values with optional TTL */
  setMultiple(data: Record<string, any>, ttl?: number): void {
    Object.entries(data).forEach(([key, value]) => {
      const existing = this.get(key);
      const isMergable =
        typeof value === 'object' && value !== null && !Array.isArray(value) &&
        typeof existing === 'object' && existing !== null && !Array.isArray(existing);

      console.log({key,value}, {isMergable});

      if (isMergable) {
        const merged = { ...existing, ...value };
        this.set(key, merged, ttl);
      } else {
        this.set(key, value, ttl);
      };
    });
  }

  /** Get cached data if not expired */
  get<T = any>(key: string,from='unkown'): T | null {
    const item = this.cache.get(key);

    console.log({item, from});

    if (!item) return null;

    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key); // expired
      return null;
    }

    return item.data;
  }

  /** Check if key exists and is valid */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /** Remove a specific key */
  clear(key: string): void {
    this.cache.delete(key);
  }

  /** Clear the entire cache */
  clearAll(): void {
    this.cache.clear();
  }
}
