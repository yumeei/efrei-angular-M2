import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  set<T>(key: string, value: T): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Error saving to localStorage with key "${key}":`, error);
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error parsing localStorage item with key "${key}":`, error);
      // Nettoyer la clé corrompue
      localStorage.removeItem(key);
      return null;
    }
  }

  /** Supprimer une clé */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage item with key "${key}":`, error);
    }
  }

  /** Vider tout le localStorage */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  exists(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }
}
