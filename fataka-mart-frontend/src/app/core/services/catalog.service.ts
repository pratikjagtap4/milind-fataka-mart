import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from '../models/auth.models';
import { Category, CustomerProduct, Shop } from '../models/catalog.models';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private http = inject(HttpClient);
  private apiUrl = '/api/public';

  // Signals State
  readonly shops = signal<Shop[]>([]);
  readonly selectedShop = signal<Shop | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly selectedCategorySlug = signal<string>('all');
  readonly searchQuery = signal<string>('');
  readonly products = signal<CustomerProduct[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly selectedProductDetail = signal<CustomerProduct | null>(null);

  // Computed Signals
  readonly filteredProducts = computed(() => {
    let list = this.products();
    const query = this.searchQuery().trim().toLowerCase();
    const catSlug = this.selectedCategorySlug();

    if (catSlug !== 'all') {
      list = list.filter(p => p.categorySlug === catSlug);
    }

    if (query) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.companyName.toLowerCase().includes(query) ||
        p.categoryName.toLowerCase().includes(query)
      );
    }

    return list;
  });

  loadActiveShops(): Observable<ApiResponse<Shop[]>> {
    return this.http.get<ApiResponse<Shop[]>>(`${this.apiUrl}/shops`).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.shops.set(res.data);
          if (!this.selectedShop() && res.data.length > 0) {
            this.selectedShop.set(res.data[0]);
          }
        }
      })
    );
  }

  loadCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(`${this.apiUrl}/categories`).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.categories.set(res.data);
        }
      })
    );
  }

  loadProducts(shopId?: number, categoryId?: number, search?: string): Observable<ApiResponse<CustomerProduct[]>> {
    this.isLoading.set(true);
    let params: any = {};
    if (shopId) params.shopId = shopId;
    if (categoryId) params.categoryId = categoryId;
    if (search) params.search = search;

    return this.http.get<ApiResponse<CustomerProduct[]>>(`${this.apiUrl}/products`, { params }).pipe(
      tap({
        next: res => {
          if (res.success && res.data) {
            this.products.set(res.data);
          }
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      })
    );
  }

  selectShop(shop: Shop): void {
    this.selectedShop.set(shop);
    this.loadProducts(shop.id).subscribe();
  }

  selectCategory(slug: string): void {
    this.selectedCategorySlug.set(slug);
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  openProductModal(product: CustomerProduct): void {
    this.selectedProductDetail.set(product);
  }

  closeProductModal(): void {
    this.selectedProductDetail.set(null);
  }
}
