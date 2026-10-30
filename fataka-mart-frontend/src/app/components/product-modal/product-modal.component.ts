import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerProduct } from '../../core/models/catalog.models';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (product) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
        <div class="relative w-full max-w-2xl bg-white border border-amber-300 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] text-slate-800">
          
          <!-- Close Button -->
          <button 
            (click)="close.emit()" 
            class="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-full bg-white/90 text-slate-500 hover:text-slate-900 flex items-center justify-center border border-slate-200 shadow-sm transition cursor-pointer">
            ✕
          </button>

          <!-- Left: Photos Gallery -->
          <div class="w-full md:w-1/2 p-5 bg-slate-50/80 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200">
            <!-- Main Photo -->
            <div class="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 mb-3 bg-white flex items-center justify-center shadow-2xs">
              <img 
                [src]="activePhotoUrl() || product.images[0] || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80'" 
                [alt]="product.name"
                class="w-full h-full object-cover">
              
              <div class="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                {{ product.categoryName }}
              </div>
            </div>

            <!-- Thumbnails (2-3 photos) -->
            @if (product.images.length > 1) {
              <div class="flex gap-2">
                @for (img of product.images; track img) {
                  <button 
                    (click)="activePhotoUrl.set(img)"
                    [class]="activePhotoUrl() === img ? 'ring-2 ring-amber-500 shadow-sm' : 'opacity-70 hover:opacity-100'"
                    class="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 transition bg-white cursor-pointer">
                    <img [src]="img" class="w-full h-full object-cover" [alt]="product.name">
                  </button>
                }
              </div>
            }
          </div>

          <!-- Right: Details & Purchase -->
          <div class="w-full md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
            <div class="space-y-4">
              
              <div>
                <span class="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 mb-1.5">
                  🏷️ {{ product.companyName }}
                </span>
                <h3 class="text-lg font-black text-slate-900 leading-snug">{{ product.name }}</h3>
                <p class="text-xs text-slate-600 font-semibold mt-0.5">📦 {{ product.packDescription }}</p>
              </div>

              <!-- Pricing Display -->
              <div class="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex items-center justify-between">
                <div>
                  <div class="flex items-baseline gap-2">
                    <span class="text-2xl font-black text-amber-800">₹{{ product.discountedPrice }}</span>
                    <span class="text-xs text-slate-400 line-through">₹{{ product.mrp }}</span>
                  </div>
                  <span class="text-[11px] text-green-700 font-bold">
                    Festive Deal (Save ₹{{ (product.mrp - product.discountedPrice).toFixed(2) }})
                  </span>
                </div>
                <div class="text-right">
                  <span class="inline-block px-2.5 py-1 rounded-lg bg-green-600 text-white text-xs font-black shadow-xs">
                    {{ product.discountPercentage }}% OFF
                  </span>
                </div>
              </div>

              <!-- Safety Instructions -->
              @if (product.safetyInstructions) {
                <div class="p-3 rounded-2xl bg-orange-50/80 border border-orange-200 text-xs">
                  <div class="flex items-center gap-1.5 text-orange-900 font-bold mb-1">
                    <span>⚠️</span> Safety Guidelines:
                  </div>
                  <p class="text-slate-700 text-[11px] leading-relaxed">
                    {{ product.safetyInstructions }}
                  </p>
                </div>
              }

              <!-- Stock Availability -->
              <div class="flex items-center gap-2 text-xs">
                <span class="w-2.5 h-2.5 rounded-full" [class]="product.inStock ? 'bg-green-500' : 'bg-red-500'"></span>
                <span [class]="product.inStock ? 'text-green-700 font-bold' : 'text-red-600 font-bold'">
                  {{ product.inStock ? 'In Stock (' + product.availableStock + ' available at this branch)' : 'Out of Stock' }}
                </span>
              </div>

            </div>

            <!-- Add to Cart Action -->
            <div class="pt-5 border-t border-slate-100 mt-4 flex items-center gap-3">
              <!-- Quantity Stepper -->
              <div class="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1">
                <button 
                  (click)="qty.set(qty() > 1 ? qty() - 1 : 1)"
                  class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-slate-700 hover:text-slate-900 hover:bg-white cursor-pointer transition">
                  -
                </button>
                <span class="w-10 text-center font-bold text-slate-900 text-sm">{{ qty() }}</span>
                <button 
                  (click)="qty.set(qty() + 1)"
                  class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-slate-700 hover:text-slate-900 hover:bg-white cursor-pointer transition">
                  +
                </button>
              </div>

              <button 
                (click)="onAddToCart()"
                class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-extrabold text-sm shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95">
                <span>🛒</span> Add to Festive Bucket
              </button>
            </div>

          </div>

        </div>
      </div>
    }
  `
})
export class ProductModalComponent {
  @Input() product: CustomerProduct | null = null;
  @Output() close = new EventEmitter<void>();

  private cartService = inject(CartService);

  readonly qty = signal<number>(1);
  readonly activePhotoUrl = signal<string | null>(null);

  onAddToCart(): void {
    if (this.product) {
      this.cartService.addToCart(this.product, this.qty());
      this.close.emit();
    }
  }
}
