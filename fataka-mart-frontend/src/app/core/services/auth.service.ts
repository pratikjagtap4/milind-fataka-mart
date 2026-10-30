import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiResponse, AuthResponse, Role, User } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = '/api/auth';

  // Signals State
  private readonly TOKEN_KEY = 'fm_token';
  private readonly USER_KEY = 'fm_user';

  readonly token = signal<string | null>(this.getStoredToken());
  readonly currentUser = signal<User | null>(this.getStoredUser());

  // Computed Signals
  readonly isAuthenticated = computed(() => !!this.token() && !!this.currentUser());
  readonly role = computed<Role | null>(() => this.currentUser()?.role || null);
  readonly isSuperAdmin = computed(() => this.role() === 'SUPER_ADMIN');
  readonly isOwner = computed(() => this.role() === 'OWNER' || this.isSuperAdmin());
  readonly isCustomer = computed(() => this.role() === 'CUSTOMER');
  readonly currentShopId = computed(() => this.currentUser()?.shopId || null);
  readonly currentShopName = computed(() => this.currentUser()?.shopName || 'Main Store');

  constructor() {
    if (this.token()) {
      this.refreshProfile().subscribe({
        error: () => this.logout()
      });
    }
  }

  login(credentials: { username: string; password: string }): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setSession(res.data);
        }
      })
    );
  }

  register(data: { fullName: string; mobile: string; password: string; email?: string; address?: string; referredBy?: string }): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, data).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setSession(res.data);
        }
      })
    );
  }

  refreshProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.currentUser.set(res.data);
          localStorage.setItem(this.USER_KEY, JSON.stringify(res.data));
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  private setSession(auth: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, auth.accessToken);
    const user: User = {
      id: auth.userId,
      email: auth.email,
      fullName: auth.fullName,
      mobile: auth.mobile,
      role: auth.role,
      shopId: auth.shopId,
      shopName: auth.shopName,
      branchCode: auth.branchCode,
      isEnabled: true
    };
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.token.set(auth.accessToken);
    this.currentUser.set(user);

    // If customer logged in while on restricted owner page, navigate to storefront
    if (auth.role === 'CUSTOMER') {
      const currentUrl = this.router.url;
      if (currentUrl.includes('/pos') || currentUrl.includes('/dashboard') || currentUrl.includes('/inventory')) {
        this.router.navigate(['/']);
      }
    }
  }

  private getStoredToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private getStoredUser(): User | null {
    try {
      const data = localStorage.getItem(this.USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
}
