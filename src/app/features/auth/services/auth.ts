import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { User } from '../models/user';
import { StorageService } from '../../storage/services/localStorage';
import { MockApiService } from '../../../infrastructure/mock-data/mock-api.service';
import { NotificationService } from '../../../shared/service/notifications-service';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private storage = inject(StorageService);
  private mockApi = inject(MockApiService);
  private notificationService = inject(NotificationService);

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

  private initializeMockPasswords(): void {
    // Initialiser les mots de passe des utilisateurs mock si pas déjà fait
    const passwords = this.storage.get<Record<string, string>>('passwords') || {};
    const mockUsers = this.mockApi.users();
    let needsUpdate = false;
    mockUsers.forEach(user => {
      if (user.password && !passwords[user.email]) {
        passwords[user.email] = user.password;
        needsUpdate = true;
      }
    });
    if (needsUpdate) {
      this.storage.set('passwords', passwords);
    }
  }
  constructor() {
    this.setupEffects();
    this.loadCurrentUser();
    this.initializeMockPasswords();
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

      this.initializeMockPasswords();

      // Retrieve users from Mock API ans local storage
      const allUsers = this.getAllUsers()();
      const passwords = this.storage.get<Record<string, string>>('passwords') || {};
      const user = allUsers.find(u => u.email === email);

      if (user && passwords[email] === password) {
        this._currentUser.set(user);
        this.notificationService.success(`Bienvenue ${user.name} !`);
        return true;
      } else {
        this._error.set('Email ou mot de passe incorrect');
        this.notificationService.error('Email ou mot de passe incorrect');
        return false;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown login error';
      this._error.set(errorMessage);
      this.notificationService.error('Erreur de connexion');
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  async register(userData: { name: string; email: string; password: string }): Promise<boolean> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      // fetch all existing users
      const allUsers = this.getAllUsers()();

      // check if email is already used
      if (allUsers.find(u => u.email === userData.email)) {
        this._error.set('Cet email est déjà utilisé');
        this.notificationService.warning('Cet email est déjà utilisé');
        return false;
      }

      // create the new user
      const newUser: User = {
        id: Math.max(...allUsers.map(u => u.id), 0) + 1, // unique id
        name: userData.name,
        email: userData.email,
        role: 'user',
        password: '',
      };

      // save in local storage
      const localUsers = this.storage.get<User[]>('users') ?? [];
      localUsers.push(newUser);
      this.storage.set('users', localUsers);

      const passwords = this.storage.get<Record<string, string>>('passwords') ?? {};
      passwords[userData.email] = userData.password;
      this.storage.set('passwords', passwords);

      // Essayer de synchroniser avec Mock API (optionnel)
      await this.syncUserWithMockApi(newUser);
      this.notificationService.success(`Compte créé avec succès ! Bienvenue ${userData.name}`);
      return true;
    } catch (error) {
      this.notificationService.error('Erreur lors de la création du compte');
      console.error(error);
      return false;
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
    return computed(() => {
      const mockUsers = this.mockApi.users();      // Utilisateurs Mock
      const localUsers = this.storage.get<User[]>('users') ?? []; // Utilisateurs locaux

      // Créer un Map pour éviter les doublons basé sur l'email
      const userMap = new Map<string, User>();

      // Ajouter d'abord les utilisateurs mock
      mockUsers.forEach(user => {
        userMap.set(user.email, user);
      });

      // Ajouter ensuite les utilisateurs locaux (écrase les doublons)
      localUsers.forEach(user => {
        userMap.set(user.email, user);
      });

      return Array.from(userMap.values());
    });
  }

  // Méthode pour synchroniser un nouvel utilisateur avec le mock API
  private async syncUserWithMockApi(user: User): Promise<void> {
    try {
      await this.mockApi.createUser(user);
    } catch (error) {
      console.warn('Failed to sync user with mock API:', error);
      // Continue silently - user is still saved in localStorage
    }
  }

  // Delete user by ID through Mock API
  async deleteUser(userId: number): Promise<boolean> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const success = await this.mockApi.deleteUser(userId);
      this.notificationService.success('Utilisateur supprimé avec succès');
      return success;
    } catch (error: unknown) {
      this.notificationService.error('Erreur lors de la suppression de l\'utilisateur');
      console.error(error);
      return false;
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