import { Injectable, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SessionStorageService {
  /** Read and JSON-parse a session value. Returns null on miss or parse error. */
  load<T>(key: string): T | null {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  /**
   * Persist a value as JSON. Pass null/undefined to remove the key.
   * Called explicitly when you want a one-time save.
   */
  save<T>(key: string, value: T | null | undefined): void {
    try {
      if (value == null) {
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, JSON.stringify(value));
      }
    } catch { /* ignore quota / private-mode errors */ }
  }

  /**
   * Auto-save via an Angular effect — re-runs whenever signals read inside
   * getData() change. Must be called from within an injection context
   * (e.g. a constructor).
   */
  watch<T>(key: string, getData: () => T | null): void {
    effect(() => this.save(key, getData()));
  }
}
