import { Injectable, computed, signal } from '@angular/core';
import { CustomerProduct } from '../models/catalog.models';

export interface CartItem {
  product: CustomerProduct;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly CART_STORAGE_KEY = 'fm_cart';

  // State Signals
  readonly items = signal<CartItem[]>(this.loadCartFromStorage());
  readonly isDrawerOpen = signal<boolean>(false);
  readonly lastAddedItem = signal<{ name: string; quantity: number } | null>(null);
  private toastTimer: any = null;

  // Computed Signals
  readonly totalItemsCount = computed(() =>
    this.items().reduce((acc, item) => acc + item.quantity, 0)
  );

  readonly subtotalMrp = computed(() =>
    this.items().reduce((acc, item) => acc + (item.product.mrp * item.quantity), 0)
  );

  readonly finalPayable = computed(() =>
    this.items().reduce((acc, item) => acc + (item.product.discountedPrice * item.quantity), 0)
  );

  readonly totalSavings = computed(() =>
    Math.max(0, this.subtotalMrp() - this.finalPayable())
  );

  constructor() {
    // Persist on change
  }

  addToCart(product: CustomerProduct, quantity: number = 1): void {
    const current = this.items();
    const existingIndex = current.findIndex(i => i.product.id === product.id);

    if (existingIndex > -1) {
      const updated = [...current];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + quantity
      };
      this.updateState(updated);
    } else {
      this.updateState([...current, { product, quantity }]);
    }

    // Trigger feedback notification without opening the drawer
    this.lastAddedItem.set({ name: product.name, quantity });
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.lastAddedItem.set(null);
    }, 2500);
  }

  clearLastAdded(): void {
    this.lastAddedItem.set(null);
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    const updated = this.items().map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    );
    this.updateState(updated);
  }

  removeFromCart(productId: number): void {
    const updated = this.items().filter(item => item.product.id !== productId);
    this.updateState(updated);
  }

  clearCart(): void {
    this.updateState([]);
  }

  openDrawer(): void {
    this.isDrawerOpen.set(true);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  toggleDrawer(): void {
    this.isDrawerOpen.update(v => !v);
  }

  private updateState(items: CartItem[]): void {
    this.items.set(items);
    try {
      localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignored
    }
  }

  private loadCartFromStorage(): CartItem[] {
    try {
      const data = localStorage.getItem(this.CART_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}
