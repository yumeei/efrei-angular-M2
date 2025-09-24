import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { User } from '../models/user';
import { StorageService } from '../../storage/services/localStorage';
import { MockApiService } from '../../../infrastructure/mock-data/mock-api.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private storage = inject(StorageService);
  private mockApi = inject(MockApiService);

  // Writable signals for state management
  private readonly _currentUser = signal<User | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // Computed signals (MANDATORY)
  public readonly currentUser$ = computed(() => this._currentUser());
  public readonly isAuthenticated = computed(() => !!this._currentUser());
  public readonly isAdmin = computed(() => this._currentUser()?.role === 'admin');
  public readonly loading = computed(() => this._isLoading() || this.mockApi.loading());
  public readonly error = computed(() => this._error() || this.mockApi.error());

  constructor() {
    this.setupEffects();
    this.loadCurrentUser();
  }

  // Effects (AT LEAST 1 MANDATORY)
  private setupEffects(): void {
    // Effect: Save user to localStorage when current user changes
    effect(() => {
      const user = this._currentUser();
      if (user) {
        this.storage.set('currentUser', user);
      } else {
        this.storage.remove('currentUser');
      }
    }, { allowSignalWrites: false });

    // Effect: Log authentication state changes
    effect(() => {
      const user = this._currentUser();
      const isAuth = this.isAuthenticated();
      console.warn(`Auth State: ${isAuth ? `Logged as ${user?.name}` : 'Not logged in'}`);
    }, { allowSignalWrites: false });
  }

  // Load current user from localStorage on service initialization
  private loadCurrentUser(): void {
    const savedUser = this.storage.get<User>('currentUser');
    if (savedUser) {
      this._currentUser.set(savedUser);
    }
  }

  // Using Mock API with delays
  async login(email: string, password: string): Promise<boolean> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      // Retrieve users from Mock API (with delays)
      // const users = await this.mockApi.getUsers();
      // const user = users.find((u: User) => u.email === email);

      const users = this.storage.get<User[]>('users') || [];
      const passwords = this.storage.get<Record<string, string>>('passwords') || {};
      const user = users.find(u => u.email === email);

      if (user && passwords[email] === password) {
        this._currentUser.set(user);
        return true;
      } else {
        this._error.set('Email ou mot de passe incorrect');
        return false;
      }

      // if (user && storedPassword === password) {
      //   this._currentUser.set(user);
      //   return true;
      // } else {
      //   this._error.set('Invalid email or password');
      //   return false;
      // }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown login error';
      this._error.set(errorMessage);
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  // Register new user through Mock API
  // async register(userData: { name: string; email: string; password: string }): Promise<boolean> {
  //   try {
  //     this._isLoading.set(true);
  //     this._error.set(null);

  //     // Check if email already exists
  //     const users = await this.mockApi.getUsers();
  //     const existingUser = users.find((u: User) => u.email === userData.email);
  //     if (existingUser) {
  //       this._error.set('Cet email est déjà utilisé');
  //       return false;
  //     }

  //     // Create new user manually (not through Mock API)
  //     const newUser: User = {
  //       id: users.length + 1,
  //       name: userData.name,
  //       email: userData.email,
  //       role: 'user',
  //       password: ''
  //     };

  //     // Add to users list and save password
  //     const updatedUsers = [...users, newUser];
  //     this.storage.set('users', updatedUsers);
  //     const passwords = this.storage.get<Record<string, string>>('passwords') || {};
  //     passwords[userData.email] = userData.password;
  //     this.storage.set('passwords', passwords);

  //     // Auto-login the new user
  //     // this._currentUser.set(newUser);
  //     // Simulate network delay
  //     await new Promise(resolve => setTimeout(resolve, 500));
  //     return true;

  //   } catch (error: unknown) {
  //     const errorMessage = error instanceof Error ? error.message : 'Unknown registration error';
  //     this._error.set(errorMessage);
  //     return false;
  //   } finally {
  //     this._isLoading.set(false);
  //   }
  // }

  async register(userData: { name: string; email: string; password: string }): Promise<boolean> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      // fetch all existing users
      const mockUsers = await this.mockApi.getUsers();
      const localUsers = this.storage.get<User[]>('users') ?? [];
      const allUsers = [...mockUsers];

      // add local users not in the mock file
      localUsers.forEach(u => {
        if (!allUsers.find(mu => mu.email === u.email)) {
          allUsers.push(u);
        }
      });

      // check if email is already used
      if (allUsers.find(u => u.email === userData.email)) {
        this._error.set('Cet email est déjà utilisé');
        return false;
      }

      // create the new user
      const newUser: User = {
        id: allUsers.length + 1,
        name: userData.name,
        email: userData.email,
        role: 'user',
        password: '',
      };

      allUsers.push(newUser);

      // save to localStorage
      this.storage.set('users', allUsers);

      const passwords = this.storage.get<Record<string, string>>('passwords') ?? {};
      passwords[userData.email] = userData.password;
      this.storage.set('passwords', passwords);

      return true;
    } finally {
      this._isLoading.set(false);
    }
  }

  // Log out current user and clear state
  logout(): void {
    this._currentUser.set(null);
    this._error.set(null);
    console.warn('User logged out');
  }

  // Get all users signal for compatibility - SIGNALS ONLY
  getAllUsers() {
    // return this.mockApi.users; // Signal computed
    const mockUsers = this.mockApi.users();      // Utilisateurs Mock
    const localUsers = this.storage.get<User[]>('users') ?? []; // Utilisateurs locaux

    const merged = [...mockUsers];
  localUsers.forEach(u => {
    if (!merged.find(m => m.email === u.email)) {
      merged.push(u);
    }
  });

  // Retourner un signal pour que le composant reste réactif
  return signal<User[]>(merged);
  }

  // Delete user by ID through Mock API
  async deleteUser(userId: number): Promise<boolean> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const success = await this.mockApi.deleteUser(userId);
      return success;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown delete error';
      this._error.set(errorMessage);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  getToken(): string | null {
    const user = this._currentUser();
    return user ? `mock-token-${user.id}` : null;
  }

  // Get current user value
  getCurrentUser(): User | null {
    return this._currentUser();
  }

  // Simple password validation
  private validatePassword(password: string): boolean {
    return password.length >= 6;
  }

  // Clear error state
  clearError(): void {
    this._error.set(null);
    this.mockApi.clearError();
  }
}