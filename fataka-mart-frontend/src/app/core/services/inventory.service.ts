import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from '../models/auth.models';
import { ImportProductRequest, OwnerInventory, QuickCreateProductRequest, UpdateShopInventoryRequest } from '../models/inventory.models';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private http = inject(HttpClient);
  private apiUrl = '/api/inventory';

  // Signals State
  readonly inventory = signal<OwnerInventory[]>([]);
  readonly lowStockItems = signal<OwnerInventory[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly searchQuery = signal<string>('');
  readonly selectedItem = signal<OwnerInventory | null>(null);

  // Computed Signals
  readonly filteredInventory = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.inventory();
    return this.inventory().filter(item =>
      item.productName.toLowerCase().includes(query) ||
      item.companyName.toLowerCase().includes(query) ||
      item.categoryName.toLowerCase().includes(query)
    );
  });

  readonly totalItemsCount = computed(() => this.inventory().length);
  readonly lowStockCount = computed(() => this.lowStockItems().length);

  loadShopInventory(shopId?: number, categoryId?: number, search?: string): Observable<ApiResponse<OwnerInventory[]>> {
    this.isLoading.set(true);
    let params: any = {};
    if (shopId) params.shopId = shopId;
    if (categoryId) params.categoryId = categoryId;
    if (search) params.search = search;

    return this.http.get<ApiResponse<OwnerInventory[]>>(this.apiUrl, { params }).pipe(
      tap({
        next: res => {
          if (res.success && res.data) {
            this.inventory.set(res.data);
          }
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      })
    );
  }

  loadLowStock(shopId?: number): Observable<ApiResponse<OwnerInventory[]>> {
    let params: any = {};
    if (shopId) params.shopId = shopId;

    return this.http.get<ApiResponse<OwnerInventory[]>>(`${this.apiUrl}/low-stock`, { params }).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.lowStockItems.set(res.data);
        }
      })
    );
  }

  updateInventoryItem(id: number, request: UpdateShopInventoryRequest): Observable<ApiResponse<OwnerInventory>> {
    return this.http.put<ApiResponse<OwnerInventory>>(`${this.apiUrl}/${id}`, request).pipe(
      tap(res => {
        if (res.success && res.data) {
          const updated = this.inventory().map(item => item.id === id ? res.data : item);
          this.inventory.set(updated);
        }
      })
    );
  }

  importBaseProduct(request: ImportProductRequest): Observable<ApiResponse<OwnerInventory>> {
    return this.http.post<ApiResponse<OwnerInventory>>(`${this.apiUrl}/import`, request).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.inventory.set([res.data, ...this.inventory()]);
        }
      })
    );
  }

  quickCreateProduct(request: QuickCreateProductRequest): Observable<ApiResponse<OwnerInventory>> {
    return this.http.post<ApiResponse<OwnerInventory>>(`${this.apiUrl}/quick-create`, request).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.inventory.set([res.data, ...this.inventory()]);
        }
      })
    );
  }

  setSearch(query: string): void {
    this.searchQuery.set(query);
  }

  uploadImage(file: File): Observable<ApiResponse<{ url: string; filename: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<{ url: string; filename: string }>>('/api/upload/image', formData);
  }

  syncInventoryToAllShops(sourceShopId?: number, targetShopId?: number): Observable<ApiResponse<string>> {
    let params: any = {};
    if (sourceShopId) params.sourceShopId = sourceShopId;
    if (targetShopId) params.targetShopId = targetShopId;
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/sync-all`, {}, { params });
  }

  deleteInventoryItem(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/${id}`).pipe(
      tap(res => {
        if (res.success) {
          this.inventory.set(this.inventory().filter(item => item.id !== id));
        }
      })
    );
  }
}
