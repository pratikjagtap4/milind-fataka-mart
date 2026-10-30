import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from '../models/auth.models';
import { BaseProductDTO, CategoryDTO, CreateBaseProductRequest, CreateShopRequest, Shop } from '../models/catalog.models';
import { Customer, QuickCustomerCreateRequest } from '../models/billing.models';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private adminUrl = '/api/admin';
  private custUrl = '/api/customers';

  // Signals
  readonly shops = signal<Shop[]>([]);
  readonly categories = signal<CategoryDTO[]>([]);
  readonly baseProducts = signal<BaseProductDTO[]>([]);
  readonly customers = signal<Customer[]>([]);
  readonly isLoading = signal<boolean>(false);

  // --- SHOPS ---
  loadShops(): Observable<ApiResponse<Shop[]>> {
    this.isLoading.set(true);
    return this.http.get<ApiResponse<Shop[]>>(`${this.adminUrl}/shops`).pipe(
      tap({
        next: res => {
          if (res.success && res.data) {
            this.shops.set(res.data);
          }
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      })
    );
  }

  createShop(req: CreateShopRequest): Observable<ApiResponse<Shop>> {
    return this.http.post<ApiResponse<Shop>>(`${this.adminUrl}/shops`, req).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.shops.set([res.data, ...this.shops()]);
        }
      })
    );
  }

  updateShop(id: number, req: CreateShopRequest): Observable<ApiResponse<Shop>> {
    return this.http.put<ApiResponse<Shop>>(`${this.adminUrl}/shops/${id}`, req).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.shops.set(this.shops().map(s => s.id === id ? res.data : s));
        }
      })
    );
  }

  // --- CATEGORIES ---
  loadCategories(): Observable<ApiResponse<CategoryDTO[]>> {
    return this.http.get<ApiResponse<CategoryDTO[]>>(`${this.adminUrl}/categories`).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.categories.set(res.data);
        }
      })
    );
  }

  createCategory(req: CategoryDTO): Observable<ApiResponse<CategoryDTO>> {
    return this.http.post<ApiResponse<CategoryDTO>>(`${this.adminUrl}/categories`, req).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.categories.set([...this.categories(), res.data]);
        }
      })
    );
  }

  updateCategory(id: number, req: CategoryDTO): Observable<ApiResponse<CategoryDTO>> {
    return this.http.put<ApiResponse<CategoryDTO>>(`${this.adminUrl}/categories/${id}`, req).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.categories.set(this.categories().map(c => c.id === id ? res.data : c));
        }
      })
    );
  }

  deleteCategory(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.adminUrl}/categories/${id}`).pipe(
      tap(() => {
        this.categories.set(this.categories().filter(c => c.id !== id));
      })
    );
  }

  // --- MASTER BASE PRODUCTS ---
  loadBaseProducts(): Observable<ApiResponse<BaseProductDTO[]>> {
    return this.http.get<ApiResponse<BaseProductDTO[]>>(`${this.adminUrl}/base-products`).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.baseProducts.set(res.data);
        }
      })
    );
  }

  createBaseProduct(req: CreateBaseProductRequest): Observable<ApiResponse<BaseProductDTO>> {
    return this.http.post<ApiResponse<BaseProductDTO>>(`${this.adminUrl}/base-products`, req).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.baseProducts.set([res.data, ...this.baseProducts()]);
        }
      })
    );
  }

  updateBaseProduct(id: number, req: CreateBaseProductRequest): Observable<ApiResponse<BaseProductDTO>> {
    return this.http.put<ApiResponse<BaseProductDTO>>(`${this.adminUrl}/base-products/${id}`, req).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.baseProducts.set(this.baseProducts().map(p => p.id === id ? res.data : p));
        }
      })
    );
  }

  deleteBaseProduct(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.adminUrl}/base-products/${id}`).pipe(
      tap(() => {
        this.baseProducts.set(this.baseProducts().filter(p => p.id !== id));
      })
    );
  }

  // --- CUSTOMERS ---
  loadCustomers(shopId?: number): Observable<ApiResponse<Customer[]>> {
    let params: any = {};
    if (shopId) params.shopId = shopId;
    return this.http.get<ApiResponse<Customer[]>>(this.custUrl, { params }).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.customers.set(res.data);
        }
      })
    );
  }

  createCustomer(req: QuickCustomerCreateRequest): Observable<ApiResponse<Customer>> {
    return this.http.post<ApiResponse<Customer>>(`${this.custUrl}/quick-create`, req).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.customers.set([res.data, ...this.customers()]);
        }
      })
    );
  }

  updateCustomer(id: number, req: QuickCustomerCreateRequest): Observable<ApiResponse<Customer>> {
    return this.http.put<ApiResponse<Customer>>(`${this.custUrl}/${id}`, req).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.customers.set(this.customers().map(c => c.id === id ? res.data : c));
        }
      })
    );
  }

  deleteCustomer(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.custUrl}/${id}`).pipe(
      tap(() => {
        this.customers.set(this.customers().filter(c => c.id !== id));
      })
    );
  }

  uploadImage(file: File): Observable<ApiResponse<{ url: string; filename: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<{ url: string; filename: string }>>('/api/upload/image', formData);
  }
}
