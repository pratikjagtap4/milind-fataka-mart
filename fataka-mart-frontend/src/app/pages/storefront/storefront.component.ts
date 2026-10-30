import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../core/services/catalog.service';
import { CartService } from '../../core/services/cart.service';
import { CustomerProduct } from '../../core/models/catalog.models';
import { ProductModalComponent } from '../../components/product-modal/product-modal.component';

@Component({
  selector: 'app-storefront',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductModalComponent],
  template: `
    <div class="min-h-screen bg-slate-50/50 text-slate-800 pb-20">
      
      <!-- HERO BANNER (Light Festive) -->
      <section class="relative overflow-hidden bg-gradient-to-b from-amber-500/10 via-orange-500/5 to-transparent py-10 sm:py-14 px-4 sm:px-6 lg:px-8 border-b border-amber-200/60">
        <div class="max-w-7xl mx-auto text-center relative z-10">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold uppercase tracking-wider mb-3 shadow-2xs">
            <span>✨</span> Diwali Festive Fireworks 2026 <span>✨</span>
          </div>

          <h1 class="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
            Celebrate with Pure Joy & 
            <span class="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
              Fataka Mart
            </span>
          </h1>

          <p class="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Premium sound, dazzling multi-colour sky cakes, spinning chakras, and sparkling phooljhadi. 
            Enjoy direct wholesale savings across all 4 sibling retail branches!
          </p>

          <!-- Branch Location Indicator -->
          <div class="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-amber-200 text-xs text-amber-900 shadow-sm">
            <span>📍 Currently Browsing:</span>
            <span class="font-bold text-slate-900">{{ catalogService.selectedShop()?.name || 'Main Mega Store' }}</span>
            <span class="text-slate-500">({{ catalogService.selectedShop()?.city }})</span>
          </div>

          <!-- Search Input -->
          <div class="mt-7 max-w-xl mx-auto relative">
            <input 
              type="text" 
              [ngModel]="catalogService.searchQuery()"
              (ngModelChange)="catalogService.setSearchQuery($event)"
              placeholder="Search sparklers, chakras, 1000 wala, sky cakes, hydro bombs..."
              class="w-full px-5 py-3.5 pl-12 rounded-2xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-md">
            <span class="absolute left-4 top-3.5 text-lg text-slate-400">🔍</span>
            @if (catalogService.searchQuery()) {
              <button 
                (click)="catalogService.setSearchQuery('')"
                class="absolute right-4 top-3.5 text-slate-400 hover:text-slate-700 text-xs p-1 cursor-pointer">
                ✕
              </button>
            }
          </div>
        </div>
      </section>

      <!-- FESTIVE CATEGORIES (WITH REAL PHOTOS) -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span>🏮</span> Festive Fireworks Categories
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">Filter items by category</p>
          </div>
          @if (catalogService.selectedCategorySlug() !== 'all') {
            <button 
              (click)="catalogService.selectCategory('all')"
              class="text-xs font-bold text-amber-700 hover:underline cursor-pointer">
              Show All Categories
            </button>
          }
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-4">
          <!-- All Categories Card -->
          <button 
            (click)="catalogService.selectCategory('all')"
            [class]="catalogService.selectedCategorySlug() === 'all' 
              ? 'ring-2 ring-amber-500 bg-amber-50 border-amber-300 shadow-md' 
              : 'border-slate-200 bg-white hover:border-amber-300 shadow-xs'"
            class="p-2.5 sm:p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-2 group cursor-pointer text-left min-w-0 overflow-hidden">
            <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center text-xl sm:text-2xl group-hover:scale-105 transition-transform shadow-xs">
              🎆
            </div>
            <div class="text-center w-full min-w-0">
              <span class="text-xs font-bold text-slate-900 block truncate">All Crackers</span>
              <span class="text-[10px] text-slate-500 font-medium">Full Catalog</span>
            </div>
          </button>

          <!-- Dynamic Category Cards with Actual Photos -->
          @for (cat of catalogService.categories(); track cat.id) {
            <button 
              (click)="catalogService.selectCategory(cat.slug)"
              [class]="catalogService.selectedCategorySlug() === cat.slug 
                ? 'ring-2 ring-amber-500 bg-amber-50 border-amber-300 shadow-md' 
                : 'border-slate-200 bg-white hover:border-amber-300 shadow-xs'"
              class="p-2 sm:p-2.5 rounded-2xl border transition flex flex-col items-center justify-between gap-2 group cursor-pointer text-center min-w-0 overflow-hidden">
              
              <!-- Category Photo -->
              <div class="w-full h-14 sm:h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs">
                <img 
                  [src]="cat.imageUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80'" 
                  [alt]="cat.name"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
              </div>

              <!-- Category Title -->
              <div class="w-full px-0.5 sm:px-1 min-w-0">
                <span class="text-xs font-bold text-slate-900 block truncate leading-tight">
                  {{ cat.name.split('(')[0].trim() }}
                </span>
                <span class="text-[10px] text-amber-700 font-semibold block mt-0.5">
                  View Collection
                </span>
              </div>
            </button>
          }
        </div>
      </section>

      <!-- PRODUCTS GRID -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div class="flex items-center justify-between mb-6 pb-2 border-b border-slate-200">
          <div>
            <h2 class="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span>🎆</span> Available Fireworks
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">
              Showing {{ catalogService.filteredProducts().length }} items in stock
            </p>
          </div>
        </div>

        @if (catalogService.isLoading()) {
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="h-72 rounded-2xl bg-white border border-slate-200 animate-pulse p-4"></div>
            }
          </div>
        } @else if (catalogService.filteredProducts().length === 0) {
          <div class="text-center py-20 bg-white rounded-3xl border border-slate-200 max-w-xl mx-auto shadow-sm">
            <span class="text-5xl mb-3 block">🔍</span>
            <h3 class="text-lg font-bold text-slate-800">No Firecrackers Found</h3>
            <p class="text-xs text-slate-500 mt-1 mb-6">Try searching with a different keyword or category.</p>
            <button 
              (click)="resetFilters()"
              class="px-5 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold shadow-md hover:bg-amber-600 cursor-pointer">
              Show All Products
            </button>
          </div>
        } @else {
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            @for (prod of catalogService.filteredProducts(); track prod.id) {
              <div class="rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group shadow-2xs min-w-0">
                
                <!-- Product Card Top (Click to open photo modal) -->
                <div class="cursor-pointer" (click)="catalogService.openProductModal(prod)">
                  <!-- Image Container -->
                  <div class="relative aspect-square overflow-hidden bg-slate-50">
                    <img 
                      [src]="prod.images[0] || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80'" 
                      [alt]="prod.name"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                    
                    <div class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-white/90 border border-slate-200 text-slate-800 text-[10px] font-bold shadow-xs">
                      {{ prod.companyName }}
                    </div>

                    <div class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-green-600 text-white text-[10px] font-black shadow-xs">
                      {{ prod.discountPercentage }}% OFF
                    </div>
                  </div>

                  <!-- Details -->
                  <div class="p-3.5 sm:p-4">
                    <span class="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
                      {{ prod.categoryName }}
                    </span>
                    <h3 class="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition truncate leading-snug">
                      {{ prod.name }}
                    </h3>
                    <p class="text-xs text-slate-500 mt-0.5">📦 {{ prod.packDescription }}</p>
                  </div>
                </div>

                <!-- Product Card Bottom (Pricing & Action) -->
                <div class="p-3.5 sm:p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
                  <div>
                    <div class="flex items-baseline gap-1.5">
                      <span class="text-base font-extrabold text-amber-800">₹{{ prod.discountedPrice }}</span>
                      <span class="text-xs text-slate-400 line-through">₹{{ prod.mrp }}</span>
                    </div>
                    <span class="text-[10px] text-green-700 font-bold">Save ₹{{ (prod.mrp - prod.discountedPrice).toFixed(0) }}</span>
                  </div>

                  <button 
                    (click)="cartService.addToCart(prod, 1)"
                    class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-1 active:scale-95 cursor-pointer">
                    <span>+</span> Add
                  </button>
                </div>

              </div>
            }
          </div>
        }
      </section>

      <!-- PRODUCT DETAIL MODAL -->
      @if (catalogService.selectedProductDetail()) {
        <app-product-modal 
          [product]="catalogService.selectedProductDetail()"
          (close)="catalogService.closeProductModal()">
        </app-product-modal>
      }

    </div>
  `
})
export class StorefrontComponent implements OnInit {
  catalogService = inject(CatalogService);
  cartService = inject(CartService);

  ngOnInit(): void {
    this.catalogService.loadActiveShops().subscribe();
    this.catalogService.loadCategories().subscribe();
    this.catalogService.loadProducts().subscribe();
  }

  resetFilters(): void {
    this.catalogService.selectCategory('all');
    this.catalogService.setSearchQuery('');
  }
}
