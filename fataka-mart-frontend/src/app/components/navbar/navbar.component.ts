import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { CatalogService } from '../../core/services/catalog.service';
import { AuthModalService } from '../../core/services/auth-modal.service';
import { BillingPosService } from '../../core/services/billing-pos.service';
import { Shop } from '../../core/models/catalog.models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/80 shadow-sm transition-all w-full max-w-full">
      <div class="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-3">
          
          <!-- LEFT: Brand & Logo (Milind Phataka Mart) -->
          <div class="flex items-center py-1 min-w-0 flex-shrink">
            <a routerLink="/" class="flex items-center gap-1.5 sm:gap-2.5 group min-w-0">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform text-white border border-amber-200/40 flex-shrink-0">
                <span class="text-base sm:text-xl drop-shadow">🪔</span>
              </div>
              <div class="whitespace-nowrap flex items-center leading-none">
                <span class="text-sm sm:text-xl font-black tracking-tight text-red-600">
                  MILIND
                </span>
                <span class="text-sm sm:text-xl font-black tracking-tight text-amber-600 ml-1">
                  PHATAKA
                </span>
                <span class="hidden sm:inline text-sm sm:text-xl font-black tracking-tight text-amber-600 ml-1">
                  MART
                </span>
              </div>
            </a>
          </div>

          <!-- CENTER: Navigation Links (Desktop) -->
          <nav class="hidden md:flex items-center gap-1.5">
            <a routerLink="/" 
               routerLinkActive="bg-amber-100 text-amber-900 font-bold border-amber-300" 
               [routerLinkActiveOptions]="{exact: true}"
               class="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-amber-800 hover:bg-amber-50/70 transition border border-transparent">
              ✨ Storefront
            </a>

            @if (authService.isOwner()) {
              <a routerLink="/pos" 
                 routerLinkActive="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-sm"
                 class="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-100/70 hover:bg-amber-200/80 transition border border-amber-300 flex items-center gap-1.5">
                ⚡ Speed Billing POS
              </a>

              <a routerLink="/inventory" 
                 routerLinkActive="bg-amber-100 text-amber-900 font-bold border-amber-300"
                 class="px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-amber-800 hover:bg-amber-50/70 transition border border-transparent">
                📦 Inventory
              </a>

              <a routerLink="/dashboard" 
                 routerLinkActive="bg-amber-100 text-amber-900 font-bold border-amber-300"
                 class="px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-amber-800 hover:bg-amber-50/70 transition border border-transparent">
                📊 Analytics
              </a>
            }
          </nav>

          <!-- RIGHT: Cart & User Auth -->
          <div class="flex items-center gap-1 sm:gap-2.5 flex-shrink-0">
            
            <!-- Owner Customer Orders Notification Bell -->
            @if (authService.isOwner()) {
              <button 
                (click)="billingService.toggleNotificationPanel()"
                title="Customer Orders Notification Panel"
                class="relative p-1.5 sm:px-3 sm:py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-slate-800 transition flex items-center gap-1.5 shadow-2xs cursor-pointer flex-shrink-0">
                <span class="text-base">🔔</span>
                <span class="hidden sm:inline text-xs font-bold text-amber-900">Orders</span>
                @if (billingService.pendingOrdersCount() > 0) {
                  <span class="min-w-4.5 h-4.5 sm:min-w-5 sm:h-5 px-1 bg-red-600 text-white text-[10px] sm:text-[11px] font-black rounded-full flex items-center justify-center shadow animate-bounce">
                    {{ billingService.pendingOrdersCount() }}
                  </span>
                }
              </button>
            }

            <!-- Cart Bucket Button -->
            <button 
              (click)="cartService.toggleDrawer()"
              class="relative p-1.5 sm:px-3 sm:py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-slate-700 hover:text-amber-900 transition flex items-center gap-1.5 shadow-2xs cursor-pointer flex-shrink-0">
              <span class="text-base">🛒</span>
              <span class="hidden sm:inline text-xs font-bold">Bucket</span>
              @if (cartService.totalItemsCount() > 0) {
                <span class="min-w-4.5 h-4.5 sm:min-w-5 sm:h-5 px-1 bg-red-600 text-white text-[10px] sm:text-[11px] font-extrabold rounded-full flex items-center justify-center shadow">
                  {{ cartService.totalItemsCount() }}
                </span>
              }
            </button>

            <!-- User Auth Profile -->
            @if (authService.isAuthenticated()) {
              <div class="relative flex-shrink-0">
                <button 
                  (click)="isProfileOpen.set(!isProfileOpen())"
                  class="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-3 sm:py-1.5 rounded-xl bg-white border border-slate-300 hover:border-amber-400 text-slate-700 text-xs font-medium shadow-2xs cursor-pointer">
                  <div class="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs flex-shrink-0">
                    {{ authService.currentUser()?.fullName?.charAt(0) || 'U' }}
                  </div>
                  <span class="hidden md:inline max-w-[110px] truncate font-semibold text-slate-800">{{ authService.currentUser()?.fullName }}</span>
                  <span class="hidden sm:inline text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-semibold">{{ authService.role() }}</span>
                </button>

                @if (isProfileOpen()) {
                  <div class="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 animate-fade-in">
                    <div class="px-2 py-2 border-b border-slate-100">
                      <p class="text-xs font-bold text-slate-900 truncate">{{ authService.currentUser()?.fullName }}</p>
                      <p class="text-[11px] text-slate-500 truncate">{{ authService.currentUser()?.email }}</p>
                      <span class="inline-block mt-1 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                        {{ authService.role() }}
                      </span>
                    </div>

                    <!-- Current Branch Details -->
                    <div class="mt-2.5 p-2 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs">
                      <div class="text-[11px] font-bold text-amber-900 flex items-center gap-1 mb-0.5">
                        <span>🏬</span> Current Branch:
                      </div>
                      <div class="font-semibold text-slate-800 text-xs truncate">
                        {{ catalogService.selectedShop()?.name || authService.currentShopName() }}
                      </div>
                    </div>

                    <!-- Admin Only Branch Switcher -->
                    @if (authService.isSuperAdmin() && catalogService.shops().length > 1) {
                      <div class="mt-2.5 pt-2.5 border-t border-slate-100">
                        <label class="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <span>🔄</span> Switch Branch (Super Admin):
                        </label>
                        <select 
                          class="w-full text-xs font-semibold bg-white border border-amber-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs"
                          [value]="catalogService.selectedShop()?.id"
                          (change)="onBranchChange($event)">
                          @for (shop of catalogService.shops(); track shop.id) {
                            <option [value]="shop.id">
                              {{ shop.name }}
                            </option>
                          }
                        </select>
                      </div>
                    }

                    @if (authService.isOwner()) {
                      <div class="py-2 space-y-1">
                        <a routerLink="/pos" (click)="isProfileOpen.set(false)" class="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-50 rounded-xl transition">
                          <span>⚡</span> Open Speed POS
                        </a>
                        <a routerLink="/inventory" (click)="isProfileOpen.set(false)" class="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition">
                          <span>📦</span> Manage Inventory
                        </a>
                        <a routerLink="/dashboard" (click)="isProfileOpen.set(false)" class="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition">
                          <span>📊</span> Sales & Margin Analytics
                        </a>
                      </div>
                    }

                    <div class="pt-2 border-t border-slate-100">
                      <button 
                        (click)="logout()"
                        class="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition flex items-center gap-2 cursor-pointer">
                        <span>🚪</span> Sign Out
                      </button>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <button 
                (click)="authModalService.open()"
                class="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition flex items-center gap-1 sm:gap-1.5 cursor-pointer active:scale-95 flex-shrink-0">
                <span>🔑</span> <span class="hidden xs:inline">Sign In</span>
              </button>
            }

            <!-- Mobile Hamburger Toggle -->
            <button 
              (click)="isMobileMenuOpen.set(!isMobileMenuOpen())"
              class="md:hidden p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer flex-shrink-0">
              <span class="text-xl leading-none">{{ isMobileMenuOpen() ? '✕' : '☰' }}</span>
            </button>

          </div>

        </div>

        <!-- MOBILE SLIDE-DOWN MENU -->
        @if (isMobileMenuOpen()) {
          <div class="md:hidden py-4 border-t border-slate-100 space-y-3 animate-fade-in">
            <div class="flex flex-col space-y-1 px-2">
              <a routerLink="/" 
                 (click)="isMobileMenuOpen.set(false)"
                 routerLinkActive="bg-amber-100 text-amber-900 font-bold" 
                 [routerLinkActiveOptions]="{exact: true}"
                 class="px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50">
                ✨ Storefront Catalog
              </a>

              @if (authService.isOwner()) {
                <button 
                  (click)="billingService.openNotificationPanel(); isMobileMenuOpen.set(false)"
                  class="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-amber-900 bg-amber-100/70 hover:bg-amber-200/80 flex items-center justify-between cursor-pointer">
                  <span class="flex items-center gap-2"><span>🔔</span> Customer Orders</span>
                  @if (billingService.pendingOrdersCount() > 0) {
                    <span class="px-2 py-0.5 rounded-full bg-red-600 text-white text-xs font-bold animate-pulse">{{ billingService.pendingOrdersCount() }}</span>
                  }
                </button>

                <a routerLink="/pos" 
                   (click)="isMobileMenuOpen.set(false)"
                   routerLinkActive="bg-amber-100 text-amber-900 font-bold"
                   class="px-3 py-2 rounded-xl text-sm font-bold text-amber-800 hover:bg-amber-50 flex items-center gap-2">
                  <span>⚡</span> Speed Billing POS
                </a>

                <a routerLink="/inventory" 
                   (click)="isMobileMenuOpen.set(false)"
                   routerLinkActive="bg-amber-100 text-amber-900 font-bold"
                   class="px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                  <span>📦</span> Inventory Manager
                </a>

                <a routerLink="/dashboard" 
                   (click)="isMobileMenuOpen.set(false)"
                   routerLinkActive="bg-amber-100 text-amber-900 font-bold"
                   class="px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                  <span>📊</span> Sales Dashboard
                </a>
              }
            </div>
          </div>
        }

      </div>
    </header>
  `
})
export class NavbarComponent {
  authService = inject(AuthService);
  cartService = inject(CartService);
  catalogService = inject(CatalogService);
  authModalService = inject(AuthModalService);
  billingService = inject(BillingPosService);

  readonly isProfileOpen = signal<boolean>(false);
  readonly isMobileMenuOpen = signal<boolean>(false);

  onBranchChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const shopId = Number(target.value);
    const shop = this.catalogService.shops().find(s => s.id === shopId);
    if (shop) {
      this.catalogService.selectShop(shop);
    }
  }

  logout(): void {
    this.authService.logout();
    this.isProfileOpen.set(false);
    this.isMobileMenuOpen.set(false);
  }
}
