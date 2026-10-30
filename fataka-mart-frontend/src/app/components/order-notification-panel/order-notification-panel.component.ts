import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillingPosService } from '../../core/services/billing-pos.service';
import { AuthService } from '../../core/services/auth.service';
import { BillResponse, OrderStatus } from '../../core/models/billing.models';

@Component({
  selector: 'app-order-notification-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (billingService.isNotificationPanelOpen()) {
      <div class="fixed inset-0 z-50 overflow-hidden">
        
        <!-- Backdrop -->
        <div 
          (click)="billingService.closeNotificationPanel()"
          class="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs transition-opacity animate-fade-in">
        </div>

        <div class="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
          <div class="w-screen max-w-[calc(100vw-1rem)] sm:max-w-lg bg-white border-l border-amber-300 flex flex-col shadow-2xl text-slate-800">
            
            <!-- Panel Header -->
            <div class="p-4 sm:p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white flex items-center justify-between shadow-sm">
              <div class="flex items-center gap-2.5">
                <span class="text-2xl animate-bounce">🔔</span>
                <div>
                  <h2 class="text-base font-extrabold tracking-tight">Customer Orders Notification</h2>
                  <p class="text-xs text-amber-100 font-medium">
                    Review orders, send fatake, & share bills
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <button 
                  (click)="refresh()"
                  title="Refresh Orders"
                  class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer text-sm">
                  🔄
                </button>
                <button 
                  (click)="billingService.closeNotificationPanel()"
                  class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer text-sm font-bold">
                  ✕
                </button>
              </div>
            </div>

            <!-- Tab Filters -->
            <div class="flex items-center gap-2 px-4 py-2.5 bg-amber-50/70 border-b border-amber-200 text-xs">
              <button 
                (click)="activeFilter.set('PENDING')"
                [class.bg-amber-600]="activeFilter() === 'PENDING'"
                [class.text-white]="activeFilter() === 'PENDING'"
                [class.bg-white]="activeFilter() !== 'PENDING'"
                class="px-3 py-1.5 rounded-lg font-bold border border-amber-300 shadow-2xs transition cursor-pointer flex items-center gap-1.5">
                <span>🟡 Pending Review</span>
                <span class="px-1.5 py-0.2 bg-white/30 text-[10px] rounded-full">{{ pendingOrders().length }}</span>
              </button>
              <button 
                (click)="activeFilter.set('ALL')"
                [class.bg-amber-600]="activeFilter() === 'ALL'"
                [class.text-white]="activeFilter() === 'ALL'"
                [class.bg-white]="activeFilter() !== 'ALL'"
                class="px-3 py-1.5 rounded-lg font-medium text-slate-700 border border-slate-200 transition cursor-pointer">
                📋 All Incoming
              </button>
            </div>

            <!-- Orders List -->
            <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/60">
              @if (filteredOrders().length === 0) {
                <div class="text-center py-20 bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs">
                  <div class="text-5xl mb-3">🎆</div>
                  <h3 class="text-base font-bold text-slate-800">No Orders Awaiting Review</h3>
                  <p class="text-xs text-slate-500 max-w-xs mx-auto mt-1.5">
                    When customers place orders online or via mobile bucket, they will appear here instantly for review & dispatch.
                  </p>
                </div>
              } @else {
                @for (order of filteredOrders(); track order.billNumber) {
                  <div class="bg-white rounded-2xl border-2 transition shadow-sm p-4 space-y-3"
                       [class.border-amber-400]="order.status === 'PENDING_REVIEW'"
                       [class.border-blue-400]="order.status === 'DISPATCHED'"
                       [class.border-emerald-400]="order.status === 'COMPLETED'">
                    
                    <!-- Top Bar: Customer & Status -->
                    <div class="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div>
                        <div class="flex items-center gap-2">
                          <h4 class="text-sm font-extrabold text-slate-900">{{ order.customerName }}</h4>
                          @if (order.status === 'PENDING_REVIEW') {
                            <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-300 animate-pulse">
                              🟡 Review Needed
                            </span>
                          } @else if (order.status === 'DISPATCHED') {
                            <span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold border border-blue-300">
                              🚚 Fatake Sent
                            </span>
                          } @else if (order.status === 'COMPLETED') {
                            <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300">
                              ✅ Billed & Done
                            </span>
                          }
                        </div>
                        <div class="flex items-center gap-2 mt-0.5 text-xs text-slate-600 font-medium">
                          <span>📞 {{ order.customerMobile }}</span>
                          <span class="text-slate-300">•</span>
                          <span class="text-[11px] text-amber-700 font-semibold">{{ order.shopName }}</span>
                        </div>
                      </div>

                      <div class="text-right">
                        <span class="text-xs font-mono text-slate-500">{{ order.billNumber }}</span>
                        <div class="text-base font-black text-amber-700">₹{{ order.finalAmount }}</div>
                      </div>
                    </div>

                    <!-- Order Items Preview -->
                    <div class="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 text-xs space-y-1.5">
                      <div class="flex justify-between font-bold text-[11px] text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-200">
                        <span>Items ({{ order.items.length }})</span>
                        <span>Qty × Rate</span>
                      </div>
                      @for (item of order.items; track item.productName) {
                        <div class="flex items-center justify-between text-slate-700 py-0.5">
                          <span class="font-medium truncate max-w-[200px]">{{ item.productName }}</span>
                          <span class="font-mono text-slate-800">{{ item.quantity }} × ₹{{ item.finalRate }} = <strong>₹{{ item.lineTotal }}</strong></span>
                        </div>
                      }
                    </div>

                    <!-- Workflow Action Buttons -->
                    <div class="pt-1 flex flex-wrap items-center gap-2">
                      @if (order.status === 'PENDING_REVIEW') {
                        <!-- 1. Send Fatake Button -->
                        <button 
                          (click)="updateStatus(order, 'DISPATCHED')"
                          [disabled]="isUpdating()"
                          class="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50">
                          <span>📦</span> Send Fatake
                        </button>
                      }

                      <!-- 2. Send Bill to Customer (WhatsApp) Button -->
                      <button 
                        (click)="sendBillViaWhatsApp(order)"
                        class="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer">
                        <span>💬</span> Send Bill (WhatsApp)
                      </button>

                      @if (order.status === 'PENDING_REVIEW' || order.status === 'DISPATCHED') {
                        <!-- Cancel Option -->
                        <button 
                          (click)="cancelOrder(order)"
                          title="Reject / Cancel Order"
                          class="px-2.5 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition cursor-pointer">
                          ✕
                        </button>
                      }
                    </div>

                  </div>
                }
              }
            </div>

            <!-- Footer Help Note -->
            <div class="p-3 bg-amber-50/80 border-t border-amber-200 text-[11px] text-amber-900 flex items-center justify-between">
              <span>💡 Step 1: Send Fatake $\\rightarrow$ Step 2: Send Bill via WhatsApp</span>
              <button 
                (click)="refresh()"
                class="font-bold underline text-amber-800 cursor-pointer">
                Refresh Now
              </button>
            </div>

          </div>
        </div>

      </div>
    }
  `
})
export class OrderNotificationPanelComponent implements OnInit, OnDestroy {
  billingService = inject(BillingPosService);
  authService = inject(AuthService);

  readonly activeFilter = signal<'PENDING' | 'ALL'>('PENDING');
  readonly isUpdating = signal<boolean>(false);
  private pollInterval: any;

  ngOnInit(): void {
    // Initial fetch
    if (this.authService.isOwner()) {
      this.billingService.fetchPendingOrders();
      // Auto-poll every 15 seconds so new customer orders alert immediately!
      this.pollInterval = setInterval(() => {
        if (this.authService.isOwner()) {
          this.billingService.fetchPendingOrders();
        }
      }, 15000);
    }
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  refresh(): void {
    this.billingService.fetchPendingOrders();
  }

  pendingOrders(): BillResponse[] {
    return this.billingService.pendingOrders().filter(o => o.status === 'PENDING_REVIEW');
  }

  filteredOrders(): BillResponse[] {
    if (this.activeFilter() === 'PENDING') {
      return this.billingService.pendingOrders().filter(o => o.status === 'PENDING_REVIEW');
    }
    return this.billingService.pendingOrders();
  }

  updateStatus(order: BillResponse, newStatus: OrderStatus): void {
    this.isUpdating.set(true);
    this.billingService.updateOrderStatus(order.billNumber, newStatus).subscribe({
      next: () => {
        this.isUpdating.set(false);
        this.billingService.fetchPendingOrders();
      },
      error: err => {
        this.isUpdating.set(false);
        alert('Failed to update order status: ' + (err.error?.message || err.message));
      }
    });
  }

  sendBillViaWhatsApp(order: BillResponse): void {
    // 1. Mark as COMPLETED in backend
    if (order.status !== 'COMPLETED') {
      this.billingService.updateOrderStatus(order.billNumber, 'COMPLETED').subscribe({
        next: () => this.billingService.fetchPendingOrders()
      });
    }

    // 2. Open universal Bill Receipt Modal with instant JPG generator & WhatsApp sharing
    this.billingService.activeBill.set(order);
  }

  cancelOrder(order: BillResponse): void {
    if (!confirm(`Are you sure you want to cancel order ${order.billNumber} for ${order.customerName}?`)) {
      return;
    }
    this.updateStatus(order, 'CANCELLED');
  }
}
