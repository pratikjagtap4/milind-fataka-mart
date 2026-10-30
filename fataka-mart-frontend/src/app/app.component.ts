import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { CartDrawerComponent } from './components/cart-drawer/cart-drawer.component';
import { AuthModalComponent } from './components/auth-modal/auth-modal.component';
import { OrderNotificationPanelComponent } from './components/order-notification-panel/order-notification-panel.component';
import { BillReceiptModalComponent } from './components/bill-receipt-modal/bill-receipt-modal.component';
import { AuthModalService } from './core/services/auth-modal.service';

import { CartService } from './core/services/cart.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    CartDrawerComponent,
    AuthModalComponent,
    OrderNotificationPanelComponent,
    BillReceiptModalComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  authModalService = inject(AuthModalService);
  cartService = inject(CartService);
}
