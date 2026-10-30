import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from '../models/auth.models';
import {
  BillCreateRequest,
  BillResponse,
  Customer,
  CustomerTier,
  MarginValidationResult,
  OrderStatus,
  PaymentMethod,
  PosGridItem,
  QuickCustomerCreateRequest,
  TierPriceSuggestion
} from '../models/billing.models';
import { OwnerInventory } from '../models/inventory.models';

@Injectable({
  providedIn: 'root'
})
export class BillingPosService {
  private http = inject(HttpClient);
  private posUrl = '/api/pos';
  private custUrl = '/api/customers';

  // State Signals
  readonly items = signal<PosGridItem[]>([]);
  readonly selectedCustomer = signal<Customer | null>(null);
  readonly customerTier = signal<CustomerTier>('NORMAL');
  readonly overallDiscount = signal<number>(0); // Default 0% (User enters manually)
  readonly showOverheadColumn = signal<boolean>(false); // EYE TOGGLE (Default hidden)
  readonly paymentMethod = signal<PaymentMethod>('CASH');
  readonly marginValidation = signal<MarginValidationResult | null>(null);
  readonly activeBill = signal<BillResponse | null>(null);
  readonly isGenerating = signal<boolean>(false);

  // Incoming Customer Orders / Notification Panel State
  readonly pendingOrders = signal<BillResponse[]>([]);
  readonly pendingOrdersCount = signal<number>(0);
  readonly isNotificationPanelOpen = signal<boolean>(false);
  readonly selectedOrderForReview = signal<BillResponse | null>(null);

  // Autocomplete search states
  readonly customerSearchResults = signal<Customer[]>([]);
  readonly isSearchingCustomer = signal<boolean>(false);
  readonly inventorySearchResults = signal<OwnerInventory[]>([]);

  // Computed Signals
  readonly itemCount = computed(() => this.items().length);

  readonly subtotalMrp = computed(() =>
    this.items().reduce((acc, item) => acc + (item.sellingPrice * item.quantity), 0)
  );

  readonly finalPayable = computed(() =>
    this.items().reduce((acc, item) => acc + item.lineTotal, 0)
  );

  readonly totalSavings = computed(() =>
    Math.max(0, this.subtotalMrp() - this.finalPayable())
  );

  readonly isRedAlert = computed(() =>
    this.marginValidation()?.alertLevel === 'RED'
  );

  readonly isOrangeAlert = computed(() =>
    this.marginValidation()?.alertLevel === 'ORANGE'
  );

  readonly alertBannerMessage = computed(() =>
    this.marginValidation()?.alertBannerMessage || null
  );

  // Eye toggle method
  toggleOverheadColumn(): void {
    this.showOverheadColumn.update(v => !v);
  }

  // Tier mapping: Tier 1 = Close, Tier 2 = Regular, Tier 3 = Normal
  readonly selectedTierNumber = computed<1 | 2 | 3>(() => {
    const t = this.customerTier();
    return t === 'CLOSE' ? 1 : t === 'REGULAR' ? 2 : 3;
  });

  getTierLabel(tier?: CustomerTier): string {
    const t = tier || this.customerTier();
    if (t === 'CLOSE') return 'Tier 1';
    if (t === 'REGULAR') return 'Tier 2';
    return 'Tier 3';
  }

  setTier(tierNum: 1 | 2 | 3): void {
    const tier: CustomerTier = tierNum === 1 ? 'CLOSE' : tierNum === 2 ? 'REGULAR' : 'NORMAL';
    this.setCustomerTier(tier);
  }

  // Tier switcher
  setCustomerTier(tier: CustomerTier): void {
    this.customerTier.set(tier);
    const discount = this.overallDiscount();

    // Recalculate row items according to the new tier
    const updated = this.items().map(item => {
      let finalRate = item.sellingPrice;
      if (this.showOverheadColumn() && (tier === 'CLOSE' || tier === 'REGULAR')) {
        // Eye is ON & Tier 1/2: Final rate is calculated on basis of Overhead Price + markup %
        finalRate = Math.round((item.overheadPrice * (1 + (discount / 100))) * 100) / 100;
      } else if (tier === 'CLOSE') {
        // Tier 1 default: 55% margin over overhead (Overhead * 1.55) if no manual discount
        finalRate = discount > 0 
          ? Math.round((item.sellingPrice * ((100 - discount) / 100)) * 100) / 100
          : Math.round((item.overheadPrice * 1.55) * 100) / 100;
      } else if (tier === 'REGULAR') {
        // Tier 2 default: 80% markup over overhead (Overhead * 1.80) if no manual discount
        finalRate = discount > 0 
          ? Math.round((item.sellingPrice * ((100 - discount) / 100)) * 100) / 100
          : Math.round((item.overheadPrice * 1.80) * 100) / 100;
      } else {
        // Tier 3: Standard retail walk-in with discount off selling price (MRP)
        const factor = (100 - discount) / 100;
        finalRate = Math.round((item.sellingPrice * factor) * 100) / 100;
      }

      return {
        ...item,
        discountPercentage: discount,
        finalRate,
        lineTotal: Math.round(finalRate * item.quantity * 100) / 100
      };
    });

    this.items.set(updated);
    this.triggerMarginValidation();
  }

