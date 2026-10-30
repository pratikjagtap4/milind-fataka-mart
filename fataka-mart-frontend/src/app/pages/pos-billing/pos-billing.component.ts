import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BillingPosService } from '../../core/services/billing-pos.service';
import { InventoryService } from '../../core/services/inventory.service';
import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '../../core/services/catalog.service';
import { Customer, CustomerTier, PaymentMethod, QuickCustomerCreateRequest } from '../../core/models/billing.models';
import { OwnerInventory } from '../../core/models/inventory.models';

@Component({
  selector: 'app-pos-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-amber-50/50 via-orange-50/30 to-amber-50/40 text-slate-800 p-3 sm:p-6 lg:p-8 font-sans">
      
      <!-- TOP HEADER & CONTROLS -->
      <div class="max-w-7xl mx-auto mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-2xl">⚡</span>
            <h1 class="text-2xl font-black text-slate-900 tracking-tight">Rapid Billing POS</h1>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-800 border border-amber-500/30">
              🪔 Diwali Rush Mode
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">
            Branch: <strong class="text-amber-700 font-semibold">{{ catalogService.selectedShop()?.name || 'Main Branch' }}</strong> | Operator: {{ authService.currentUser()?.fullName || 'Cashier' }}
          </p>
        </div>

        <!-- CONTROLS: EYE TOGGLE (Confidential overhead costs) & CLEAR GRID -->
        <div class="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button 
            (click)="billingService.toggleOverheadColumn()"
            [class]="billingService.showOverheadColumn() 
              ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-md ring-2 ring-amber-300' 
              : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-50 hover:text-slate-900'"
            class="px-2.5 sm:px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition active:scale-95 shadow-sm">
            <span>{{ billingService.showOverheadColumn() ? '👁️' : '🙈' }}</span>
            <span>{{ billingService.showOverheadColumn() ? 'Hide Cost' : 'Show Cost' }}</span>
          </button>

          <button 
            (click)="onClearAll()"
            class="px-2.5 sm:px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 text-xs font-semibold transition active:scale-95 shadow-sm cursor-pointer">
            Clear Grid
          </button>
        </div>
      </div>

      <!-- MARGIN WARNING BANNER -->
      @if (billingService.alertBannerMessage()) {
        <div 
          [class]="billingService.isRedAlert() 
            ? 'bg-red-50 border-red-300 text-red-900 shadow-sm animate-pulse' 
            : 'bg-orange-50 border-orange-300 text-orange-900 shadow-sm'"
          class="max-w-7xl mx-auto mb-5 p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm font-semibold transition">
          <div class="flex items-center gap-2.5">
            <span class="text-xl">{{ billingService.isRedAlert() ? '🚨' : '⚠️' }}</span>
            <span>{{ billingService.alertBannerMessage() }}</span>
          </div>
          <div class="text-xs font-mono font-bold px-2.5 py-1 rounded bg-white/80 border border-slate-200 text-slate-700 self-start sm:self-auto">
            Margin: {{ (billingService.marginValidation()?.ratioToOverhead || 1).toFixed(2) }}x Overhead
          </div>
        </div>
      }

      <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        <!-- LEFT 3 COLS: BILLING GRID & CUSTOMER SELECTION -->
        <div class="lg:col-span-3 min-w-0 space-y-4">
          
          <!-- CUSTOMER SEARCH & TIER SELECTOR BAR -->
          <div class="p-4 sm:p-5 rounded-2xl bg-white border border-amber-200/80 shadow-sm space-y-4">
            
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <!-- Customer Autocomplete Search -->
              <div class="relative flex-1">
                <label class="block text-[11px] font-bold text-slate-600 mb-1">
                  1. Search Existing Customer (Mobile / Name / Referred By)
                </label>
                <div class="relative">
                  <input 
                    type="text" 
                    [(ngModel)]="customerSearchQuery"
                    (input)="onCustomerSearchInput()"
                    placeholder="Type Mobile number (e.g. 9822...) or Customer Name..."
                    class="w-full px-3.5 py-2 pl-9 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none transition">
                  <span class="absolute left-3 top-2 text-slate-400 text-xs">🔍</span>
                </div>

                <!-- Autocomplete Dropdown -->
                @if (billingService.customerSearchResults().length > 0) {
                  <div class="absolute left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-amber-200 rounded-xl shadow-xl z-30 p-1 divide-y divide-slate-100">
                    @for (cust of billingService.customerSearchResults(); track cust.id) {
                      <button 
                        (click)="selectFoundCustomer(cust)"
                        class="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-50 text-xs flex items-center justify-between transition">
                        <div>
                          <strong class="text-slate-900">{{ cust.fullName }}</strong>
                          <span class="text-slate-500 ml-2">📞 {{ cust.mobileNumber }}</span>
                          @if (cust.referredBy) {
                            <span class="text-amber-700 ml-2 font-medium">({{ cust.referredBy }})</span>
                          }
                        </div>
                        <!-- Tier badge strictly labeled as Tier 1 / Tier 2 / Tier 3 -->
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                          [class]="cust.tier === 'CLOSE' ? 'bg-purple-100 text-purple-800 border border-purple-200' : (cust.tier === 'REGULAR' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-700 border border-slate-200')">
                          {{ getTierDisplay(cust.tier) }}
                        </span>
                      </button>
                    }
                  </div>
                }
              </div>

              <!-- Inline Add Customer Button -->
              <div class="flex items-end">
                <button 
                  (click)="isAddCustomerOpen.set(true)"
                  class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shadow-sm active:scale-95">
                  <span>➕</span> Add Customer
                </button>
              </div>
            </div>

            <!-- Customer Selected Chip & 3 Tiers -->
            <div class="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              
              <!-- Selected Customer Badge -->
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-slate-600">Customer:</span>
                @if (billingService.selectedCustomer()) {
                  <div class="px-3 py-1 rounded-lg bg-amber-100/80 border border-amber-300 text-xs flex items-center gap-2 shadow-2xs">
                    <span class="font-bold text-amber-900">{{ billingService.selectedCustomer()?.fullName }}</span>
                    <span class="text-slate-600 font-mono">📞 {{ billingService.selectedCustomer()?.mobileNumber }}</span>
                    <button 
                      (click)="clearCustomer()" 
                      title="Change / clear customer" 
                      class="text-xs bg-white text-red-600 hover:bg-red-50 border border-amber-300 rounded px-1.5 py-0.5 ml-1 font-bold cursor-pointer transition">
                      ✕ Change
                    </button>
                  </div>
                } @else {
                  <div class="flex items-center gap-2">
                    <input 
                      type="text" 
                      [(ngModel)]="walkInCustomerName"
                      placeholder="Walk-in Name"
                      class="px-2.5 py-1 rounded-lg bg-amber-50/40 border border-amber-200 text-slate-800 text-xs w-36 focus:bg-white focus:outline-none">
                    <input 
                      type="tel" 
                      [(ngModel)]="walkInCustomerMobile"
                      placeholder="Customer Mobile (10 digits)"
                      maxlength="10"
                      class="px-2.5 py-1 rounded-lg bg-amber-50/40 border border-amber-200 text-slate-800 text-xs w-44 focus:bg-white focus:outline-none font-mono">
                  </div>
                }
              </div>

              <!-- 3 CUSTOMER TIERS: STRICTLY NAMED TIER 1, TIER 2, TIER 3 (No Close/Regular/Normal, No %) -->
              <div class="flex items-center gap-1 bg-amber-50/80 p-1 rounded-xl border border-amber-200">
                <button 
                  (click)="billingService.setTier(1)"
                  [class]="billingService.selectedTierNumber() === 1 
                    ? 'bg-purple-600 text-white font-bold shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'"
                  class="px-3 py-1 text-xs rounded-lg transition font-semibold">
                  Tier 1
                </button>

                <button 
                  (click)="billingService.setTier(2)"
                  [class]="billingService.selectedTierNumber() === 2 
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'"
                  class="px-3 py-1 text-xs rounded-lg transition font-semibold">
                  Tier 2
                </button>

                <button 
                  (click)="billingService.setTier(3)"
                  [class]="billingService.selectedTierNumber() === 3 
                    ? 'bg-slate-700 text-white font-bold shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'"
                  class="px-3 py-1 text-xs rounded-lg transition font-semibold">
                  Tier 3
                </button>
              </div>

            </div>

          </div>

          <!-- RAPID PRODUCT ADD BAR -->
          <div class="p-4 sm:p-5 rounded-2xl bg-white border border-amber-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-3">
            <div class="relative flex-1 w-full">
              <input 
                type="text" 
                [(ngModel)]="productQuickSearch"
                (input)="onProductSearchInput()"
                placeholder="2. Rapid Product Search (e.g. Standard 10cm, 1000 wala, 12 shots, Anar)..."
                class="w-full px-4 py-2.5 pl-10 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none transition">
              <span class="absolute left-3.5 top-2.5 text-slate-400 text-sm">🎆</span>

              <!-- Product Autocomplete with Photo Thumbnail -->
              @if (matchingProducts().length > 0) {
                <div class="absolute left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white border border-amber-200 rounded-xl shadow-2xl z-30 p-1 divide-y divide-slate-100">
                  @for (inv of matchingProducts(); track inv.id) {
                    <button 
                      (click)="addProductToGrid(inv)"
                      class="w-full text-left px-3 py-2.5 rounded-lg hover:bg-amber-50 text-xs flex items-center justify-between transition gap-3">
                      
                      <!-- Product Photo + Details -->
                      <div class="flex items-center gap-2.5 min-w-0">
                        <img 
                          [src]="inv.imageUrl || fallbackImg" 
                          [alt]="inv.productName"
                          class="w-9 h-9 rounded-lg object-cover border border-amber-100 flex-shrink-0"
                          (error)="onImgError($event)">
                        <div class="truncate">
                          <strong class="text-slate-900 block truncate">{{ inv.productName }}</strong>
                          <span class="text-slate-500 text-[11px]">{{ inv.companyName }} • {{ inv.packDescription }}</span>
                        </div>
                      </div>

                      <div class="flex items-center gap-3 flex-shrink-0 text-right">
                        <div>
                          <span class="text-amber-800 font-bold block">MRP: ₹{{ inv.sellingPrice.toFixed(2) }}</span>
                          <span class="text-[10px] text-slate-500">Stock: {{ inv.stockQuantity }}</span>
                        </div>
                        <span class="px-2 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[10px]">Add +</span>
                      </div>
                    </button>
                  }
                </div>
              }
            </div>

            <!-- Overall Percentage Input (Applies to current tier: Overhead + % for Tier 1 & 2, MRP Discount for Tier 3) -->
            <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
              <label class="text-xs font-bold text-slate-700 whitespace-nowrap">
                {{ (!billingService.showOverheadColumn() || billingService.selectedTierNumber() === 3) ? 'Overall Disc % (on MRP):' : 'Overall % (Overhead + %):' }}
              </label>
              <input 
                type="number" 
                [ngModel]="billingService.overallDiscount()"
                (ngModelChange)="billingService.setOverallDiscount($event)"
                min="0" max="90"
                class="w-20 px-2.5 py-1.5 rounded-xl bg-amber-50/40 border border-amber-200 text-center font-bold text-amber-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
              <span class="text-xs text-slate-500 font-semibold">%</span>
            </div>
          </div>

          <!-- BILLING TABLE GRID -->
          <div class="rounded-2xl bg-white border border-amber-200/80 overflow-hidden shadow-sm">
            <div class="overflow-x-auto max-w-full">
              <table class="w-full min-w-[680px] text-left border-collapse">
                <thead>
                  <tr class="bg-amber-100/60 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-amber-200">
                    <th class="py-3 px-3 w-10 text-center">Sr.</th>
                    <th class="py-3 px-3">Product Name</th>
                    
                    <!-- CONFIDENTIAL OVERHEAD PRICE COLUMN (Controlled by Eye Toggle) -->
                    @if (billingService.showOverheadColumn()) {
                      <th class="py-3 px-3 text-right bg-amber-200/50 text-amber-900 border-x border-amber-300">
                        Overhead Cost
                      </th>
                    }

                    <th class="py-3 px-3 text-right">M.R.P.</th>
                    <th class="py-3 px-3 text-center w-28">
                      {{ (!billingService.showOverheadColumn() || billingService.selectedTierNumber() === 3) ? 'Disc % on MRP' : '% on Cost' }}
                    </th>
                    <th class="py-3 px-3 text-right w-28">Final Rate</th>
                    <th class="py-3 px-3 text-center w-24">Qty</th>
                    <th class="py-3 px-3 text-right w-28">Line Total</th>
                    <th class="py-3 px-3 w-10 text-center"></th>
                  </tr>
                </thead>

                <tbody class="divide-y divide-slate-100 text-xs">
                  @if (billingService.items().length === 0) {
                    <tr>
                      <td [attr.colspan]="billingService.showOverheadColumn() ? 9 : 8" class="text-center py-12 text-slate-400">
                        <span class="text-3xl block mb-2">🛒</span>
                        No items added yet. Search a product above or click below to start rapid billing!
                      </td>
                    </tr>
                  } @else {
                    @for (item of billingService.items(); track item.shopInventoryId; let idx = $index) {
                      <tr 
                        [class]="item.rowAlertLevel === 'RED' 
                          ? 'bg-red-50 hover:bg-red-100/50' 
                          : (item.rowAlertLevel === 'ORANGE' ? 'bg-orange-50 hover:bg-orange-100/50' : 'hover:bg-amber-50/40')"
                        class="transition">
                        
                        <td class="py-2.5 px-3 text-center font-mono text-slate-400">{{ item.srNo }}</td>
                        
                        <!-- Product Details with Thumbnail Photo -->
                        <td class="py-2.5 px-3">
                          <div class="flex items-center gap-2.5">
                            <img 
                              [src]="item.imageUrl || fallbackImg" 
                              [alt]="item.productName"
                              class="w-8 h-8 rounded-md object-cover border border-amber-100 flex-shrink-0"
                              (error)="onImgError($event)">
                            <div>
                              <div class="font-bold text-slate-900">{{ item.productName }}</div>
                              <div class="text-[10px] text-slate-500">{{ item.companyName }} ({{ item.packDescription }})</div>
                              @if (item.rowMessage && item.rowAlertLevel !== 'GREEN') {
                                <div class="text-[10px] font-semibold mt-0.5" [class]="item.rowAlertLevel === 'RED' ? 'text-red-600' : 'text-orange-600'">
                                  {{ item.rowMessage }}
                                </div>
                              }
                            </div>
                          </div>
                        </td>

                        <!-- CONFIDENTIAL OVERHEAD PRICE -->
                        @if (billingService.showOverheadColumn()) {
                          <td class="py-2.5 px-3 text-right font-mono font-bold bg-amber-100/40 text-amber-900 border-x border-amber-200">
                            ₹{{ item.overheadPrice.toFixed(2) }}
                          </td>
                        }

                        <td class="py-2.5 px-3 text-right font-mono text-slate-500">
                          ₹{{ item.sellingPrice.toFixed(2) }}
                        </td>

                        <!-- Editable Discount % on MRP (when overhead is hidden) or % on Cost (when overhead is shown) -->
                        <td class="py-2.5 px-3 text-center">
                          <input 
                            type="number" 
                            [ngModel]="billingService.getItemDiscountPercentage(item)"
                            (ngModelChange)="billingService.updateDiscount(idx, $event)"
                            min="0" max="95" step="0.5"
                            class="w-16 px-2 py-1 rounded-lg bg-amber-50/50 border border-amber-200 text-center font-semibold text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none">
                        </td>

                        <!-- Editable Final Rate -->
                        <td class="py-2.5 px-3 text-right">
                          <input 
                            type="number" 
                            [ngModel]="item.finalRate"
                            (ngModelChange)="billingService.updateFinalRate(idx, $event)"
                            step="0.5"
                            class="w-20 px-2 py-1 rounded-lg bg-amber-50/50 border border-amber-200 text-right font-bold text-amber-800 focus:border-amber-500 focus:bg-white focus:outline-none">
                        </td>

                        <!-- Stepper Quantity -->
                        <td class="py-2.5 px-3 text-center">
                          <div class="inline-flex items-center gap-1 bg-amber-50 rounded-lg p-0.5 border border-amber-200">
                            <button 
                              (click)="billingService.updateQuantity(idx, item.quantity - 1)"
                              class="w-5 h-5 flex items-center justify-center font-bold text-slate-600 hover:text-slate-900 rounded hover:bg-white">
                              -
                            </button>
                            <span class="w-6 text-center font-bold text-slate-800">{{ item.quantity }}</span>
                            <button 
                              (click)="billingService.updateQuantity(idx, item.quantity + 1)"
                              class="w-5 h-5 flex items-center justify-center font-bold text-slate-600 hover:text-slate-900 rounded hover:bg-white">
                              +
                            </button>
                          </div>
                        </td>

                        <!-- Line Total -->
                        <td class="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{{ item.lineTotal.toFixed(2) }}
                        </td>

                        <!-- Remove Action -->
                        <td class="py-2.5 px-3 text-center">
                          <button 
                            (click)="billingService.removeItem(idx)"
                            class="text-slate-400 hover:text-red-600 p-1 transition"
                            title="Remove Item">
                            🗑️
                          </button>
                        </td>

                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <!-- RIGHT 1 COL: POS SUMMARY & BILL ACTIONS -->
        <div class="min-w-0 space-y-4">
          
          <div class="p-4 sm:p-5 rounded-2xl bg-white border border-amber-200/80 shadow-md space-y-4 lg:sticky lg:top-20">
            <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
              <span>🧾</span> Bill Summary
            </h3>

            <!-- Calculations breakdown -->
            <div class="space-y-2 text-xs">
              <div class="flex justify-between text-slate-600">
                <span>Items Count:</span>
                <span class="font-bold text-slate-900">{{ billingService.itemCount() }}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Total MRP:</span>
                <span class="font-mono">₹{{ billingService.subtotalMrp().toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-emerald-700 font-semibold">
                <span>Total Savings:</span>
                <span class="font-mono">-₹{{ billingService.totalSavings().toFixed(2) }}</span>
              </div>

              <!-- Confidential Owner Profit (Shown only when Eye Toggle is ON) -->
              @if (billingService.showOverheadColumn() && billingService.marginValidation()) {
                <div class="pt-2 border-t border-amber-200/80 space-y-1 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-[11px]">
                  <div class="flex justify-between text-amber-900">
                    <span>Total Overhead:</span>
                    <span class="font-mono">₹{{ (billingService.marginValidation()?.totalOverheadCost || 0).toFixed(2) }}</span>
                  </div>
                  <div class="flex justify-between text-emerald-700 font-bold">
                    <span>Est. Profit:</span>
                    <span class="font-mono">₹{{ (billingService.marginValidation()?.profitAmount || 0).toFixed(2) }} ({{ (billingService.marginValidation()?.profitMarginPercentage || 0).toFixed(0) }}%)</span>
                  </div>
                </div>
              }

              <!-- Net Payable Highlight -->
              <div class="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span class="text-sm font-black text-slate-900">Net Payable:</span>
                <span 
                  [class]="billingService.isRedAlert() ? 'text-red-600' : 'text-amber-600'"
                  class="text-2xl font-black font-mono">
                  ₹{{ billingService.finalPayable().toFixed(2) }}
                </span>
              </div>
            </div>

            <!-- Payment Method Selector -->
            <div class="pt-2">
              <label class="block text-[11px] font-bold text-slate-600 mb-1.5">Payment Method:</label>
              <div class="grid grid-cols-2 gap-1.5">
                @for (pm of ['CASH', 'UPI', 'CARD', 'CREDIT']; track pm) {
                  <button 
                    (click)="billingService.paymentMethod.set(asPaymentMethod(pm))"
                    [class]="billingService.paymentMethod() === pm 
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' 
                      : 'bg-amber-50/60 text-slate-700 border border-amber-200 hover:bg-amber-100'"
                    class="py-2 text-xs rounded-xl transition text-center font-semibold">
                    {{ pm }}
                  </button>
                }
              </div>
            </div>

            <!-- Complete Bill Button -->
            <button 
              (click)="onCompleteBill()"
              [disabled]="billingService.items().length === 0 || billingService.isGenerating()"
              class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
              @if (billingService.isGenerating()) {
                <span class="animate-spin text-sm">⏳</span> Generating Bill...
              } @else {
                <span>🖨️</span> Complete & Generate Bill
              }
            </button>

          </div>

        </div>

      </div>

      <!-- INLINE ADD CUSTOMER MODAL -->
      @if (isAddCustomerOpen()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div class="w-full max-w-md bg-white border border-amber-200 rounded-2xl shadow-2xl p-6">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>👤</span> Quick Customer Create
              </h3>
              <button (click)="isAddCustomerOpen.set(false)" class="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <form (submit)="onInlineCustomerSubmit($event)" class="space-y-3.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Customer Name <span class="text-amber-600">*</span></label>
                <input 
                  type="text" 
                  [(ngModel)]="newCustName" 
                  name="custName"
                  required
                  placeholder="e.g. Anand Shinde"
                  class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Mobile Number <span class="text-amber-600">*</span></label>
                <input 
                  type="text" 
                  [(ngModel)]="newCustMobile" 
                  name="custMobile"
                  required
                  placeholder="10-digit mobile number"
                  class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Customer Tier</label>
                  <select 
                    [(ngModel)]="newCustTier" 
                    name="custTier"
                    class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none font-semibold">
                    <option value="CLOSE">Tier 1</option>
                    <option value="REGULAR">Tier 2</option>
                    <option value="NORMAL">Tier 3</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Referred By</label>
                  <input 
                    type="text" 
                    [(ngModel)]="newCustReferredBy" 
                    name="custRef"
                    placeholder="Friend / Relative"
                    class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Address (Optional)</label>
                <input 
                  type="text" 
                  [(ngModel)]="newCustAddress" 
                  name="custAddr"
                  placeholder="Area / Locality"
                  class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
              </div>

              <button 
                type="submit" 
                class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md transition mt-3 active:scale-95">
                Save & Select Customer
              </button>
            </form>
          </div>
        </div>
      }

    </div>
  `
})
export class PosBillingComponent implements OnInit {
  billingService = inject(BillingPosService);
  inventoryService = inject(InventoryService);
  authService = inject(AuthService);
  catalogService = inject(CatalogService);
  router = inject(Router);

  constructor() {
    effect(() => {
      if (!this.authService.isOwner()) {
        this.router.navigate(['/']);
      }
    });
  }

  readonly fallbackImg = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80';

  // Search states
  customerSearchQuery = '';
  productQuickSearch = '';
  walkInCustomerName = 'Walk-in Customer';
  walkInCustomerMobile = '';

  // Modal states
  readonly isAddCustomerOpen = signal<boolean>(false);
  newCustName = '';
  newCustMobile = '';
  newCustTier: CustomerTier = 'NORMAL';
  newCustReferredBy = '';
  newCustAddress = '';

  readonly matchingProducts = signal<OwnerInventory[]>([]);

  ngOnInit(): void {
    const shopId = this.catalogService.selectedShop()?.id || 1;
    this.inventoryService.loadShopInventory(shopId).subscribe();
  }

  asPaymentMethod(val: string): PaymentMethod {
    return val as PaymentMethod;
  }

  getTierDisplay(tier?: CustomerTier): string {
    if (tier === 'CLOSE') return 'Tier 1';
    if (tier === 'REGULAR') return 'Tier 2';
    return 'Tier 3';
  }

  onImgError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && target.src !== this.fallbackImg) {
      target.src = this.fallbackImg;
    }
  }

  onCustomerSearchInput(): void {
    const shopId = this.catalogService.selectedShop()?.id || 1;
    this.billingService.searchCustomers(shopId, this.customerSearchQuery);
  }

  selectFoundCustomer(cust: Customer): void {
    this.billingService.selectCustomer(cust);
    this.customerSearchQuery = `${cust.fullName} (${cust.mobileNumber})`;
    this.walkInCustomerName = cust.fullName;
    this.walkInCustomerMobile = cust.mobileNumber;
  }

  clearCustomer(): void {
    this.billingService.selectedCustomer.set(null);
    this.customerSearchQuery = '';
    this.walkInCustomerName = 'Walk-in Customer';
    this.walkInCustomerMobile = '';
    this.billingService.setCustomerTier('NORMAL');
  }

  onClearAll(): void {
    this.billingService.clearGrid(false);
    this.clearCustomer();
  }

  onProductSearchInput(): void {
    const query = this.productQuickSearch.trim().toLowerCase();
    if (!query) {
      this.matchingProducts.set([]);
      return;
    }
    const matches = this.inventoryService.inventory().filter(item =>
      item.productName.toLowerCase().includes(query) ||
      item.companyName.toLowerCase().includes(query)
    ).slice(0, 10);
    this.matchingProducts.set(matches);
  }

  addProductToGrid(inv: OwnerInventory): void {
    this.billingService.addItem(inv, 1);
    this.productQuickSearch = '';
    this.matchingProducts.set([]);
  }

  onInlineCustomerSubmit(e: Event): void {
    e.preventDefault();
    const mobile = (this.newCustMobile || '').trim().replace(/[^0-9]/g, '');
    if (mobile.length < 10) {
      alert('Please enter a valid 10-digit mobile number for the customer.');
      return;
    }

    const req: QuickCustomerCreateRequest = {
      shopId: this.catalogService.selectedShop()?.id || 1,
      fullName: this.newCustName.trim(),
      mobileNumber: mobile,
      tier: this.newCustTier,
      referredBy: this.newCustReferredBy.trim(),
      address: this.newCustAddress.trim()
    };

    this.billingService.createQuickCustomer(req).subscribe({
      next: (res) => {
        this.isAddCustomerOpen.set(false);
        if (res.data) {
          this.customerSearchQuery = `${res.data.fullName} (${res.data.mobileNumber})`;
          this.walkInCustomerName = res.data.fullName;
          this.walkInCustomerMobile = res.data.mobileNumber;
        }
        this.newCustName = '';
        this.newCustMobile = '';
        this.newCustReferredBy = '';
        this.newCustAddress = '';
      }
    });
  }

  onCompleteBill(): void {
    if (this.billingService.items().length === 0) {
      alert('Please add at least one product to the grid before generating a bill.');
      return;
    }

    const shopId = this.catalogService.selectedShop()?.id || 1;
    const selected = this.billingService.selectedCustomer();
    const custName = (selected?.fullName || this.walkInCustomerName || 'Walk-in Customer').trim();
    const custMobile = (selected?.mobileNumber || this.walkInCustomerMobile || '').trim().replace(/[^0-9]/g, '');

    if (!custMobile || custMobile.length < 10) {
      alert('Please enter a valid 10-digit mobile number for the customer so the bill can be sent to their WhatsApp.');
      return;
    }

    this.billingService.generateBill(shopId, custName, custMobile).subscribe();
  }
}
