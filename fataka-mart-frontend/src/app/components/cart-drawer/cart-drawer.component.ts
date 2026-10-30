import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../core/services/auth-modal.service';
import { BillingPosService } from '../../core/services/billing-pos.service';
import { CatalogService } from '../../core/services/catalog.service';
import { BillCreateRequest, BillResponse } from '../../core/models/billing.models';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (cartService.isDrawerOpen()) {
      <div class="fixed inset-0 z-50 overflow-hidden">
        
        <!-- Backdrop -->
        <div 
          (click)="cartService.closeDrawer()"
          class="absolute inset-0 bg-slate-900/50 backdrop-blur-2xs transition-opacity">
        </div>

        <div class="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
          <div class="w-screen max-w-[calc(100vw-1rem)] sm:max-w-md bg-white border-l border-amber-200 flex flex-col shadow-2xl text-slate-800">
            
            <!-- Drawer Header -->
            <div class="p-4 sm:p-5 bg-amber-50/90 border-b border-amber-200 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span class="text-2xl">🛒</span>
                <div>
                  <h2 class="text-base font-extrabold text-slate-900">Your Festive Bucket</h2>
                  <p class="text-xs font-semibold text-amber-700">{{ cartService.totalItemsCount() }} celebration items selected</p>
                </div>
              </div>
              <button 
                (click)="cartService.closeDrawer()"
                class="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition cursor-pointer">
                ✕
              </button>
            </div>

            <!-- Items List -->
            <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              @if (cartService.items().length === 0) {
                <div class="text-center py-16">
                  <div class="text-5xl mb-3">🎇</div>
                  <h3 class="text-base font-bold text-slate-800">Your Bucket is Empty</h3>
                  <p class="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-6">
                    Add sparkling phooljhadi, spinning chakras, and high sky shots to light up your Diwali!
                  </p>
                  <button 
                    (click)="cartService.closeDrawer()"
                    class="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-bold shadow-md hover:from-amber-600 hover:to-orange-600 transition cursor-pointer">
                    Browse Festive Fireworks
                  </button>
                </div>
              } @else {
                @for (item of cartService.items(); track item.product.id) {
                  <div class="p-3 rounded-2xl bg-white border border-slate-200 flex gap-3 hover:border-amber-300 shadow-2xs transition">
                    <!-- Photo -->
                    <img 
                      [src]="item.product.images[0] || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80'" 
                      [alt]="item.product.name"
                      class="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0 bg-slate-50">

                    <!-- Info -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between gap-1">
                        <h4 class="text-xs font-bold text-slate-900 truncate">{{ item.product.name }}</h4>
                        <button 
                          (click)="cartService.removeFromCart(item.product.id)"
                          class="text-slate-400 hover:text-red-500 text-xs p-1 cursor-pointer">
                          🗑️
                        </button>
                      </div>
                      <p class="text-[11px] text-amber-700 font-medium">{{ item.product.companyName }}</p>
                      <p class="text-[10px] text-slate-500">{{ item.product.packDescription }}</p>

                      <div class="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                        <div class="flex items-baseline gap-1.5">
                          <span class="text-xs font-extrabold text-amber-700">₹{{ item.product.discountedPrice }}</span>
                          <span class="text-[10px] text-slate-400 line-through">₹{{ item.product.mrp }}</span>
                        </div>

                        <!-- Quantity Stepper -->
                        <div class="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                          <button 
                            (click)="cartService.updateQuantity(item.product.id, item.quantity - 1)"
                            class="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-700 hover:text-slate-900 rounded hover:bg-white cursor-pointer">
                            -
                          </button>
                          <span class="text-xs font-bold px-1.5 text-slate-800">{{ item.quantity }}</span>
                          <button 
                            (click)="cartService.updateQuantity(item.product.id, item.quantity + 1)"
                            class="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-700 hover:text-slate-900 rounded hover:bg-white cursor-pointer">
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              }
            </div>

            <!-- Drawer Footer / Checkout -->
            @if (cartService.items().length > 0) {
              <div class="p-4 sm:p-5 bg-amber-50/70 border-t border-amber-200 space-y-3">
                <!-- Savings Banner -->
                <div class="p-3 rounded-xl bg-green-100/70 border border-green-300 text-green-900 text-xs flex items-center justify-between font-bold">
                  <span>🎉 Festive Savings:</span>
                  <span>Save ₹{{ cartService.totalSavings().toFixed(2) }}</span>
                </div>

                <div class="space-y-1.5 text-xs text-slate-600">
                  <div class="flex justify-between">
                    <span>Total MRP:</span>
                    <span class="font-semibold text-slate-800">₹{{ cartService.subtotalMrp().toFixed(2) }}</span>
                  </div>
                  <div class="flex justify-between text-green-700 font-medium">
                    <span>Festive Discount Savings:</span>
                    <span>-₹{{ cartService.totalSavings().toFixed(2) }}</span>
                  </div>
                  <div class="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Net Payable:</span>
                    <span class="text-base text-amber-700 font-black">₹{{ cartService.finalPayable().toFixed(2) }}</span>
                  </div>
                </div>

                <!-- Checkout CTA -->
                @if (confirmedBill()) {
                  <div class="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 text-slate-800 space-y-2.5 shadow-sm">
                    <div class="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                      <span class="text-xl">🎉</span> Order Request Placed!
                    </div>
                    <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[11px] font-bold">
                      <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      Status: Awaiting Owner Review & Dispatch
                    </div>
                    <p class="text-xs text-slate-700">
                      Order No: <strong class="font-mono text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">{{ confirmedBill()?.billNumber }}</strong>
                    </p>
                    <div class="p-2.5 rounded-xl bg-white/80 border border-amber-200 text-[11px] text-slate-600 space-y-1">
                      <p class="font-medium text-slate-800">
                        📦 The shop owner will review your items, prepare & send the fatake, and send your official bill directly to your WhatsApp!
                      </p>
                      <p class="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        Branch: <strong>{{ confirmedBill()?.shopName }}</strong> (📞 {{ confirmedBill()?.contactPhone }})
                      </p>
                    </div>
                    <div class="pt-1">
                      <button 
                        (click)="closeOrderSuccess()"
                        class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs transition shadow-sm cursor-pointer">
                        Done / Continue Shopping
                      </button>
                    </div>
                  </div>
                } @else if (authService.isAuthenticated()) {
                  <button 
                    (click)="onCheckout()"
                    [disabled]="isSubmitting()"
                    class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-extrabold text-sm shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50">
                    @if (isSubmitting()) {
                      <span class="animate-spin text-sm">⏳</span> Placing Order...
                    } @else {
                      <span>✨</span> Confirm Bucket Order (₹{{ cartService.finalPayable().toFixed(2) }})
                    }
                  </button>
                } @else {
                  <button 
                    (click)="promptLogin()"
                    class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-extrabold text-sm shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95">
                    <span>🔑</span> Sign In to Checkout
                  </button>
                  <p class="text-[10px] text-center text-slate-500">
                    * Guest bucket items are saved. Fast mobile sign-in!
                  </p>
                }
              </div>
            }

          </div>
        </div>

      </div>
    }
  `
})
export class CartDrawerComponent {
  cartService = inject(CartService);
  authService = inject(AuthService);
  authModalService = inject(AuthModalService);
  billingService = inject(BillingPosService);
  catalogService = inject(CatalogService);

  readonly isSubmitting = signal<boolean>(false);
  readonly confirmedBill = signal<BillResponse | null>(null);

  @Output() openAuth = new EventEmitter<void>();

  promptLogin(): void {
    this.openAuth.emit();
    this.authModalService.open();
  }

  onCheckout(): void {
    if (this.cartService.items().length === 0) return;

    const user = this.authService.currentUser();
    const items = this.cartService.items().map(it => ({
      shopInventoryId: it.product.id,
      quantity: it.quantity,
      sellingPrice: it.product.mrp,
      discountPercentage: it.product.discountPercentage,
      finalRate: it.product.discountedPrice
    }));

    const shopId = this.cartService.items()[0]?.product.shopId || this.catalogService.selectedShop()?.id || 1;
    const req: BillCreateRequest = {
      shopId,
      customerName: user?.fullName || 'Online Customer',
      customerMobile: user?.mobile || '8390608383',
      customerTier: 'NORMAL',
      paymentMethod: 'UPI',
      overallDiscountPercentage: 0,
      status: 'PENDING_REVIEW',
      items
    };

    this.isSubmitting.set(true);
    this.billingService.placeCustomerOrder(req).subscribe({
      next: (res: any) => {
        this.isSubmitting.set(false);
        if (res.success && res.data) {
          this.confirmedBill.set(res.data);
          this.cartService.clearCart();
        }
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        alert('Failed to place order: ' + (err.error?.message || err.message));
      }
    });
  }

  closeOrderSuccess(): void {
    this.confirmedBill.set(null);
    this.cartService.closeDrawer();
  }
}
