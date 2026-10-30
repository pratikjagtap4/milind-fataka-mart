import { Routes } from '@angular/router';
import { StorefrontComponent } from './pages/storefront/storefront.component';
import { PosBillingComponent } from './pages/pos-billing/pos-billing.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { InventoryManagerComponent } from './pages/inventory-manager/inventory-manager.component';
import { ownerGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: StorefrontComponent,
    title: 'Fataka Mart - Diwali Fireworks Storefront'
  },
  {
    path: 'pos',
    component: PosBillingComponent,
    canActivate: [ownerGuard],
    title: 'Fataka Mart - Speed Billing POS'
  },
  {
    path: 'inventory',
    component: InventoryManagerComponent,
    canActivate: [ownerGuard],
    title: 'Fataka Mart - Shop Inventory & Pricing Engine'
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [ownerGuard],
    title: 'Fataka Mart - Sales & Margin Analytics'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
