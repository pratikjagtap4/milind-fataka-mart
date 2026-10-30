import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div class="relative w-full max-w-md bg-white border border-amber-200 rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden text-slate-800">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl shadow-2xs">
              <span>🎆</span>
            </div>
            <div>
              <h2 class="text-base font-extrabold text-slate-900 leading-tight">
                {{ isLoginTab() ? 'Sign In to Fataka Mart' : 'Create Customer Account' }}
              </h2>
              <p class="text-[11px] text-slate-500">Access your orders, branch pricing & POS</p>
            </div>
          </div>
          <button (click)="closeModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer text-sm">
            ✕
          </button>
        </div>

        <!-- Tabs -->
        <div class="flex p-1 bg-slate-100 rounded-2xl my-4">
          <button 
            (click)="isLoginTab.set(true)"
            [class]="isLoginTab() ? 'bg-white text-slate-900 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-900'"
            class="flex-1 py-2 text-xs rounded-xl transition cursor-pointer">
            Sign In
          </button>
          <button 
            (click)="isLoginTab.set(false)"
            [class]="!isLoginTab() ? 'bg-white text-slate-900 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-900'"
            class="flex-1 py-2 text-xs rounded-xl transition cursor-pointer">
            New Customer (Sign Up)
          </button>
        </div>

        <!-- Error Banner -->
        @if (errorMessage()) {
          <div class="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span class="font-medium">{{ errorMessage() }}</span>
          </div>
        }

        <!-- Success Banner -->
        @if (successMessage()) {
          <div class="mb-4 p-3 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-xs flex items-center gap-2">
            <span>✅</span>
            <span class="font-medium">{{ successMessage() }}</span>
          </div>
        }

        <!-- SIGN IN FORM -->
        @if (isLoginTab()) {
          <form (submit)="onLogin($event)" class="space-y-3.5">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Email or Mobile Number</label>
              <input 
                type="text" 
                [(ngModel)]="loginUsername" 
                name="username"
                required
                placeholder="e.g. 9822012345 or owner1@fatakamart.com"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <input 
                type="password" 
                [(ngModel)]="loginPassword" 
                name="password"
                required
                placeholder="••••••••"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition">
            </div>

            <button 
              type="submit" 
              [disabled]="isLoading()"
              class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 mt-4 disabled:opacity-50 cursor-pointer active:scale-95">
              @if (isLoading()) {
                <span class="animate-spin text-sm">⏳</span> Signing in...
              } @else {
                <span>🚀</span> Sign In
              }
            </button>
          </form>
        } @else {
          <!-- SIGN UP FORM -->
          <form (submit)="onRegister($event)" class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Full Name <span class="text-red-500">*</span></label>
              <input 
                type="text" 
                [(ngModel)]="regFullName" 
                name="regFullName"
                required
                placeholder="e.g. Ramesh Joshi"
                class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:border-amber-500 focus:outline-none">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Mobile Number <span class="text-red-500">*</span></label>
              <input 
                type="text" 
                [(ngModel)]="regMobile" 
                name="regMobile"
                required
                placeholder="10-digit mobile number"
                class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:border-amber-500 focus:outline-none">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Create Password <span class="text-red-500">*</span></label>
              <input 
                type="password" 
                [(ngModel)]="regPassword" 
                name="regPassword"
                required
                placeholder="Minimum 6 characters"
                class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:border-amber-500 focus:outline-none">
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Address (Optional)</label>
                <input 
                  type="text" 
                  [(ngModel)]="regAddress" 
                  name="regAddress"
                  placeholder="Area / City"
                  class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:border-amber-500 focus:outline-none">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Referred By (Optional)</label>
                <input 
                  type="text" 
                  [(ngModel)]="regReferredBy" 
                  name="regReferredBy"
                  placeholder="Friend / Walk-in"
                  class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:border-amber-500 focus:outline-none">
              </div>
            </div>

            <button 
              type="submit" 
              [disabled]="isLoading()"
              class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 mt-3 disabled:opacity-50 cursor-pointer">
              @if (isLoading()) {
                <span class="animate-spin text-sm">⏳</span> Creating Account...
              } @else {
                <span>✨</span> Complete Registration & Start Shopping
              }
            </button>
          </form>
        }

      </div>
    </div>
  `
})
export class AuthModalComponent {
  private authService = inject(AuthService);

  @Output() close = new EventEmitter<void>();

  readonly isLoginTab = signal<boolean>(true);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  loginUsername = '';
  loginPassword = '';

  regFullName = '';
  regMobile = '';
  regPassword = '';
  regAddress = '';
  regReferredBy = '';

  onLogin(e: Event): void {
    e.preventDefault();
    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.authService.login({ username: this.loginUsername, password: this.loginPassword }).subscribe({
      next: res => {
        this.isLoading.set(false);
        if (res.success) {
          this.successMessage.set('Login successful!');
          setTimeout(() => this.closeModal(), 600);
        } else {
          this.errorMessage.set(res.message || 'Invalid credentials');
        }
      },
      error: err => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Login failed. Please verify credentials.');
      }
    });
  }

  onRegister(e: Event): void {
    e.preventDefault();
    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.authService.register({
      fullName: this.regFullName,
      mobile: this.regMobile,
      password: this.regPassword,
      address: this.regAddress,
      referredBy: this.regReferredBy
    }).subscribe({
      next: res => {
        this.isLoading.set(false);
        if (res.success) {
          this.successMessage.set('Account created successfully! Welcome to Fataka Mart.');
          setTimeout(() => this.closeModal(), 600);
        } else {
          this.errorMessage.set(res.message || 'Registration failed');
        }
      },
      error: err => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Registration failed. Mobile may already be registered.');
      }
    });
  }

  closeModal(): void {
    this.close.emit();
  }
}