  // Dynamic % displayed in grid: % on Cost (when eye is ON & Tier 1/2) vs Disc % on MRP (when eye is OFF)
  getItemDiscountPercentage(item: PosGridItem): number {
    if (this.showOverheadColumn() && (this.customerTier() === 'CLOSE' || this.customerTier() === 'REGULAR')) {
      if (item.overheadPrice > 0) {
        return Math.round(((item.finalRate - item.overheadPrice) / item.overheadPrice) * 100 * 10) / 10;
      }
      return item.discountPercentage;
    }
    // Default / whenever overhead cost is hidden: calculate actual Discount % on MRP
    if (item.sellingPrice > 0) {
      const disc = Math.round(((item.sellingPrice - item.finalRate) / item.sellingPrice) * 100 * 10) / 10;
      return Math.max(0, disc);
    }
    return 0;
  }

  // Overall Discount / Markup % change (applies to all tiers)
  setOverallDiscount(discount: number): void {
    this.overallDiscount.set(discount);
    const tier = this.customerTier();

    const updated = this.items().map(item => {
      let finalRate = item.sellingPrice;
      if (this.showOverheadColumn() && (tier === 'CLOSE' || tier === 'REGULAR')) {
        // Owner Mode: % markup on overhead cost
        finalRate = Math.round((item.overheadPrice * (1 + (discount / 100))) * 100) / 100;
      } else {
        // Customer / Hidden Mode or Tier 3: % discount on MRP
        const factor = (100 - discount) / 100;
        finalRate = Math.round((item.sellingPrice * factor) * 100) / 100;
      }

      return {
        ...item,
        discountPercentage: discount,
        finalRate,
        lineTotal: Math.round(finalRate * item.quantity * 100) / 100
      };
    });

    this.items.set(updated);
    this.triggerMarginValidation();
  }

  addItem(inventory: OwnerInventory, quantity: number = 1): void {
    const current = this.items();
    const existingIndex = current.findIndex(i => i.shopInventoryId === inventory.id);

    if (existingIndex > -1) {
      this.updateQuantity(existingIndex, current[existingIndex].quantity + quantity);
      return;
    }

    const discount = this.overallDiscount();
    let finalRate = inventory.sellingPrice;

    if (this.showOverheadColumn() && (this.customerTier() === 'CLOSE' || this.customerTier() === 'REGULAR')) {
      finalRate = Math.round((inventory.overheadPrice * (1 + (discount / 100))) * 100) / 100;
    } else if (this.customerTier() === 'CLOSE') {
      finalRate = discount > 0 
        ? Math.round((inventory.sellingPrice * ((100 - discount) / 100)) * 100) / 100
        : Math.round((inventory.overheadPrice * 1.55) * 100) / 100;
    } else if (this.customerTier() === 'REGULAR') {
      finalRate = discount > 0 
        ? Math.round((inventory.sellingPrice * ((100 - discount) / 100)) * 100) / 100
        : Math.round((inventory.overheadPrice * 1.80) * 100) / 100;
    } else {
      const factor = (100 - discount) / 100;
      finalRate = Math.round((inventory.sellingPrice * factor) * 100) / 100;
    }

    const newItem: PosGridItem = {
      srNo: current.length + 1,
      shopInventoryId: inventory.id,
      productName: inventory.productName,
      companyName: inventory.companyName,
      packDescription: inventory.packDescription,
      overheadPrice: inventory.overheadPrice,
      sellingPrice: inventory.sellingPrice,
      discountPercentage: discount,
      finalRate,
      quantity,
      lineTotal: Math.round(finalRate * quantity * 100) / 100,
      stockQuantity: inventory.stockQuantity,
      imageUrl: inventory.imageUrl
    };

    this.items.set([...current, newItem]);
    this.triggerMarginValidation();
  }

