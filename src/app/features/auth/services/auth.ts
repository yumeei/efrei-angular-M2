// import { Injectable, signal } from '@angular/core';
// import { Observable, of, throwError, delay } from 'rxjs';
// import { User, LoginRequest, RegisterRequest } from '../models/user.model';

// @Injectable({
//   providedIn: 'root',
// })
// export class AuthService {
//   private currentUser = signal<User | null>(null);
//   public currentUser$ = this.currentUser.asReadonly();

//   // Mock data - utilisateurs de test
//   private users: User[] = [
//     {
//       id: 1,
//       name: 'Admin User',
//       email: 'admin@example.com',
//       role: 'admin',
//       password: '',
//     },
//     {
//       id: 2,
//       name: 'Normal User',
//       email: 'user@example.com',
//       role: 'user',
//       password: '',
//     },
//   ];

//   // Mock data - mots de passe (en réalité, ils seraient hashés)
//   private passwords: Record<string, string> = {
//     'admin@example.com': 'admin123',
//     'user@example.com': 'user123',
//   };

//   constructor() {
//     // Vérifier s'il y a un utilisateur en session
//     const savedUser = localStorage.getItem('currentUser');
//     if (savedUser) {
//       this.currentUser.set(JSON.parse(savedUser));
//     }
//   }

//   login(credentials: LoginRequest): Observable<User> {
//     const user = this.users.find((u) => u.email === credentials.email);
//     const password = this.passwords[credentials.email];

//     if (user && password === credentials.password) {
//       // Simuler un délai réseau
//       return of(user).pipe(delay(500));
//     } else {
//       return throwError(() => new Error('Email ou mot de passe incorrect'));
//     }
//   }

//   register(userData: RegisterRequest): Observable<User> {
//     // Vérifier si l'email existe déjà
//     const existingUser = this.users.find((u) => u.email === userData.email);
//     if (existingUser) {
//       return throwError(() => new Error('Cet email est déjà utilisé'));
//     }

//     // Créer un nouvel utilisateur
//     const newUser: User = {
//       id: this.users.length + 1,
//       name: userData.name,
//       email: userData.email,
//       role: 'user',
//       password: '',
//     };

//     // Ajouter aux mock data
//     this.users.push(newUser);
//     this.passwords[userData.email] = userData.password;

//     // Simuler un délai réseau
//     return of(newUser).pipe(delay(500));
//   }

//   logout(): void {
//     this.currentUser.set(null);
//     localStorage.removeItem('currentUser');
//   }

//   getCurrentUser(): User | null {
//     return this.currentUser();
//   }

//   getAllUsers(): Observable<User[]> {
//     return of(this.users).pipe(delay(300));
//   }

//   deleteUser(userId: number): Observable<void> {
//     const index = this.users.findIndex((u) => u.id === userId);
//     if (index !== -1) {
//       this.users.splice(index, 1);
//       return of(void 0).pipe(delay(300));
//     }
//     return throwError(() => new Error('Utilisateur non trouvé'));
//   }

//   getToken(): string | null {
//     const user = this.currentUser();
//     return user ? `mock-token-${user.id}` : null;
//   }

//   // Méthode pour définir l'utilisateur connecté (utilisée après login)
//   setCurrentUser(user: User): void {
//     this.currentUser.set(user);
//     localStorage.setItem('currentUser', JSON.stringify(user));
//   }
// }

import { inject, Injectable, signal } from '@angular/core';
import { Observable, of, throwError, delay } from 'rxjs';
import { User, LoginRequest, RegisterRequest } from '../models/user';
import { StorageService } from '../../storage/services/localStorage';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUser = signal<User | null>(null);
  public currentUser$ = this.currentUser.asReadonly();

  // Signals pour les utilisateurs et mots de passe
  private users = signal<User[]>([]);
  private passwords = signal<Record<string, string>>({});

  private storage = inject(StorageService);

  constructor() {
    // Charger l'utilisateur en session
    const savedCurrentUser = this.storage.get<User>('currentUser');
    if (savedCurrentUser) {
      this.currentUser.set(savedCurrentUser);
    }

    // Charger les utilisateurs depuis le localStorage
    const savedUsers = this.storage.get<User[]>('users');
    const savedPasswords = this.storage.get<Record<string, string>>('passwords');

    if (savedUsers && savedUsers.length) {
      this.users.set(savedUsers);
    } else {
      // Valeur par défaut si aucun user en storage
      this.users.set([
        { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'admin', password: '' },
        { id: 2, name: 'Normal User', email: 'user@example.com', role: 'user', password: '' },
      ]);
    }

    if (savedPasswords && Object.keys(savedPasswords).length) {
      this.passwords.set(savedPasswords);
    } else {
      this.passwords.set({
        'admin@example.com': 'admin123',
        'user@example.com': 'user123',
      });
    }
  }

  // Connexion
  login(credentials: LoginRequest): Observable<User> {
    const user = this.users().find((u) => u.email === credentials.email);
    const password = this.passwords()[credentials.email];

    if (user && password === credentials.password) {
      this.currentUser.set(user);
      this.storage.set('currentUser', user);
      return of(user).pipe(delay(500));
    } else {
      return throwError(() => new Error('Email ou mot de passe incorrect'));
    }
  }

  // Inscription
  register(userData: RegisterRequest): Observable<User> {
    const existingUser = this.users().find((u) => u.email === userData.email);
    if (existingUser) {
      return throwError(() => new Error('Cet email est déjà utilisé'));
    }

    const newUser: User = {
      id: this.users().length + 1,
      name: userData.name,
      email: userData.email,
      role: 'user',
      password: '',
    };

    // Mettre à jour les signals
    this.users.update((list) => {
      const newList = [...list, newUser];
      this.storage.set('users', newList); // Persist
      return newList;
    });

    this.passwords.update((p) => {
      const newPasswords = { ...p, [userData.email]: userData.password };
      this.storage.set('passwords', newPasswords); // Persist
      return newPasswords;
    });

    // Connecter automatiquement le nouvel utilisateur
    this.currentUser.set(newUser);
    this.storage.set('currentUser', newUser);

    return of(newUser).pipe(delay(500));
  }

  // Déconnexion
  logout(): void {
    this.currentUser.set(null);
    this.storage.remove('currentUser');
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }

  getAllUsers(): Observable<User[]> {
    return of(this.users()).pipe(delay(300));
  }

  deleteUser(userId: number): Observable<void> {
    this.users.update((list) => {
      const newList = list.filter((u) => u.id !== userId);
      this.storage.set('users', newList); // Persist
      return newList;
    });

    this.passwords.update((p) => {
      const newPasswords = { ...p };
      const userToDelete = this.users().find((u) => u.id === userId);
      if (userToDelete) delete newPasswords[userToDelete.email];
      this.storage.set('passwords', newPasswords); // Persist
      return newPasswords;
    });

    return of(void 0).pipe(delay(300));
  }

  getToken(): string | null {
    const user = this.currentUser();
    return user ? `mock-token-${user.id}` : null;
  }

  setCurrentUser(user: User): void {
    this.currentUser.set(user);
    this.storage.set('currentUser', user);
  }
}
