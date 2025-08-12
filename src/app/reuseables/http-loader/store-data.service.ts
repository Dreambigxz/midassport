import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StoreDataService {
  // In-memory store (only lives during app runtime)
  public store: { [key: string]: any } = {};

  /** Set data by key */
  set<T = any>(key: string, value: T): void {this.store[key] = value;}


  /** Set multiple values with optional TTL */
  setMultiple(data: any): void {
    Object.entries(data).forEach(([key, value]) => {
      const existing = this.get(key);
      const isMergable =
        typeof value === 'object' && value !== null && !Array.isArray(value) &&
        typeof existing === 'object' && existing !== null && !Array.isArray(existing);
      if (isMergable) {
        const merged = { ...existing, ...value };
        this.set(key, merged);
      } else {
        this.set(key, value);
      };
    });
  }

  /** Get data by key */
  get<T = any>(key: string): T | undefined {
    return this.store[key];
  }

  /** Check if data exists */
  has(key: string): boolean {return key in this.store;}

  /** Delete a specific key */
  delete(key: string): void {delete this.store[key];}

  /** Clear all stored data */
  clear(): void {this.store = {};}
}
