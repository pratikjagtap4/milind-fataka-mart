import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from '../models/auth.models';
import { ShopDashboard, SuperAdminDashboard } from '../models/analytics.models';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private apiUrl = '/api/analytics';

  // Signals State
  readonly shopDashboard = signal<ShopDashboard | null>(null);
  readonly adminDashboard = signal<SuperAdminDashboard | null>(null);
  readonly isLoading = signal<boolean>(false);

  loadShopDashboard(shopId?: number): Observable<ApiResponse<ShopDashboard>> {
    this.isLoading.set(true);
    let params: any = {};
    if (shopId) params.shopId = shopId;

    return this.http.get<ApiResponse<ShopDashboard>>(`${this.apiUrl}/shop-dashboard`, { params }).pipe(
      tap({
        next: res => {
          if (res.success && res.data) {
            this.shopDashboard.set(res.data);
          }
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      })
    );
  }

  loadMasterDashboard(): Observable<ApiResponse<SuperAdminDashboard>> {
    this.isLoading.set(true);
    return this.http.get<ApiResponse<SuperAdminDashboard>>(`${this.apiUrl}/master-dashboard`).pipe(
      tap({
        next: res => {
          if (res.success && res.data) {
            this.adminDashboard.set(res.data);
          }
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      })
    );
  }
}
