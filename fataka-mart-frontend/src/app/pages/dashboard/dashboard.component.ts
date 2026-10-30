import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '../../core/services/catalog.service';
import { AdminService } from '../../core/services/admin.service';
import { BaseProductDTO, CategoryDTO, CreateBaseProductRequest, CreateShopRequest, Shop } from '../../core/models/catalog.models';
import { Customer, CustomerTier, QuickCustomerCreateRequest, BillResponse, OrderStatus } from '../../core/models/billing.models';
import { BillingPosService } from '../../core/services/billing-pos.service';

export interface DailySalesSummary {
  dateStr: string;
  displayDate: string;
  billsCount: number;
  totalMrp: number;
  totalSavings: number;
  totalRevenue: number;
  completedBillsCount: number;
}

type DashboardTab = 'ANALYTICS' | 'BILLS' | 'SHOPS' | 'CATEGORIES' | 'CUSTOMERS' | 'BASE_PRODUCTS';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-amber-50/50 via-orange-50/30 to-amber-50/40 text-slate-800 p-3 sm:p-6 lg:p-8 font-sans">
      
      <!-- TOP HEADER -->
      <div class="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-2xl">📊</span>
            <h1 class="text-2xl font-black text-slate-900 tracking-tight">Business Intelligence & Management</h1>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-800 border border-amber-500/30">
              {{ authService.isSuperAdmin() ? 'Super Admin Master Hub' : 'Shop Owner Hub' }}
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">
            Branch: <strong class="text-amber-700 font-semibold">{{ catalogService.selectedShop()?.name || 'Main Branch' }}</strong> |
            Logged in as: <span class="font-bold text-slate-800">{{ authService.currentUser()?.fullName }}</span> ({{ authService.role() }})
          </p>
        </div>

        <button 
          (click)="refreshData()"
          class="px-4 py-2 rounded-xl bg-white hover:bg-amber-50 border border-amber-300 text-xs font-bold text-amber-900 transition flex items-center gap-2 self-start shadow-sm active:scale-95">
          <span>🔄</span> Refresh Data
        </button>
      </div>

      <!-- NAVIGATION TABS -->
      <div class="max-w-7xl mx-auto mb-6 flex items-center gap-2 overflow-x-auto max-w-full pb-2 scrollbar-none border-b border-amber-200">
        <button 
          (click)="activeTab.set('ANALYTICS')"
          [class]="activeTab() === 'ANALYTICS' 
            ? 'border-b-2 border-amber-600 text-amber-900 font-black bg-amber-100/50' 
            : 'text-slate-600 hover:text-slate-900'"
          class="px-4 py-2.5 rounded-t-xl text-xs whitespace-nowrap transition flex items-center gap-2 font-semibold">
          <span>📊</span> Sales Analytics & Margins
        </button>

        <button 
          (click)="activeTab.set('BILLS')"
          [class]="activeTab() === 'BILLS' 
            ? 'border-b-2 border-amber-600 text-amber-900 font-black bg-amber-100/50' 
            : 'text-slate-600 hover:text-slate-900'"
          class="px-4 py-2.5 rounded-t-xl text-xs whitespace-nowrap transition flex items-center gap-2 font-semibold">
          <span>🧾</span> Orders & Bills ({{ bills().length }})
        </button>

        @if (authService.isSuperAdmin()) {
          <button 
            (click)="activeTab.set('SHOPS')"
            [class]="activeTab() === 'SHOPS' 
              ? 'border-b-2 border-amber-600 text-amber-900 font-black bg-amber-100/50' 
              : 'text-slate-600 hover:text-slate-900'"
            class="px-4 py-2.5 rounded-t-xl text-xs whitespace-nowrap transition flex items-center gap-2 font-semibold">
            <span>🏪</span> Shop Branches ({{ adminService.shops().length }})
          </button>
        }

        <button 
          (click)="activeTab.set('CATEGORIES')"
          [class]="activeTab() === 'CATEGORIES' 
            ? 'border-b-2 border-amber-600 text-amber-900 font-black bg-amber-100/50' 
            : 'text-slate-600 hover:text-slate-900'"
          class="px-4 py-2.5 rounded-t-xl text-xs whitespace-nowrap transition flex items-center gap-2 font-semibold">
          <span>🏷️</span> Categories Master ({{ adminService.categories().length }})
        </button>

        <button 
          (click)="activeTab.set('CUSTOMERS')"
          [class]="activeTab() === 'CUSTOMERS' 
            ? 'border-b-2 border-amber-600 text-amber-900 font-black bg-amber-100/50' 
            : 'text-slate-600 hover:text-slate-900'"
          class="px-4 py-2.5 rounded-t-xl text-xs whitespace-nowrap transition flex items-center gap-2 font-semibold">
          <span>👥</span> Customers Directory ({{ adminService.customers().length }})
        </button>

        @if (authService.isSuperAdmin()) {
          <button 
            (click)="activeTab.set('BASE_PRODUCTS')"
            [class]="activeTab() === 'BASE_PRODUCTS' 
              ? 'border-b-2 border-amber-600 text-amber-900 font-black bg-amber-100/50' 
              : 'text-slate-600 hover:text-slate-900'"
            class="px-4 py-2.5 rounded-t-xl text-xs whitespace-nowrap transition flex items-center gap-2 font-semibold">
            <span>🎆</span> Global Master Products ({{ adminService.baseProducts().length }})
          </button>
        }
      </div>

      <div class="max-w-7xl mx-auto space-y-8">
        
        <!-- ========================================== -->
        <!-- TAB 1: SALES & MARGIN ANALYTICS -->
        <!-- ========================================== -->
        @if (activeTab() === 'ANALYTICS') {
          
          @if (analyticsService.shopDashboard(); as stats) {
            <!-- 1. SALES KPI STATS CARDS -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <!-- Today's Sales -->
              <div class="p-5 rounded-2xl bg-white border border-amber-200/90 shadow-sm relative overflow-hidden">
                <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Sales</div>
                <div class="text-2xl font-black text-slate-900 font-mono mt-1">₹{{ stats.todaySales.toFixed(2) }}</div>
                <div class="text-[11px] text-emerald-700 font-semibold mt-1">
                  {{ stats.todayBillsCount }} customer bills processed
                </div>
                <div class="absolute right-4 top-4 text-2xl opacity-20">💰</div>
              </div>

              <!-- 7-Day Sales -->
              <div class="p-5 rounded-2xl bg-white border border-amber-200/90 shadow-sm relative overflow-hidden">
                <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">7-Day Sales</div>
                <div class="text-2xl font-black text-amber-700 font-mono mt-1">₹{{ stats.weeklySales.toFixed(2) }}</div>
                <div class="text-[11px] text-slate-500 mt-1">Rolling week revenue</div>
                <div class="absolute right-4 top-4 text-2xl opacity-20">📅</div>
              </div>

              <!-- Monthly Sales -->
              <div class="p-5 rounded-2xl bg-white border border-amber-200/90 shadow-sm relative overflow-hidden">
                <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">30-Day Sales</div>
                <div class="text-2xl font-black text-amber-800 font-mono mt-1">₹{{ stats.monthlySales.toFixed(2) }}</div>
                <div class="text-[11px] text-slate-500 mt-1">Total Bills: {{ stats.totalBillsCount }}</div>
                <div class="absolute right-4 top-4 text-2xl opacity-20">📈</div>
              </div>

              <!-- Net Profit (CONFIDENTIAL: ONLY TO SUPER ADMIN PRATIK JAGTAP) -->
              @if (authService.isSuperAdmin()) {
                <div class="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-amber-500/10 border border-emerald-300 shadow-sm relative overflow-hidden">
                  <div class="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Net Profit</div>
                  <div class="text-2xl font-black text-emerald-700 font-mono mt-1">₹{{ stats.monthlyProfit.toFixed(2) }}</div>
                  <div class="text-[11px] text-emerald-800 font-semibold mt-1">
                    Overhead cost deducted (Admin Only)
                  </div>
                  <div class="absolute right-4 top-4 text-2xl opacity-25">💎</div>
                </div>
              } @else {
                <div class="p-5 rounded-2xl bg-white border border-amber-200/90 shadow-sm relative overflow-hidden">
                  <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Bills Processed</div>
                  <div class="text-2xl font-black text-slate-900 font-mono mt-1">{{ stats.totalBillsCount }}</div>
                  <div class="text-[11px] text-slate-500 mt-1">
                    Completed branch sales
                  </div>
                  <div class="absolute right-4 top-4 text-2xl opacity-20">🧾</div>
                </div>
              }

            </div>

            <!-- 2. TOP 5 SELLING FIRECRACKERS & LOYALTY STATS -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <!-- Top 5 Products Table -->
              <div class="lg:col-span-2 p-6 rounded-2xl bg-white border border-amber-200/90 shadow-sm">
                <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span>🏆</span> Top 5 Selling Firecrackers
                </h3>

                @if (stats.topSellingProducts.length === 0) {
                  <p class="text-xs text-slate-400 py-8 text-center">No sales recorded yet for this shop branch.</p>
                } @else {
                  <div class="space-y-3">
                    @for (prod of stats.topSellingProducts; track prod.productName; let idx = $index) {
                      <div class="p-3 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <span class="w-6 h-6 rounded-full bg-amber-500/20 text-amber-800 font-bold text-xs flex items-center justify-center">
                            {{ idx + 1 }}
                          </span>
                          <div>
                            <div class="text-xs font-bold text-slate-900">{{ prod.productName }}</div>
                            <div class="text-[10px] text-slate-500">{{ prod.quantitySold }} units sold</div>
                          </div>
                        </div>
                        <div class="text-right font-mono font-bold text-xs text-amber-800">
                          ₹{{ prod.totalRevenue.toFixed(2) }}
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- Customer Loyalty Stats -->
              <div class="p-6 rounded-2xl bg-white border border-amber-200/90 shadow-sm space-y-4">
                <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span>👥</span> Customer Reach
                </h3>

                <div class="p-4 rounded-xl bg-amber-50/50 border border-amber-100 text-center">
                  <span class="text-3xl font-black text-amber-800 font-mono">{{ stats.totalCustomersCount }}</span>
                  <span class="block text-xs text-slate-500 mt-1">Registered Shop Customers</span>
                </div>

                <div class="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <p class="flex justify-between">
                    <span>Customer Retention:</span>
                    <strong class="text-emerald-700">High</strong>
                  </p>
                  <p class="flex justify-between">
                    <span>Average Bill Value:</span>
                    <strong class="font-mono text-slate-900">₹{{ stats.totalBillsCount > 0 ? (stats.monthlySales / stats.totalBillsCount).toFixed(0) : '0' }}</strong>
                  </p>
                </div>
              </div>

            </div>

            <!-- 3. DATE-WISE SALES PERFORMANCE BREAKDOWN -->
            <div class="p-6 rounded-2xl bg-white border border-amber-200/90 shadow-sm space-y-5">
              
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 class="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>📅</span> Date-Wise Sales Breakdown
                  </h3>
                  <p class="text-xs text-slate-500 mt-0.5">Track daily collection, revenue, and customer volume date-by-date</p>
                </div>

                <!-- Date Picker & Quick Filter Buttons -->
                <div class="flex flex-wrap items-center gap-2">
                  <button 
                    (click)="setDateFilterToday()"
                    [class.bg-amber-600]="isDateToday()"
                    [class.text-white]="isDateToday()"
                    [class.bg-amber-50]="!isDateToday()"
                    class="px-2.5 py-1.5 rounded-xl border border-amber-300 text-xs font-bold transition cursor-pointer">
                    Today
                  </button>
                  <button 
                    (click)="setDateFilterYesterday()"
                    [class.bg-amber-600]="isDateYesterday()"
                    [class.text-white]="isDateYesterday()"
                    [class.bg-amber-50]="!isDateYesterday()"
                    class="px-2.5 py-1.5 rounded-xl border border-amber-300 text-xs font-bold transition cursor-pointer">
                    Yesterday
                  </button>
                  <div class="flex items-center gap-1.5 bg-amber-50/60 px-2.5 py-1 rounded-xl border border-amber-300">
                    <span class="text-xs text-slate-600 font-bold">Pick Date:</span>
                    <input 
                      type="date" 
                      [ngModel]="selectedDateFilter()"
                      (ngModelChange)="onDateFilterChange($event)"
                      class="bg-transparent text-xs font-mono font-bold text-slate-800 focus:outline-none">
                  </div>
                  @if (selectedDateFilter()) {
                    <button 
                      (click)="clearDateFilter()"
                      class="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg font-bold border border-red-200 cursor-pointer">
                      ✕ Clear Date
                    </button>
                  }
                </div>
              </div>

              <!-- Selected Date Summary Banner (if date filter active) -->
              @if (selectedDateFilter()) {
                <div class="p-4 rounded-xl bg-amber-50/80 border border-amber-300 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in">
                  <div>
                    <span class="text-[10px] text-slate-500 uppercase font-bold block">Selected Date</span>
                    <span class="text-sm font-black font-mono text-slate-900">{{ selectedDateFilterDisplay() }}</span>
                  </div>
                  <div>
                    <span class="text-[10px] text-slate-500 uppercase font-bold block">Orders / Bills</span>
                    <span class="text-sm font-black font-mono text-slate-900">{{ selectedDateSummary().billsCount }} bills</span>
                  </div>
                  <div>
                    <span class="text-[10px] text-slate-500 uppercase font-bold block">Total MRP Value</span>
                    <span class="text-sm font-black font-mono text-slate-700">₹{{ selectedDateSummary().totalMrp.toFixed(2) }}</span>
                  </div>
                  <div>
                    <span class="text-[10px] text-slate-500 uppercase font-bold block">Net Sales Collected</span>
                    <span class="text-base font-black font-mono text-amber-800">₹{{ selectedDateSummary().totalRevenue.toFixed(2) }}</span>
                  </div>
                </div>
              }

              <!-- Daily Sales Table -->
              @if (dailySalesSummaries().length === 0) {
                <div class="text-center py-8 text-xs text-slate-400">
                  No sales recorded yet for this shop branch.
                </div>
              } @else {
                <div class="overflow-x-auto max-w-full">
                  <table class="w-full min-w-[650px] text-left text-xs">
                    <thead>
                      <tr class="bg-amber-50/70 text-slate-700 font-bold uppercase text-[11px] border-b border-amber-200">
                        <th class="py-2.5 px-3">Date</th>
                        <th class="py-2.5 px-3 text-center">Bills Count</th>
                        <th class="py-2.5 px-3 text-right">Total MRP</th>
                        <th class="py-2.5 px-3 text-right">Diwali Savings Given</th>
                        <th class="py-2.5 px-3 text-right font-black text-amber-900">Net Sales Collected</th>
                        <th class="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      @for (row of filteredDailySummaries(); track row.dateStr) {
                        <tr class="hover:bg-amber-50/40 transition" [class.bg-amber-100/30]="row.dateStr === selectedDateFilter()">
                          <td class="py-2.5 px-3 font-semibold text-slate-900 font-mono">
                            📅 {{ row.displayDate }}
                          </td>
                          <td class="py-2.5 px-3 text-center font-bold">
                            <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px]">
                              {{ row.billsCount }} bills
                            </span>
                          </td>
                          <td class="py-2.5 px-3 text-right font-mono text-slate-500">
                            ₹{{ row.totalMrp.toFixed(2) }}
                          </td>
                          <td class="py-2.5 px-3 text-right font-mono text-emerald-700 font-semibold">
                            -₹{{ row.totalSavings.toFixed(2) }}
                          </td>
                          <td class="py-2.5 px-3 text-right font-mono font-black text-amber-800 text-sm">
                            ₹{{ row.totalRevenue.toFixed(2) }}
                          </td>
                          <td class="py-2.5 px-3 text-center">
                            <button 
                              (click)="viewBillsForDate(row.dateStr)"
                              class="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] transition cursor-pointer">
                              View Bills ↗
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }

            </div>
          }

          <!-- 3. SUPER ADMIN MULTI-SHOP COMPARISON -->
          @if (authService.isSuperAdmin() && analyticsService.adminDashboard(); as adminStats) {
            <div class="p-6 rounded-2xl bg-white border border-amber-300 shadow-md space-y-5">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 class="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>👑</span> Super Admin Multi-Branch Comparison
                  </h3>
                  <p class="text-xs text-slate-500 mt-0.5">Global performance across sibling branches</p>
                </div>

                <div class="text-right">
                  <span class="text-xs text-slate-500">Total Enterprise Revenue:</span>
                  <span class="block text-xl font-black text-amber-700 font-mono">₹{{ adminStats.totalGlobalRevenue.toFixed(2) }}</span>
                </div>
              </div>

              <!-- Comparative Sibling Shop Cards -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                @for (shop of adminStats.shopComparisons; track shop.shopId) {
                  <div class="p-4 rounded-xl bg-amber-50/40 border border-amber-200 space-y-2">
                    <div class="flex justify-between items-start">
                      <div>
                        <h4 class="text-xs font-bold text-slate-900 truncate">{{ shop.shopName }}</h4>
                        <p class="text-[10px] text-amber-800 font-mono">{{ shop.branchCode }} ({{ shop.city }})</p>
                      </div>
                      <span class="w-2.5 h-2.5 rounded-full" [class]="shop.isActive ? 'bg-emerald-500' : 'bg-red-500'"></span>
                    </div>

                    <div class="pt-2 border-t border-slate-200 text-xs space-y-1">
                      <div class="flex justify-between text-slate-500">
                        <span>Owner:</span>
                        <span class="text-slate-800 font-semibold">{{ shop.ownerName }}</span>
                      </div>
                      <div class="flex justify-between text-slate-500">
                        <span>Total Revenue:</span>
                        <span class="text-amber-800 font-mono font-bold">₹{{ shop.totalRevenue.toFixed(0) }}</span>
                      </div>
                      <div class="flex justify-between text-slate-500">
                        <span>Orders:</span>
                        <span class="text-slate-800 font-semibold">{{ shop.totalOrders }}</span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

        }

        <!-- ========================================== -->
        <!-- TAB 2: ORDERS & BILLS HISTORY -->
        <!-- ========================================== -->
        @if (activeTab() === 'BILLS') {
          <div class="bg-white rounded-2xl border border-amber-200/90 shadow-sm p-5 sm:p-6 space-y-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 class="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>🧾</span> Orders & Bills History
                </h2>
                <p class="text-xs text-slate-500">Live feed of all customer orders, storefront bookings, and POS bills</p>
              </div>

              <div class="flex items-center gap-2">
                @if (authService.isSuperAdmin()) {
                  <select 
                    [(ngModel)]="selectedBillsShopId" 
                    (change)="loadBills()"
                    class="px-3 py-1.5 rounded-xl bg-amber-50/70 border border-amber-300 text-slate-800 font-bold text-xs focus:outline-none cursor-pointer">
                    <option [value]="0">🌐 All Branches (Shop 1 & 2)</option>
                    @for (s of catalogService.shops(); track s.id) {
                      <option [value]="s.id">🏬 {{ s.name }}</option>
                    }
                  </select>
                }
                <button 
                  (click)="loadBills()"
                  class="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer">
                  <span>🔄</span> Refresh Orders
                </button>
              </div>
            </div>

            <!-- Status Filter Pills & Date Picker -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 pb-2">
              <div class="flex flex-wrap items-center gap-2">
                <button 
                  (click)="billsStatusFilter.set('ALL')"
                  [class.bg-amber-600]="billsStatusFilter() === 'ALL'"
                  [class.text-white]="billsStatusFilter() === 'ALL'"
                  [class.bg-amber-50]="billsStatusFilter() !== 'ALL'"
                  class="px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-300 transition cursor-pointer">
                  📋 All ({{ filteredByDateCount() }})
                </button>
                <button 
                  (click)="billsStatusFilter.set('PENDING')"
                  [class.bg-amber-600]="billsStatusFilter() === 'PENDING'"
                  [class.text-white]="billsStatusFilter() === 'PENDING'"
                  [class.bg-amber-50]="billsStatusFilter() !== 'PENDING'"
                  class="px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-300 transition cursor-pointer flex items-center gap-1.5">
                  <span>🟡 Pending Review</span>
                  <span class="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px]">{{ countByStatus('PENDING_REVIEW') }}</span>
                </button>
                <button 
                  (click)="billsStatusFilter.set('DISPATCHED')"
                  [class.bg-amber-600]="billsStatusFilter() === 'DISPATCHED'"
                  [class.text-white]="billsStatusFilter() === 'DISPATCHED'"
                  [class.bg-amber-50]="billsStatusFilter() !== 'DISPATCHED'"
                  class="px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-300 transition cursor-pointer flex items-center gap-1.5">
                  <span>🚚 Fatake Sent</span>
                  <span class="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px]">{{ countByStatus('DISPATCHED') }}</span>
                </button>
                <button 
                  (click)="billsStatusFilter.set('COMPLETED')"
                  [class.bg-amber-600]="billsStatusFilter() === 'COMPLETED'"
                  [class.text-white]="billsStatusFilter() === 'COMPLETED'"
                  [class.bg-amber-50]="billsStatusFilter() !== 'COMPLETED'"
                  class="px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-300 transition cursor-pointer">
                  <span>✅ Billed / Completed</span>
                </button>
              </div>

              <!-- Date Filter for Orders -->
              <div class="flex items-center gap-2 bg-amber-50/70 px-3 py-1.5 rounded-xl border border-amber-300 self-start md:self-auto">
                <span class="text-xs text-slate-700 font-bold flex items-center gap-1">
                  <span>📅</span> Filter Date:
                </span>
                <input 
                  type="date" 
                  [ngModel]="selectedDateFilter()" 
                  (ngModelChange)="onDateFilterChange($event)"
                  class="bg-transparent text-xs font-mono font-bold text-slate-900 focus:outline-none">
                @if (selectedDateFilter()) {
                  <button 
                    (click)="clearDateFilter()" 
                    title="Clear Date Filter"
                    class="text-xs font-bold text-red-600 hover:text-red-800 ml-1 cursor-pointer">
                    ✕
                  </button>
                }
              </div>
            </div>

            @if (isLoadingBills()) {
              <div class="p-12 text-center text-slate-500">
                <span class="animate-spin text-2xl block mb-2">⏳</span> Loading orders & bills...
              </div>
            } @else if (filteredBills().length === 0) {
              <div class="p-12 text-center text-slate-500 bg-amber-50/30 rounded-2xl border border-amber-100">
                <span class="text-3xl block mb-2">🛍️</span>
                No orders matching the selected filter.
              </div>
            } @else {
              <div class="overflow-x-auto max-w-full">
                <table class="w-full min-w-[750px] text-left text-xs">
                  <thead>
                    <tr class="bg-amber-50/60 text-slate-700 font-bold border-b border-amber-200 uppercase text-[11px]">
                      <th class="py-3 px-3">Bill / Order #</th>
                      <th class="py-3 px-3">Status</th>
                      <th class="py-3 px-3">Branch</th>
                      <th class="py-3 px-3">Date & Time</th>
                      <th class="py-3 px-3">Customer</th>
                      <th class="py-3 px-3">Mobile No</th>
                      <th class="py-3 px-3 text-center">Items</th>
                      <th class="py-3 px-3 text-right">Subtotal MRP</th>
                      <th class="py-3 px-3 text-right font-black text-amber-900">Final Amount</th>
                      <th class="py-3 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (b of filteredBills(); track b.id) {
                      <tr class="hover:bg-amber-50/40 transition">
                        <td class="py-3 px-3 font-mono font-bold text-amber-900">
                          {{ b.billNumber }}
                        </td>
                        <td class="py-3 px-3 whitespace-nowrap">
                          @if (b.status === 'PENDING_REVIEW') {
                            <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-300 animate-pulse">
                              🟡 Review Needed
                            </span>
                          } @else if (b.status === 'DISPATCHED') {
                            <span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black border border-blue-300">
                              🚚 Fatake Sent
                            </span>
                          } @else {
                            <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                              ✅ Billed
                            </span>
                          }
                        </td>
                        <td class="py-3 px-3 text-amber-800 font-semibold whitespace-nowrap">
                          🏬 {{ b.shopName }}
                        </td>
                        <td class="py-3 px-3 text-slate-600 whitespace-nowrap">
                          {{ b.dateTime | date:'dd/MM/yyyy, hh:mm a' }}
                        </td>
                        <td class="py-3 px-3 font-semibold text-slate-900">
                          {{ b.customerName }}
                        </td>
                        <td class="py-3 px-3 font-mono text-slate-600">
                          {{ b.customerMobile }}
                        </td>
                        <td class="py-3 px-3 text-center">
                          <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                            {{ b.items.length }} Items
                          </span>
                        </td>
                        <td class="py-3 px-3 text-right font-mono text-slate-500">
                          ₹{{ b.subtotalMrp.toFixed(2) }}
                        </td>
                        <td class="py-3 px-3 text-right font-mono font-bold text-amber-800 text-sm">
                          ₹{{ b.finalAmount.toFixed(2) }}
                        </td>
                        <td class="py-3 px-3 text-center whitespace-nowrap">
                          <div class="flex items-center justify-center gap-1.5">
                            @if (b.status === 'PENDING_REVIEW') {
                              <button 
                                (click)="updateOrderStatusFromDashboard(b, 'DISPATCHED')"
                                class="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] shadow-2xs transition flex items-center gap-1 cursor-pointer">
                                <span>📦</span> Send Fatake
                              </button>
                            }
                            <button 
                              (click)="sendBillViaWhatsApp(b)"
                              class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] shadow-2xs transition flex items-center gap-1 cursor-pointer">
                              <span>💬</span> Send Bill
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }

        <!-- ========================================== -->
        <!-- TAB 3: SHOPS MANAGEMENT -->
        <!-- ========================================== -->
        @if (activeTab() === 'SHOPS') {
          <div class="bg-white rounded-2xl border border-amber-200/90 shadow-sm p-5 sm:p-6 space-y-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 class="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>🏪</span> Sibling Shop Branches
                </h2>
                <p class="text-xs text-slate-500">Manage multiple retail counters and branch locations</p>
              </div>

              <button 
                (click)="openAddShopModal()"
                class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5 self-start sm:self-auto">
                <span>➕</span> Add New Shop Branch
              </button>
            </div>

            <!-- Shops Table -->
            <div class="overflow-x-auto max-w-full">
              <table class="w-full min-w-[650px] text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-amber-50/70 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-amber-200">
                    <th class="py-3 px-3">Branch Name</th>
                    <th class="py-3 px-3">Code / City</th>
                    <th class="py-3 px-3">Address & Phone</th>
                    <th class="py-3 px-3 text-center">Overhead %</th>
                    <th class="py-3 px-3 text-center">Status</th>
                    <th class="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (s of adminService.shops(); track s.id) {
                    <tr class="hover:bg-amber-50/30 transition">
                      <td class="py-3 px-3 font-bold text-slate-900">{{ s.name }}</td>
                      <td class="py-3 px-3 font-mono text-amber-800">{{ s.branchCode }} ({{ s.city }})</td>
                      <td class="py-3 px-3 text-slate-600">{{ s.address }} • 📞 {{ s.contactPhone }}</td>
                      <td class="py-3 px-3 text-center font-bold font-mono">{{ s.defaultOverheadPercentage }}%</td>
                      <td class="py-3 px-3 text-center">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold" [class]="s.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'">
                          {{ s.isActive ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                      <td class="py-3 px-3 text-center">
                        <button 
                          (click)="openEditShopModal(s)"
                          class="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold border border-amber-300 text-[11px]">
                          Edit
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- ========================================== -->
        <!-- TAB 3: CATEGORIES MASTER -->
        <!-- ========================================== -->
        @if (activeTab() === 'CATEGORIES') {
          <div class="bg-white rounded-2xl border border-amber-200/90 shadow-sm p-5 sm:p-6 space-y-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 class="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>🏷️</span> Festival Categories Master
                </h2>
                <p class="text-xs text-slate-500">Organize firecrackers into high-converting visual categories with photos</p>
              </div>

              <button 
                (click)="openAddCategoryModal()"
                class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5 self-start sm:self-auto">
                <span>➕</span> Add New Category
              </button>
            </div>

            <!-- Categories Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (cat of adminService.categories(); track cat.id) {
                <div class="p-4 rounded-2xl bg-amber-50/40 border border-amber-200 flex items-center justify-between gap-3 shadow-xs">
                  <div class="flex items-center gap-3 min-w-0">
                    <img 
                      [src]="cat.imageUrl || fallbackImg" 
                      [alt]="cat.name"
                      class="w-12 h-12 rounded-xl object-cover border border-amber-200 flex-shrink-0"
                      (error)="onImgError($event)">
                    <div class="truncate">
                      <h4 class="font-bold text-slate-900 text-xs truncate">{{ cat.name }}</h4>
                      <p class="text-[11px] text-amber-800 font-mono">{{ cat.slug }}</p>
                      <p class="text-[10px] text-slate-500 truncate">{{ cat.description || 'Diwali collection' }}</p>
                    </div>
                  </div>

                  <button 
                    (click)="openEditCategoryModal(cat)"
                    class="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-amber-900 font-bold border border-amber-300 text-[11px] flex-shrink-0 shadow-xs">
                    Edit
                  </button>
                </div>
              }
            </div>
          </div>
        }

        <!-- ========================================== -->
        <!-- TAB 4: CUSTOMERS DIRECTORY -->
        <!-- ========================================== -->
        @if (activeTab() === 'CUSTOMERS') {
          <div class="bg-white rounded-2xl border border-amber-200/90 shadow-sm p-5 sm:p-6 space-y-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 class="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>👥</span> Registered Customers Directory
                </h2>
                <p class="text-xs text-slate-500">Manage VIP customer tiers strictly as Tier 1, Tier 2, and Tier 3</p>
              </div>

              <button 
                (click)="openAddCustomerModal()"
                class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5 self-start sm:self-auto">
                <span>➕</span> Add Customer
              </button>
            </div>

            <!-- Customers Table -->
            <div class="overflow-x-auto max-w-full">
              <table class="w-full min-w-[650px] text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-amber-50/70 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-amber-200">
                    <th class="py-3 px-3">Customer Name</th>
                    <th class="py-3 px-3">Mobile No.</th>
                    <th class="py-3 px-3 text-center">Assigned Tier</th>
                    <th class="py-3 px-3">Referred By</th>
                    <th class="py-3 px-3">Address</th>
                    <th class="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (c of adminService.customers(); track c.id) {
                    <tr class="hover:bg-amber-50/30 transition">
                      <td class="py-3 px-3 font-bold text-slate-900">{{ c.fullName }}</td>
                      <td class="py-3 px-3 font-mono text-slate-600">📞 {{ c.mobileNumber }}</td>
                      <td class="py-3 px-3 text-center">
                        <span class="px-2.5 py-0.5 rounded text-[10px] font-bold"
                          [class]="c.tier === 'CLOSE' ? 'bg-purple-100 text-purple-800 border border-purple-200' : (c.tier === 'REGULAR' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-700 border border-slate-200')">
                          {{ getTierDisplay(c.tier) }}
                        </span>
                      </td>
                      <td class="py-3 px-3 text-amber-800 font-medium">{{ c.referredBy || 'Direct' }}</td>
                      <td class="py-3 px-3 text-slate-500 truncate max-w-xs">{{ c.address || '-' }}</td>
                      <td class="py-3 px-3 text-center">
                        <div class="flex items-center justify-center gap-1.5">
                          <button 
                            (click)="openEditCustomerModal(c)"
                            class="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold border border-amber-300 text-[11px] cursor-pointer">
                            Edit
                          </button>
                          <button 
                            (click)="onDeleteCustomer(c)"
                            class="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 text-[11px] transition active:scale-95 cursor-pointer"
                            title="Delete Customer">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- ========================================== -->
        <!-- TAB 5: MASTER BASE PRODUCTS (SUPER ADMIN) -->
        <!-- ========================================== -->
        @if (activeTab() === 'BASE_PRODUCTS') {
          <div class="bg-white rounded-2xl border border-amber-200/90 shadow-sm p-5 sm:p-6 space-y-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 class="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>🎆</span> Global Master Base Products
                </h2>
                <p class="text-xs text-slate-500">Universal catalog items available for importing into any branch</p>
              </div>

              <button 
                (click)="openAddBaseProductModal()"
                class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5 self-start sm:self-auto">
                <span>➕</span> Add Master Product
              </button>
            </div>

            <!-- Products Table -->
            <div class="overflow-x-auto max-w-full">
              <table class="w-full min-w-[650px] text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-amber-50/70 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-amber-200">
                    <th class="py-3 px-3">Product Name & Photo</th>
                    <th class="py-3 px-3">Brand / Pack</th>
                    <th class="py-3 px-3">Category</th>
                    <th class="py-3 px-3 text-right">Standard Cost</th>
                    <th class="py-3 px-3 text-right">Standard MRP</th>
                    <th class="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (p of adminService.baseProducts(); track p.id) {
                    <tr class="hover:bg-amber-50/30 transition">
                      <td class="py-3 px-3">
                        <div class="flex items-center gap-2.5">
                          <img 
                            [src]="p.imageUrl1 || fallbackImg" 
                            [alt]="p.name"
                            class="w-9 h-9 rounded-lg object-cover border border-amber-100 flex-shrink-0"
                            (error)="onImgError($event)">
                          <span class="font-bold text-slate-900">{{ p.name }}</span>
                        </div>
                      </td>
                      <td class="py-3 px-3 text-slate-600">{{ p.companyName }} ({{ p.packDescription }})</td>
                      <td class="py-3 px-3 font-semibold text-amber-800">{{ p.categoryName }}</td>
                      <td class="py-3 px-3 text-right font-mono font-semibold text-slate-700">₹{{ p.standardBaseCost.toFixed(2) }}</td>
                      <td class="py-3 px-3 text-right font-mono font-bold text-slate-900">₹{{ p.standardMrp.toFixed(2) }}</td>
                      <td class="py-3 px-3 text-center">
                        <button 
                          (click)="openEditBaseProductModal(p)"
                          class="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold border border-amber-300 text-[11px]">
                          Edit
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

      </div>

      <!-- ========================================== -->
      <!-- MODAL 1: ADD / EDIT SHOP -->
      <!-- ========================================== -->
      @if (isShopModalOpen()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div class="w-full max-w-md bg-white border border-amber-200 rounded-3xl shadow-2xl p-6">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🏪</span> {{ editingShopId ? 'Edit Shop Branch' : 'Add New Sibling Shop' }}
              </h3>
              <button (click)="isShopModalOpen.set(false)" class="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <form (submit)="onShopSubmit($event)" class="space-y-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Branch Name <span class="text-amber-600">*</span></label>
                <input type="text" [(ngModel)]="shopFormName" name="sName" required class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Branch Code <span class="text-amber-600">*</span></label>
                  <input type="text" [(ngModel)]="shopFormCode" name="sCode" required class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs font-mono uppercase focus:border-amber-500 focus:bg-white focus:outline-none">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">City <span class="text-amber-600">*</span></label>
                  <input type="text" [(ngModel)]="shopFormCity" name="sCity" required class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Address <span class="text-amber-600">*</span></label>
                <input type="text" [(ngModel)]="shopFormAddress" name="sAddr" required class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Phone <span class="text-amber-600">*</span></label>
                  <input type="text" [(ngModel)]="shopFormPhone" name="sPhone" required class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Default Overhead %</label>
                  <input type="number" [(ngModel)]="shopFormOverhead" name="sOv" min="0" max="100" class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs font-mono focus:border-amber-500 focus:bg-white focus:outline-none">
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">GST Number (Optional)</label>
                <input type="text" [(ngModel)]="shopFormGst" name="sGst" class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs font-mono focus:border-amber-500 focus:bg-white focus:outline-none">
              </div>

              <button type="submit" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md transition active:scale-95 mt-3">
                {{ editingShopId ? 'Save Changes' : 'Create Shop Branch' }}
              </button>
            </form>
          </div>
        </div>
      }

      <!-- ========================================== -->
      <!-- MODAL 2: ADD / EDIT CATEGORY -->
      <!-- ========================================== -->
      @if (isCatModalOpen()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div class="w-full max-w-md bg-white border border-amber-200 rounded-3xl shadow-2xl p-6">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🏷️</span> {{ editingCatId ? 'Edit Category' : 'Add New Category' }}
              </h3>
              <button (click)="isCatModalOpen.set(false)" class="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <form (submit)="onCatSubmit($event)" class="space-y-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Category Name <span class="text-amber-600">*</span></label>
                <input type="text" [(ngModel)]="catFormName" (input)="onCatNameInput()" name="cName" required class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Slug</label>
                <input type="text" [(ngModel)]="catFormSlug" name="cSlug" required class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs font-mono focus:border-amber-500 focus:bg-white focus:outline-none">
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Category Photo</label>
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <label class="cursor-pointer px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-2xs flex items-center gap-1.5 transition">
                      @if (isUploadingCat()) {
                        <span class="animate-spin text-xs">⏳</span> Uploading...
                      } @else {
                        <span>📸</span> Upload from Device
                      }
                      <input type="file" accept="image/*" (change)="onUploadCatImage($event)" class="hidden">
                    </label>
                    <span class="text-[11px] text-slate-400">or paste URL below</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <input type="url" [(ngModel)]="catFormImage" name="cImg" placeholder="Upload photo or paste URL..." class="flex-1 px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
                    <img [src]="catFormImage || fallbackImg" class="w-10 h-10 rounded-xl object-cover border border-amber-200 flex-shrink-0 shadow-2xs" (error)="onImgError($event)">
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <input type="text" [(ngModel)]="catFormDesc" name="cDesc" class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Icon Name</label>
                  <input type="text" [(ngModel)]="catFormIcon" name="cIcon" class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Display Order</label>
                  <input type="number" [(ngModel)]="catFormOrder" name="cOrd" min="1" class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs font-mono focus:border-amber-500 focus:bg-white focus:outline-none">
                </div>
              </div>

              <button type="submit" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md transition active:scale-95 mt-3">
                {{ editingCatId ? 'Save Changes' : 'Create Category' }}
              </button>
            </form>
          </div>
        </div>
      }

      <!-- ========================================== -->
      <!-- MODAL 3: ADD / EDIT CUSTOMER -->
      <!-- ========================================== -->
      @if (isCustModalOpen()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div class="w-full max-w-md bg-white border border-amber-200 rounded-3xl shadow-2xl p-6">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>👤</span> {{ editingCustId ? 'Edit Customer' : 'Add New Customer' }}
              </h3>
              <button (click)="isCustModalOpen.set(false)" class="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <form (submit)="onCustSubmit($event)" class="space-y-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Customer Full Name <span class="text-amber-600">*</span></label>
                <input type="text" [(ngModel)]="custFormName" name="cuName" required class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Mobile Number <span class="text-amber-600">*</span></label>
                <input type="text" [(ngModel)]="custFormMobile" name="cuMobile" required class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Customer Tier</label>
                  <select [(ngModel)]="custFormTier" name="cuTier" class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs font-semibold focus:border-amber-500 focus:bg-white focus:outline-none">
                    <option value="CLOSE">Tier 1</option>
                    <option value="REGULAR">Tier 2</option>
                    <option value="NORMAL">Tier 3</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Referred By</label>
                  <input type="text" [(ngModel)]="custFormReferred" name="cuRef" placeholder="Friend / Relative" class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Address</label>
                <input type="text" [(ngModel)]="custFormAddress" name="cuAddr" class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
              </div>

              <button type="submit" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md transition active:scale-95 mt-3">
                {{ editingCustId ? 'Save Changes' : 'Register Customer' }}
              </button>
            </form>
          </div>
        </div>
      }

      <!-- ========================================== -->
      <!-- MODAL 4: ADD / EDIT BASE PRODUCT -->
      <!-- ========================================== -->
      @if (isBaseProductModalOpen()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div class="w-full max-w-lg bg-white border border-amber-200 rounded-3xl shadow-2xl p-6 my-6">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🎆</span> {{ editingBaseProductId ? 'Edit Base Product' : 'Add Master Base Product' }}
              </h3>
              <button (click)="isBaseProductModalOpen.set(false)" class="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <form (submit)="onBaseProductSubmit($event)" class="space-y-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Category <span class="text-amber-600">*</span></label>
                <select [(ngModel)]="bpFormCatId" name="bpCat" required class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs font-semibold focus:border-amber-500 focus:bg-white focus:outline-none">
                  @for (cat of adminService.categories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Product Name <span class="text-amber-600">*</span></label>
                <input type="text" [(ngModel)]="bpFormName" name="bpName" required class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Brand / Company <span class="text-amber-600">*</span></label>
                  <input type="text" [(ngModel)]="bpFormCompany" name="bpComp" required class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Pack Description</label>
                  <input type="text" [(ngModel)]="bpFormPack" name="bpPack" class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Standard Cost (₹) <span class="text-amber-600">*</span></label>
                  <input type="number" [(ngModel)]="bpFormCost" name="bpCost" step="0.5" min="1" required class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs font-mono font-bold focus:border-amber-500 focus:bg-white focus:outline-none">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Standard MRP (₹) <span class="text-amber-600">*</span></label>
                  <input type="number" [(ngModel)]="bpFormMrp" name="bpMrp" step="0.5" min="1" required class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs font-mono font-bold text-amber-800 focus:border-amber-500 focus:bg-white focus:outline-none">
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Product Photo</label>
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <label class="cursor-pointer px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-2xs flex items-center gap-1.5 transition">
                      @if (isUploadingBp()) {
                        <span class="animate-spin text-xs">⏳</span> Uploading...
                      } @else {
                        <span>📸</span> Upload from Device
                      }
                      <input type="file" accept="image/*" (change)="onUploadBpImage($event)" class="hidden">
                    </label>
                    <span class="text-[11px] text-slate-400">or paste URL below</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <input type="url" [(ngModel)]="bpFormImage" name="bpImg" placeholder="Upload photo or paste URL..." class="flex-1 px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
                    <img [src]="bpFormImage || fallbackImg" class="w-10 h-10 rounded-xl object-cover border border-amber-200 flex-shrink-0 shadow-2xs" (error)="onImgError($event)">
                  </div>
                </div>
              </div>

              <button type="submit" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md transition active:scale-95 mt-3">
                {{ editingBaseProductId ? 'Save Changes' : 'Create Master Product' }}
              </button>
            </form>
          </div>
        </div>
      }

    </div>
  `
})
export class DashboardComponent implements OnInit {
  analyticsService = inject(AnalyticsService);
  authService = inject(AuthService);
  catalogService = inject(CatalogService);
  adminService = inject(AdminService);
  billingService = inject(BillingPosService);
  router = inject(Router);

  readonly bills = signal<BillResponse[]>([]);
  readonly isLoadingBills = signal<boolean>(false);

  readonly fallbackImg = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80';
  readonly activeTab = signal<DashboardTab>('ANALYTICS');

  // Modal 1: Shop
  readonly isShopModalOpen = signal<boolean>(false);
  editingShopId: number | null = null;
  shopFormName = '';
  shopFormCode = '';
  shopFormCity = '';
  shopFormAddress = '';
  shopFormPhone = '';
  shopFormOverhead = 25;
  shopFormGst = '';

  // Modal 2: Category
  readonly isCatModalOpen = signal<boolean>(false);
  editingCatId: number | null = null;
  catFormName = '';
  catFormSlug = '';
  catFormImage = '';
  catFormDesc = '';
  catFormIcon = 'Sparkles';
  catFormOrder = 1;

  // Modal 3: Customer
  readonly isCustModalOpen = signal<boolean>(false);
  editingCustId: number | null = null;
  custFormName = '';
  custFormMobile = '';
  custFormTier: CustomerTier = 'NORMAL';
  custFormReferred = '';
  custFormAddress = '';

  // Modal 4: Base Product
  readonly isBaseProductModalOpen = signal<boolean>(false);
  editingBaseProductId: number | null = null;
  bpFormCatId = 1;
  bpFormName = '';
  bpFormCompany = 'Standard Fireworks';
  bpFormPack = '1 Box';
  bpFormCost = 100;
  bpFormMrp = 180;
  bpFormImage = '';

  readonly isUploadingCat = signal<boolean>(false);
  readonly isUploadingBp = signal<boolean>(false);

  constructor() {
    // SECURITY GUARD: Immediately kick user to storefront if not owner or super admin
    effect(() => {
      if (!this.authService.isOwner()) {
        this.router.navigate(['/']);
      }
    });
  }

  ngOnInit(): void {
    if (!this.authService.isOwner()) {
      this.router.navigate(['/']);
      return;
    }

    this.refreshData();
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

  refreshData(): void {
    const shopId = this.catalogService.selectedShop()?.id || 1;
    this.analyticsService.loadShopDashboard(shopId).subscribe();
    this.adminService.loadCategories().subscribe();
    this.adminService.loadCustomers(shopId).subscribe();
    this.loadBills();

    if (this.authService.isSuperAdmin()) {
      this.analyticsService.loadMasterDashboard().subscribe();
      this.adminService.loadShops().subscribe();
      this.adminService.loadBaseProducts().subscribe();
    }
  }

  selectedBillsShopId = 0;
  readonly billsStatusFilter = signal<'ALL' | 'PENDING' | 'DISPATCHED' | 'COMPLETED'>('ALL');
  readonly selectedDateFilter = signal<string>('');

  readonly dailySalesSummaries = computed<DailySalesSummary[]>(() => {
    const list = this.bills();
    const map = new Map<string, DailySalesSummary>();

    for (const b of list) {
      if (!b.dateTime) continue;
      const datePart = b.dateTime.split('T')[0];
      if (!map.has(datePart)) {
        const parts = datePart.split('-');
        let displayDate = datePart;
        if (parts.length === 3) {
          const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          displayDate = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        }
        map.set(datePart, {
          dateStr: datePart,
          displayDate,
          billsCount: 0,
          totalMrp: 0,
          totalSavings: 0,
          totalRevenue: 0,
          completedBillsCount: 0
        });
      }
      const entry = map.get(datePart)!;
      entry.billsCount += 1;
      entry.totalMrp += (b.subtotalMrp || 0);
      entry.totalSavings += (b.totalSavingsAmount || 0);
      entry.totalRevenue += (b.finalAmount || 0);
      if (b.status === 'COMPLETED') {
        entry.completedBillsCount += 1;
      }
    }

    return Array.from(map.values()).sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  });

  filteredDailySummaries(): DailySalesSummary[] {
    const f = this.selectedDateFilter();
    if (!f) return this.dailySalesSummaries();
    return this.dailySalesSummaries().filter(s => s.dateStr === f);
  }

  selectedDateSummary(): { billsCount: number; totalMrp: number; totalSavings: number; totalRevenue: number } {
    const f = this.selectedDateFilter();
    const match = this.dailySalesSummaries().find(s => s.dateStr === f);
    if (match) {
      return {
        billsCount: match.billsCount,
        totalMrp: match.totalMrp,
        totalSavings: match.totalSavings,
        totalRevenue: match.totalRevenue
      };
    }
    return { billsCount: 0, totalMrp: 0, totalSavings: 0, totalRevenue: 0 };
  }

  selectedDateFilterDisplay(): string {
    const f = this.selectedDateFilter();
    if (!f) return 'All Dates';
    const match = this.dailySalesSummaries().find(s => s.dateStr === f);
    return match ? match.displayDate : f;
  }

  onDateFilterChange(date: string): void {
    this.selectedDateFilter.set(date || '');
  }

  setDateFilterToday(): void {
    const today = new Date().toISOString().split('T')[0];
    this.selectedDateFilter.set(today);
  }

  setDateFilterYesterday(): void {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = d.toISOString().split('T')[0];
    this.selectedDateFilter.set(yesterday);
  }

  isDateToday(): boolean {
    const today = new Date().toISOString().split('T')[0];
    return this.selectedDateFilter() === today;
  }

  isDateYesterday(): boolean {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = d.toISOString().split('T')[0];
    return this.selectedDateFilter() === yesterday;
  }

  clearDateFilter(): void {
    this.selectedDateFilter.set('');
  }

  viewBillsForDate(dateStr: string): void {
    this.selectedDateFilter.set(dateStr);
    this.activeTab.set('BILLS');
  }

  filteredByDateCount(): number {
    const date = this.selectedDateFilter();
    if (!date) return this.bills().length;
    return this.bills().filter(b => b.dateTime && b.dateTime.startsWith(date)).length;
  }

  countByStatus(status: OrderStatus): number {
    let list = this.bills();
    const date = this.selectedDateFilter();
    if (date) {
      list = list.filter(b => b.dateTime && b.dateTime.startsWith(date));
    }
    return list.filter(b => b.status === status).length;
  }

  filteredBills(): BillResponse[] {
    let list = this.bills();
    const date = this.selectedDateFilter();
    if (date) {
      list = list.filter(b => b.dateTime && b.dateTime.startsWith(date));
    }
    const f = this.billsStatusFilter();
    if (f === 'ALL') return list;
    if (f === 'PENDING') return list.filter(b => b.status === 'PENDING_REVIEW');
    if (f === 'DISPATCHED') return list.filter(b => b.status === 'DISPATCHED');
    if (f === 'COMPLETED') return list.filter(b => b.status === 'COMPLETED' || !b.status);
    return list;
  }

  updateOrderStatusFromDashboard(bill: BillResponse, newStatus: OrderStatus): void {
    this.billingService.updateOrderStatus(bill.billNumber, newStatus).subscribe({
      next: () => {
        this.loadBills();
        this.billingService.fetchPendingOrders();
      },
      error: (err: any) => alert('Failed to update order status: ' + (err.error?.message || err.message))
    });
  }

  sendBillViaWhatsApp(bill: BillResponse): void {
    if (bill.status !== 'COMPLETED') {
      this.billingService.updateOrderStatus(bill.billNumber, 'COMPLETED').subscribe({
        next: () => {
          this.loadBills();
          this.billingService.fetchPendingOrders();
        }
      });
    }
    // Open universal Bill Receipt Modal with instant JPG generator & WhatsApp sharing
    this.billingService.activeBill.set(bill);
  }

  loadBills(): void {
    let shopId: number | undefined;
    if (this.authService.isSuperAdmin()) {
      shopId = this.selectedBillsShopId > 0 ? this.selectedBillsShopId : undefined;
    } else {
      shopId = this.authService.currentUser()?.shopId || 1;
    }
    this.isLoadingBills.set(true);
    this.billingService.getShopBills(shopId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.bills.set(res.data);
        }
        this.isLoadingBills.set(false);
      },
      error: () => this.isLoadingBills.set(false)
    });
  }

  onDeleteCustomer(customer: Customer): void {
    const ordersCount = customer.totalPurchasesCount || 0;
    let message: string;
    if (ordersCount > 0) {
      message = `⚠️ NOTICE: Customer "${customer.fullName}" has ${ordersCount} placed order(s).\n\n` +
        `Deleting this customer will remove their contact profile from the directory, but ALL existing bills, invoices, and sales reports will NOT be deleted and will remain safely preserved in the database.\n\n` +
        `Do you want to proceed with deleting customer "${customer.fullName}"?`;
    } else {
      message = `Are you sure you want to delete customer "${customer.fullName}"?`;
    }

    if (confirm(message)) {
      this.adminService.deleteCustomer(customer.id).subscribe({
        next: () => {
          alert('Customer profile deleted successfully. Past bills and orders remain preserved.');
          const currentShopId = this.catalogService.selectedShop()?.id;
          this.adminService.loadCustomers(currentShopId).subscribe();
        },
        error: (err) => {
          alert('Failed to delete customer: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  // --- SHOP MODAL ---
  openAddShopModal(): void {
    this.editingShopId = null;
    this.shopFormName = '';
    this.shopFormCode = '';
    this.shopFormCity = '';
    this.shopFormAddress = '';
    this.shopFormPhone = '';
    this.shopFormOverhead = 25;
    this.shopFormGst = '';
    this.isShopModalOpen.set(true);
  }

  openEditShopModal(shop: Shop): void {
    this.editingShopId = shop.id;
    this.shopFormName = shop.name;
    this.shopFormCode = shop.branchCode;
    this.shopFormCity = shop.city;
    this.shopFormAddress = shop.address;
    this.shopFormPhone = shop.contactPhone;
    this.shopFormOverhead = shop.defaultOverheadPercentage;
    this.shopFormGst = shop.gstNumber || '';
    this.isShopModalOpen.set(true);
  }

  onShopSubmit(e: Event): void {
    e.preventDefault();
    const req: CreateShopRequest = {
      name: this.shopFormName,
      branchCode: this.shopFormCode.toUpperCase(),
      city: this.shopFormCity,
      state: 'Maharashtra',
      address: this.shopFormAddress,
      contactPhone: this.shopFormPhone,
      defaultOverheadPercentage: this.shopFormOverhead,
      gstNumber: this.shopFormGst || undefined
    };

    if (this.editingShopId) {
      this.adminService.updateShop(this.editingShopId, req).subscribe({
        next: () => {
          this.isShopModalOpen.set(false);
          this.catalogService.loadActiveShops().subscribe();
        }
      });
    } else {
      this.adminService.createShop(req).subscribe({
        next: () => {
          this.isShopModalOpen.set(false);
          this.catalogService.loadActiveShops().subscribe();
        }
      });
    }
  }

  // --- CATEGORY MODAL ---
  openAddCategoryModal(): void {
    this.editingCatId = null;
    this.catFormName = '';
    this.catFormSlug = '';
    this.catFormImage = '';
    this.catFormDesc = '';
    this.catFormIcon = 'Sparkles';
    this.catFormOrder = this.adminService.categories().length + 1;
    this.isCatModalOpen.set(true);
  }

  openEditCategoryModal(cat: CategoryDTO): void {
    this.editingCatId = cat.id || null;
    this.catFormName = cat.name;
    this.catFormSlug = cat.slug;
    this.catFormImage = cat.imageUrl || '';
    this.catFormDesc = cat.description || '';
    this.catFormIcon = cat.iconName;
    this.catFormOrder = cat.displayOrder;
    this.isCatModalOpen.set(true);
  }

  onCatNameInput(): void {
    if (!this.editingCatId) {
      this.catFormSlug = this.catFormName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
  }

  onCatSubmit(e: Event): void {
    e.preventDefault();
    const req: CategoryDTO = {
      name: this.catFormName,
      slug: this.catFormSlug,
      imageUrl: this.catFormImage.trim() || undefined,
      description: this.catFormDesc,
      iconName: this.catFormIcon || 'Sparkles',
      displayOrder: this.catFormOrder,
      isActive: true
    };

    if (this.editingCatId) {
      this.adminService.updateCategory(this.editingCatId, req).subscribe({
        next: () => {
          this.isCatModalOpen.set(false);
          this.catalogService.loadCategories().subscribe();
        }
      });
    } else {
      this.adminService.createCategory(req).subscribe({
        next: () => {
          this.isCatModalOpen.set(false);
          this.catalogService.loadCategories().subscribe();
        }
      });
    }
  }

  // --- CUSTOMER MODAL ---
  openAddCustomerModal(): void {
    this.editingCustId = null;
    this.custFormName = '';
    this.custFormMobile = '';
    this.custFormTier = 'NORMAL';
    this.custFormReferred = '';
    this.custFormAddress = '';
    this.isCustModalOpen.set(true);
  }

  openEditCustomerModal(cust: Customer): void {
    this.editingCustId = cust.id;
    this.custFormName = cust.fullName;
    this.custFormMobile = cust.mobileNumber;
    this.custFormTier = cust.tier;
    this.custFormReferred = cust.referredBy || '';
    this.custFormAddress = cust.address || '';
    this.isCustModalOpen.set(true);
  }

  onCustSubmit(e: Event): void {
    e.preventDefault();
    const shopId = this.catalogService.selectedShop()?.id || 1;
    const req: QuickCustomerCreateRequest = {
      shopId,
      fullName: this.custFormName,
      mobileNumber: this.custFormMobile,
      tier: this.custFormTier,
      referredBy: this.custFormReferred,
      address: this.custFormAddress
    };

    if (this.editingCustId) {
      this.adminService.updateCustomer(this.editingCustId, req).subscribe({
        next: () => this.isCustModalOpen.set(false)
      });
    } else {
      this.adminService.createCustomer(req).subscribe({
        next: () => this.isCustModalOpen.set(false)
      });
    }
  }

  // --- BASE PRODUCT MODAL ---
  openAddBaseProductModal(): void {
    this.editingBaseProductId = null;
    const cats = this.adminService.categories();
    this.bpFormCatId = cats.length > 0 && cats[0].id ? cats[0].id : 1;
    this.bpFormName = '';
    this.bpFormCompany = 'Standard Fireworks';
    this.bpFormPack = '1 Box';
    this.bpFormCost = 100;
    this.bpFormMrp = 180;
    this.bpFormImage = '';
    this.isBaseProductModalOpen.set(true);
  }

  openEditBaseProductModal(p: BaseProductDTO): void {
    this.editingBaseProductId = p.id || null;
    this.bpFormCatId = p.categoryId;
    this.bpFormName = p.name;
    this.bpFormCompany = p.companyName;
    this.bpFormPack = p.packDescription || '';
    this.bpFormCost = p.standardBaseCost;
    this.bpFormMrp = p.standardMrp;
    this.bpFormImage = p.imageUrl1 || '';
    this.isBaseProductModalOpen.set(true);
  }

  onBaseProductSubmit(e: Event): void {
    e.preventDefault();
    const req: CreateBaseProductRequest = {
      categoryId: Number(this.bpFormCatId),
      name: this.bpFormName,
      companyName: this.bpFormCompany,
      packDescription: this.bpFormPack,
      standardBaseCost: this.bpFormCost,
      standardMrp: this.bpFormMrp,
      imageUrl1: this.bpFormImage.trim() || undefined
    };

    if (this.editingBaseProductId) {
      this.adminService.updateBaseProduct(this.editingBaseProductId, req).subscribe({
        next: () => this.isBaseProductModalOpen.set(false)
      });
    } else {
      this.adminService.createBaseProduct(req).subscribe({
        next: () => this.isBaseProductModalOpen.set(false)
      });
    }
  }

  private compressImageFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 800;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            resolve(e.target.result);
          }
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  onUploadCatImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.isUploadingCat.set(true);
      this.compressImageFile(file).then(dataUrl => {
        this.catFormImage = dataUrl;
        this.isUploadingCat.set(false);
      }).catch(() => {
        this.isUploadingCat.set(false);
      });
    }
  }

  onUploadBpImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.isUploadingBp.set(true);
      this.compressImageFile(file).then(dataUrl => {
        this.bpFormImage = dataUrl;
        this.isUploadingBp.set(false);
      }).catch(() => {
        this.isUploadingBp.set(false);
      });
    }
  }
}
