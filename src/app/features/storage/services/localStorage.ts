import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {

  /** Sauvegarder une clé avec un objet */
  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /** Charger une clé et convertir en type T */
  get<T>(key: string, defaultValue?: T): T | undefined {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        return JSON.parse(data) as T;
      } catch (e) {
        console.error(`Erreur parsing localStorage key="${key}":`, e);
      }
    }
    return defaultValue;
  }

  /** Supprimer une clé */
  remove(key: string): void {
    localStorage.removeItem(key);
  }

  /** Vider tout le localStorage */
  clear(): void {
    localStorage.clear();
  }
}