  updateQuantity(index: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(index);
      return;
    }
    const updated = [...this.items()];
    const item = updated[index];
    updated[index] = {
      ...item,
      quantity,
      lineTotal: Math.round(item.finalRate * quantity * 100) / 100
    };
    this.items.set(updated);
    this.triggerMarginValidation();
  }

  updateDiscount(index: number, discountInput: number): void {
    const updated = [...this.items()];
    const item = updated[index];
    const tier = this.customerTier();

    let finalRate = item.sellingPrice;
    if (this.showOverheadColumn() && (tier === 'CLOSE' || tier === 'REGULAR')) {
      // Eye is ON & Tier 1/2: discountInput is % markup over overhead price
      finalRate = Math.round((item.overheadPrice * (1 + (discountInput / 100))) * 100) / 100;
    } else {
      // Eye is OFF or Tier 3: discountInput is % DISCOUNT ON MRP!
      const factor = (100 - discountInput) / 100;
      finalRate = Math.round((item.sellingPrice * factor) * 100) / 100;
    }

    updated[index] = {
      ...item,
      discountPercentage: discountInput,
      finalRate,
      lineTotal: Math.round(finalRate * item.quantity * 100) / 100
    };
    this.items.set(updated);
    this.triggerMarginValidation();
  }

  updateFinalRate(index: number, finalRate: number): void {
    const updated = [...this.items()];
    const item = updated[index];
    const tier = this.customerTier();

    let discountPct = 0;
    if (this.showOverheadColumn() && (tier === 'CLOSE' || tier === 'REGULAR')) {
      // Percentage on overhead price!
      if (item.overheadPrice > 0) {
        discountPct = Math.round(((finalRate - item.overheadPrice) / item.overheadPrice) * 100 * 10) / 10;
      }
    } else {
      // Discount off selling price (MRP)
      if (item.sellingPrice > 0) {
        discountPct = Math.round(((item.sellingPrice - finalRate) / item.sellingPrice) * 100 * 10) / 10;
      }
    }

    updated[index] = {
      ...item,
      finalRate,
      discountPercentage: discountPct,
      lineTotal: Math.round(finalRate * item.quantity * 100) / 100
    };
    this.items.set(updated);
    this.triggerMarginValidation();
  }

  removeItem(index: number): void {
    const updated = this.items().filter((_, i) => i !== index);
    // Renumber Sr No
    const renumbered = updated.map((item, i) => ({ ...item, srNo: i + 1 }));
    this.items.set(renumbered);
    this.triggerMarginValidation();
  }

  clearGrid(keepCustomer: boolean = false): void {
    this.items.set([]);
    this.marginValidation.set(null);
    if (!keepCustomer) {
      this.selectedCustomer.set(null);
    }
  }

  // Customer Management
  searchCustomers(shopId: number, query: string): void {
    if (!query || query.trim().length < 2) {
      this.customerSearchResults.set([]);
      return;
    }
    this.isSearchingCustomer.set(true);
    this.http.get<ApiResponse<Customer[]>>(`${this.custUrl}/search`, {
      params: { shopId, query: query.trim() }
    }).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.customerSearchResults.set(res.data);
        }
        this.isSearchingCustomer.set(false);
      },
      error: () => this.isSearchingCustomer.set(false)
    });
  }

  selectCustomer(customer: Customer): void {
    this.selectedCustomer.set(customer);
    this.setCustomerTier(customer.tier);
    this.customerSearchResults.set([]);
  }

  createQuickCustomer(request: QuickCustomerCreateRequest): Observable<ApiResponse<Customer>> {
    return this.http.post<ApiResponse<Customer>>(`${this.custUrl}/quick-create`, request).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.selectCustomer(res.data);
        }
      })
    );
  }

  // Checkout and Bill Generation
  generateBill(shopId: number, customerName: string, customerMobile: string): Observable<ApiResponse<BillResponse>> {
    this.isGenerating.set(true);

    const billItems = this.items().map(i => ({
      shopInventoryId: i.shopInventoryId,
      quantity: i.quantity,
      sellingPrice: i.sellingPrice,
      discountPercentage: i.sellingPrice > 0
        ? Math.max(0, Math.round(((i.sellingPrice - i.finalRate) / i.sellingPrice) * 100 * 10) / 10)
        : 0,
      finalRate: i.finalRate
    }));

    const request: BillCreateRequest = {
      shopId,
      customerId: this.selectedCustomer()?.id,
      customerName: customerName.trim(),
      customerMobile: customerMobile.trim(),
      customerTier: this.customerTier(),
      paymentMethod: this.paymentMethod(),
      overallDiscountPercentage: this.overallDiscount(),
      items: billItems
    };

    return this.http.post<ApiResponse<BillResponse>>(`${this.posUrl}/generate-bill`, request).pipe(
      tap({
        next: res => {
          if (res.success && res.data) {
            this.activeBill.set(res.data);
            this.clearGrid(true);
          }
          this.isGenerating.set(false);
        },
        error: () => this.isGenerating.set(false)
      })
    );
  }

  closeActiveBill(): void {
    this.activeBill.set(null);
  }

  getShopBills(shopId?: number): Observable<ApiResponse<BillResponse[]>> {
    let params: any = {};
    if (shopId) params.shopId = shopId;
    return this.http.get<ApiResponse<BillResponse[]>>(`${this.posUrl}/bills`, { params });
  }

  placeCustomerOrder(request: BillCreateRequest): Observable<ApiResponse<BillResponse>> {
    // Explicitly mark as customer online order awaiting review
    const enriched: BillCreateRequest = {
      ...request,
      status: 'PENDING_REVIEW'
    };
    return this.http.post<ApiResponse<BillResponse>>(`${this.posUrl}/generate-bill`, enriched);
  }

  // --- ONLINE CUSTOMER ORDERS & NOTIFICATION PANEL ---
  getPendingOrders(shopId?: number): Observable<ApiResponse<BillResponse[]>> {
    let params: any = {};
    if (shopId) params.shopId = shopId;
    return this.http.get<ApiResponse<BillResponse[]>>(`${this.posUrl}/orders/pending`, { params });
  }

  getPendingOrdersCount(shopId?: number): Observable<ApiResponse<number>> {
    let params: any = {};
    if (shopId) params.shopId = shopId;
    return this.http.get<ApiResponse<number>>(`${this.posUrl}/orders/pending/count`, { params });
  }

  updateOrderStatus(billNumber: string, status: OrderStatus): Observable<ApiResponse<BillResponse>> {
    return this.http.put<ApiResponse<BillResponse>>(`${this.posUrl}/orders/${billNumber}/status`, null, {
      params: { status }
    }).pipe(
      tap(() => {
        // Refresh pending list after status change
        this.fetchPendingOrders();
      })
    );
  }

  fetchPendingOrders(shopId?: number): void {
    this.getPendingOrders(shopId).subscribe({
      next: res => {
        if (res.success && res.data) {
          const previousCount = this.pendingOrdersCount();
          this.pendingOrders.set(res.data);
          this.pendingOrdersCount.set(res.data.length);
          // Play audio notification chime if new orders arrived!
          if (res.data.length > previousCount && previousCount >= 0) {
            this.playNotificationChime();
          }
        }
      },
      error: () => {}
    });
  }

  toggleNotificationPanel(): void {
    this.isNotificationPanelOpen.update(v => !v);
    if (this.isNotificationPanelOpen()) {
      this.fetchPendingOrders();
    }
  }

  openNotificationPanel(): void {
    this.isNotificationPanelOpen.set(true);
    this.fetchPendingOrders();
  }

  closeNotificationPanel(): void {
    this.isNotificationPanelOpen.set(false);
  }

  openOrderReview(order: BillResponse): void {
    this.selectedOrderForReview.set(order);
  }

  closeOrderReview(): void {
    this.selectedOrderForReview.set(null);
  }

  private playNotificationChime(): void {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  private triggerMarginValidation(): void {
    if (this.items().length === 0) {
      this.marginValidation.set(null);
      return;
    }

    const payload = this.items().map(i => ({
      shopInventoryId: i.shopInventoryId,
      quantity: i.quantity,
      sellingPrice: i.sellingPrice,
      discountPercentage: i.discountPercentage,
      finalRate: i.finalRate
    }));

    this.http.post<ApiResponse<MarginValidationResult>>(`${this.posUrl}/validate-margins`, payload, {
      params: {
        tier: this.customerTier(),
        overallDiscountPercentage: this.overallDiscount()
      }
    }).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.marginValidation.set(res.data);
          // Apply row alerts
          if (res.data.itemAlerts) {
            const alertMap = new Map(res.data.itemAlerts.map(a => [a.shopInventoryId, a]));
            const updated = this.items().map(item => {
              const alert = alertMap.get(item.shopInventoryId);
              return {
                ...item,
                rowAlertLevel: alert?.rowAlertLevel,
                rowMessage: alert?.rowMessage
              };
            });
            this.items.set(updated);
          }
        }
      }
    });
  }
}
