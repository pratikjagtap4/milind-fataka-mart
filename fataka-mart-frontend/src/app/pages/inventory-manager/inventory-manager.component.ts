import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InventoryService } from '../../core/services/inventory.service';
import { CatalogService } from '../../core/services/catalog.service';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { OwnerInventory, QuickCreateProductRequest, UpdateShopInventoryRequest } from '../../core/models/inventory.models';
import { CategoryDTO } from '../../core/models/catalog.models';

interface CategoryGroup {
  categoryName: string;
  categoryId?: number;
  imageUrl?: string;
  items: OwnerInventory[];
  totalStock: number;
  lowStockCount: number;
}

@Component({
  selector: 'app-inventory-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-amber-50/50 via-orange-50/30 to-amber-50/40 text-slate-800 p-3 sm:p-6 lg:p-8 font-sans">
      
      <!-- TOP HEADER & CONTROLS -->
      <div class="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-2xl">📦</span>
            <h1 class="text-2xl font-black text-slate-900 tracking-tight">Shop Inventory & Margins</h1>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-800 border border-amber-500/30">
              Category-Wise Breakdown
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">
            Branch: <strong class="text-amber-700 font-semibold">{{ catalogService.selectedShop()?.name || 'Main Branch' }}</strong> |
            Total Items: <span class="font-bold text-slate-900">{{ inventoryService.totalItemsCount() }}</span> |
            Low Stock: <span class="font-bold" [class]="inventoryService.lowStockCount() > 0 ? 'text-red-600' : 'text-slate-600'">{{ inventoryService.lowStockCount() }}</span>
          </p>
        </div>

        <!-- ACTION BUTTONS: ADD PRODUCT, ADD CATEGORY, SEARCH -->
        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Add New Product Button -->
          <button 
            (click)="openAddProductModal()"
            class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5">
            <span>🎆</span> Add New Product
          </button>

          <!-- Add Festival Category Button -->
          <button 
            (click)="openAddCategoryModal()"
            class="px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5 cursor-pointer">
            <span>🏷️</span> Add Category
          </button>

          <!-- Sync Catalog to Other Branch Button -->
          <button 
            (click)="openSyncModal()"
            class="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5 cursor-pointer">
            <span>🔄</span> Sync Products to Branch
          </button>

          <!-- Search Bar -->
          <div class="relative w-full sm:w-60">
            <input 
              type="text" 
              [ngModel]="inventoryService.searchQuery()"
              (ngModelChange)="inventoryService.setSearch($event)"
              placeholder="Filter items or brand..."
              class="w-full px-3.5 py-2 pl-9 rounded-xl bg-white border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:outline-none shadow-sm">
            <span class="absolute left-3 top-2 text-slate-400 text-xs">🔍</span>
          </div>
        </div>
      </div>

      <!-- CATEGORY FILTER TABS -->
      <div class="max-w-7xl mx-auto mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button 
          (click)="selectedCategoryFilter.set('ALL')"
          [class]="selectedCategoryFilter() === 'ALL' 
            ? 'bg-amber-600 text-white font-bold shadow-sm' 
            : 'bg-white text-slate-700 border border-amber-200 hover:bg-amber-50'"
          class="px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition flex items-center gap-1.5 font-semibold">
          <span>✨ All Categories</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full" [class]="selectedCategoryFilter() === 'ALL' ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'">
            {{ inventoryService.inventory().length }}
          </span>
        </button>

        @for (grp of categorizedGroups(); track grp.categoryName) {
          <button 
            (click)="selectedCategoryFilter.set(grp.categoryName)"
            [class]="selectedCategoryFilter() === grp.categoryName 
              ? 'bg-amber-600 text-white font-bold shadow-sm' 
              : 'bg-white text-slate-700 border border-amber-200 hover:bg-amber-50'"
            class="px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition flex items-center gap-1.5 font-semibold">
            <span>{{ grp.categoryName }}</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded-full" [class]="selectedCategoryFilter() === grp.categoryName ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'">
              {{ grp.items.length }}
            </span>
          </button>
        }
      </div>

      <!-- MAIN CATEGORIZED CONTENT -->
      <div class="max-w-7xl mx-auto space-y-8">
        
        @if (inventoryService.isLoading()) {
          <div class="p-12 text-center text-slate-500 bg-white rounded-2xl border border-amber-200 shadow-sm">
            <span class="animate-spin text-2xl block mb-2">⏳</span> Loading shop inventory...
          </div>
        } @else if (displayedGroups().length === 0) {
          <div class="p-12 text-center text-slate-500 bg-white rounded-2xl border border-amber-200 shadow-sm">
            <span class="text-3xl block mb-2">🪔</span>
            No products found matching your search. Click "Add New Product" above to stock up!
          </div>
        } @else {
          
          <!-- Category Sections Loop -->
          @for (group of displayedGroups(); track group.categoryName) {
            <div class="bg-white rounded-2xl border border-amber-200/90 overflow-hidden shadow-sm">
              
              <!-- Category Header Banner -->
              <div class="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-50/50 p-4 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">🎆</span>
                  <div>
                    <h2 class="text-base font-black text-slate-900 tracking-tight">{{ group.categoryName }}</h2>
                    <p class="text-xs text-slate-500">
                      {{ group.items.length }} Products in category • Total stock units: <strong class="text-slate-800 font-mono">{{ group.totalStock }}</strong>
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  @if (group.lowStockCount > 0) {
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200 animate-pulse">
                      ⚠️ {{ group.lowStockCount }} Low Stock Alert
                    </span>
                  }
                  <button 
                    (click)="openAddProductForCategory(group.categoryId)"
                    class="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition">
                    + Add to {{ group.categoryName }}
                  </button>
                </div>
              </div>

              <!-- Product Table for this Category -->
              <div class="overflow-x-auto max-w-full">
                <table class="w-full min-w-[780px] text-left border-collapse text-xs">
                  <thead>
                    <tr class="bg-amber-50/60 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-amber-100">
                      <th class="py-3 px-3">Product Name & Photo</th>
                      <th class="py-3 px-3">Brand / Pack</th>
                      <th class="py-3 px-3 text-right bg-amber-100/40 text-amber-900">Purchase Cost</th>
                      <th class="py-3 px-3 text-center w-24">Overhead %</th>
                      <th class="py-3 px-3 text-right text-amber-800 font-bold">Overhead Price</th>
                      <th class="py-3 px-3 text-right text-slate-900 font-bold">M.R.P.</th>
                      <th class="py-3 px-3 text-right text-emerald-700 font-semibold">Min 50% Floor</th>
                      <th class="py-3 px-3 text-center w-24">Stock</th>
                      <th class="py-3 px-3 text-center w-20">Actions</th>
                    </tr>
                  </thead>

                  <tbody class="divide-y divide-slate-100">
                    @for (item of group.items; track item.id) {
                      <tr class="hover:bg-amber-50/30 transition">
                        
                        <!-- Product Name & Thumbnail Image -->
                        <td class="py-3 px-3">
                          <div class="flex items-center gap-2.5">
                            <img 
                              [src]="item.imageUrl || fallbackImg" 
                              [alt]="item.productName"
                              class="w-10 h-10 rounded-lg object-cover border border-amber-100 flex-shrink-0"
                              (error)="onImgError($event)">
                            <div>
                              <div class="font-bold text-slate-900 text-xs">{{ item.productName }}</div>
                              <div class="text-[10px] text-amber-700 font-medium">{{ item.categoryName }}</div>
                            </div>
                          </div>
                        </td>

                        <!-- Brand / Pack -->
                        <td class="py-3 px-3 text-slate-600">
                          <div class="font-semibold text-slate-800">{{ item.companyName }}</div>
                          <div class="text-[10px] text-slate-500">{{ item.packDescription }}</div>
                        </td>

                        <!-- Purchase Cost (Confidential) -->
                        <td class="py-3 px-3 text-right font-mono bg-amber-50/30 text-slate-700 font-semibold">
                          ₹{{ item.purchasePrice.toFixed(2) }}
                        </td>

                        <!-- Overhead % -->
                        <td class="py-3 px-3 text-center font-mono">
                          <span class="px-2 py-0.5 rounded bg-amber-100/80 text-amber-900 font-bold text-[11px]">
                            {{ item.overheadPercentage }}%
                          </span>
                        </td>

                        <!-- Overhead Price (Confidential) -->
                        <td class="py-3 px-3 text-right font-mono font-bold text-amber-800">
                          ₹{{ item.overheadPrice.toFixed(2) }}
                        </td>

                        <!-- MRP -->
                        <td class="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{{ item.sellingPrice.toFixed(2) }}
                        </td>

                        <!-- Min 50% Profit Floor -->
                        <td class="py-3 px-3 text-right font-mono text-emerald-700 font-semibold">
                          ₹{{ item.thresholdPrice.toFixed(2) }}
                        </td>

                        <!-- Stock Quantity & Low Stock Badge -->
                        <td class="py-3 px-3 text-center font-mono">
                          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold inline-block"
                            [class]="item.isLowStock ? 'bg-red-100 text-red-800 border border-red-200 animate-pulse' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'">
                            {{ item.stockQuantity }}
                          </span>
                        </td>

                        <!-- Actions -->
                        <td class="py-3 px-3 text-center">
                          <div class="flex items-center justify-center gap-1.5">
                            <button 
                              (click)="openEditModal(item)"
                              class="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300 transition active:scale-95 shadow-2xs cursor-pointer">
                              Edit
                            </button>
                            <button 
                              (click)="onDeleteProduct(item)"
                              class="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition active:scale-95 shadow-2xs cursor-pointer"
                              title="Delete Product">
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

        }

      </div>

      <!-- 1. ADD NEW PRODUCT MODAL (1-STEP CREATION & STOCKING) -->
      @if (isAddProductOpen()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div class="w-full max-w-xl bg-white border border-amber-200 rounded-3xl shadow-2xl p-5 sm:p-6 my-6">
            
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🎆</span> Add New Product to Inventory
              </h3>
              <button (click)="isAddProductOpen.set(false)" class="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <form (submit)="onAddProductSubmit($event)" class="space-y-3.5">
              
              <!-- Category Selector -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Select Category <span class="text-amber-600">*</span></label>
                <select 
                  [(ngModel)]="newProdCategoryId" 
                  name="prodCat"
                  required
                  class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none font-semibold">
                  @for (cat of catalogService.categories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                </select>
              </div>

              <!-- Product Name -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Product Name <span class="text-amber-600">*</span></label>
                <input 
                  type="text" 
                  [(ngModel)]="newProdName" 
                  name="prodName"
                  required
                  placeholder="e.g. 10cm Electric Sparklers / 1000 Wala Red Cracker"
                  class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
              </div>

              <!-- Brand & Pack Description -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Company / Brand <span class="text-amber-600">*</span></label>
                  <input 
                    type="text" 
                    [(ngModel)]="newProdCompany" 
                    name="prodComp"
                    required
                    placeholder="e.g. Standard / Sony"
                    class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Pack Description <span class="text-amber-600">*</span></label>
                  <input 
                    type="text" 
                    [(ngModel)]="newProdPack" 
                    name="prodPack"
                    required
                    placeholder="e.g. 1 Box (10 Pcs)"
                    class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
                </div>
              </div>

              <!-- Image Upload & Live Preview -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Product Photo</label>
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <label class="cursor-pointer px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-2xs flex items-center gap-1.5 transition">
                      @if (isUploadingProdPhoto()) {
                        <span class="animate-spin text-xs">⏳</span> Uploading...
                      } @else {
                        <span>📸</span> Upload from Device
                      }
                      <input 
                        type="file" 
                        accept="image/*" 
                        (change)="onUploadProductPhoto($event)" 
                        class="hidden">
                    </label>
                    <span class="text-[11px] text-slate-400">or paste URL below</span>
                  </div>

                  <div class="flex items-center gap-3">
                    <input 
                      type="url" 
                      [(ngModel)]="newProdImageUrl" 
                      name="prodImg"
                      placeholder="Upload photo or paste URL..."
                      class="flex-1 px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
                    <img 
                      [src]="newProdImageUrl || fallbackImg" 
                      class="w-10 h-10 rounded-xl object-cover border border-amber-200 flex-shrink-0 shadow-2xs"
                      (error)="onImgError($event)">
                  </div>
                </div>
              </div>

              <!-- Pricing Matrix (Purchase Price, Overhead %, Selling Price) -->
              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-slate-700 mb-1">Purchase Price (₹) <span class="text-amber-600">*</span></label>
                  <input 
                    type="number" 
                    [(ngModel)]="newProdPurchasePrice" 
                    name="prodPurch"
                    step="0.5" min="1"
                    required
                    class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs font-mono font-bold focus:border-amber-500 focus:bg-white focus:outline-none">
                </div>

                <div>
                  <label class="block text-[11px] font-bold text-slate-700 mb-1">Overhead % <span class="text-amber-600">*</span></label>
                  <input 
                    type="number" 
                    [(ngModel)]="newProdOverheadPct" 
                    name="prodOv"
                    min="0" max="100"
                    required
                    class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs font-mono focus:border-amber-500 focus:bg-white focus:outline-none">
                </div>

                <div>
                  <label class="block text-[11px] font-bold text-slate-700 mb-1">Selling Price / MRP (₹) <span class="text-amber-600">*</span></label>
                  <input 
                    type="number" 
                    [(ngModel)]="newProdSellingPrice" 
                    name="prodSell"
                    step="0.5" min="1"
                    required
                    class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs font-mono font-bold text-amber-800 focus:border-amber-500 focus:bg-white focus:outline-none">
                </div>
              </div>

              <!-- Stock & Threshold -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Initial Stock Quantity <span class="text-amber-600">*</span></label>
                  <input 
                    type="number" 
                    [(ngModel)]="newProdStock" 
                    name="prodStock"
                    min="0"
                    required
                    class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs font-mono focus:border-amber-500 focus:bg-white focus:outline-none">
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Low Stock Alert Level</label>
                  <input 
                    type="number" 
                    [(ngModel)]="newProdLowStock" 
                    name="prodLow"
                    min="1"
                    required
                    class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs font-mono focus:border-amber-500 focus:bg-white focus:outline-none">
                </div>
              </div>

              <!-- Assign to both shops checkbox -->
              <div class="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="applyAllShops"
                  [(ngModel)]="newProdApplyToAllShops" 
                  name="applyAll"
                  class="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer">
                <label for="applyAllShops" class="font-bold text-amber-900 cursor-pointer">
                  Assign & Stock in Both Shops (Branch 1 & Branch 2)
                </label>
              </div>

              <!-- Computed Preview -->
              <div class="p-3 rounded-xl bg-amber-50 text-[11px] space-y-1 border border-amber-200 text-slate-700">
                <div class="flex justify-between">
                  <span>Computed Overhead Price:</span>
                  <span class="font-bold text-amber-800">₹{{ computeNewOverheadPrice().toFixed(2) }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Minimum 50% Profit Floor:</span>
                  <span class="font-bold text-emerald-700">₹{{ computeNewThresholdPrice().toFixed(2) }}</span>
                </div>
              </div>

              <button 
                type="submit" 
                [disabled]="isSavingProduct()"
                class="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50 mt-2">
                @if (isSavingProduct()) {
                  <span class="animate-spin text-sm">⏳</span> Creating & Stocking Product...
                } @else {
                  <span>➕</span> Create & Add Product to Shop Inventory
                }
              </button>
            </form>

          </div>
        </div>
      }

      <!-- 2. ADD FESTIVAL CATEGORY MODAL -->
      @if (isAddCategoryOpen()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div class="w-full max-w-md bg-white border border-amber-200 rounded-3xl shadow-2xl p-6">
            
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🏷️</span> Add Festival Category
              </h3>
              <button (click)="isAddCategoryOpen.set(false)" class="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <form (submit)="onAddCategorySubmit($event)" class="space-y-3.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Category Name <span class="text-amber-600">*</span></label>
                <input 
                  type="text" 
                  [(ngModel)]="newCatName" 
                  (input)="onCatNameChange()"
                  name="catName"
                  required
                  placeholder="e.g. Sky Shots & Multi-Effect Aerials"
                  class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Slug (URL friendly)</label>
                <input 
                  type="text" 
                  [(ngModel)]="newCatSlug" 
                  name="catSlug"
                  required
                  placeholder="e.g. sky-shots-aerials"
                  class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs font-mono focus:border-amber-500 focus:bg-white focus:outline-none">
              </div>

              <!-- Category Photo with Direct Upload -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Category Photo</label>
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <label class="cursor-pointer px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-2xs flex items-center gap-1.5 transition">
                      @if (isUploadingCatPhoto()) {
                        <span class="animate-spin text-xs">⏳</span> Uploading...
                      } @else {
                        <span>📸</span> Upload from Device
                      }
                      <input 
                        type="file" 
                        accept="image/*" 
                        (change)="onUploadCategoryPhoto($event)" 
                        class="hidden">
                    </label>
                    <span class="text-[11px] text-slate-400">or paste URL below</span>
                  </div>

                  <div class="flex items-center gap-3">
                    <input 
                      type="url" 
                      [(ngModel)]="newCatImageUrl" 
                      name="catImg"
                      placeholder="Upload photo or paste URL..."
                      class="flex-1 px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
                    <img 
                      [src]="newCatImageUrl || fallbackImg" 
                      class="w-10 h-10 rounded-xl object-cover border border-amber-200 flex-shrink-0 shadow-2xs"
                      (error)="onImgError($event)">
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
                <textarea 
                  [(ngModel)]="newCatDesc" 
                  name="catDesc"
                  rows="2"
                  placeholder="Diwali special collection of colorful sky aerials..."
                  class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none resize-none"></textarea>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Icon Name</label>
                  <input 
                    type="text" 
                    [(ngModel)]="newCatIcon" 
                    name="catIcon"
                    placeholder="e.g. Sparkles / Flame"
                    class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Display Order</label>
                  <input 
                    type="number" 
                    [(ngModel)]="newCatOrder" 
                    name="catOrder"
                    min="1"
                    class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs font-mono focus:border-amber-500 focus:bg-white focus:outline-none">
                </div>
              </div>

              <button 
                type="submit" 
                class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md transition active:scale-95 mt-3">
                Create Festival Category
              </button>
            </form>

          </div>
        </div>
      }

      <!-- 3. EDIT INVENTORY ITEM MODAL -->
      @if (editingItem()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div class="w-full max-w-md bg-white border border-amber-200 rounded-3xl shadow-2xl p-6">
            
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 class="text-base font-bold text-slate-900">{{ editingItem()?.productName }}</h3>
                <p class="text-xs text-amber-700 font-semibold">{{ editingItem()?.companyName }}</p>
              </div>
              <button (click)="editingItem.set(null)" class="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <form (submit)="saveEdit($event)" class="space-y-3.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Purchase Price (₹) (Base Cost)</label>
                <input 
                  type="number" 
                  [(ngModel)]="editPurchasePrice" 
                  name="editPurchasePrice"
                  step="0.5" min="1"
                  required
                  class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs font-mono font-bold focus:border-amber-500 focus:bg-white focus:outline-none">
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Overhead %</label>
                  <input 
                    type="number" 
                    [(ngModel)]="editOverheadPct" 
                    name="editOverheadPct"
                    min="0" max="100"
                    required
                    class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs font-mono focus:border-amber-500 focus:bg-white focus:outline-none">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Selling Price / MRP (₹)</label>
                  <input 
                    type="number" 
                    [(ngModel)]="editSellingPrice" 
                    name="editSellingPrice"
                    step="0.5" min="1"
                    required
                    class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs font-mono font-bold text-amber-800 focus:border-amber-500 focus:bg-white focus:outline-none">
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Stock Quantity</label>
                  <input 
                    type="number" 
                    [(ngModel)]="editStockQty" 
                    name="editStockQty"
                    min="0"
                    required
                    class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs font-mono focus:border-amber-500 focus:bg-white focus:outline-none">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Low Stock Alert Level</label>
                  <input 
                    type="number" 
                    [(ngModel)]="editLowStock" 
                    name="editLowStock"
                    min="1"
                    required
                    class="w-full px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs font-mono focus:border-amber-500 focus:bg-white focus:outline-none">
                </div>
              </div>

              <!-- Computed Preview -->
              <div class="p-3 rounded-xl bg-amber-50 text-[11px] space-y-1 text-slate-700 border border-amber-200">
                <div class="flex justify-between">
                  <span>Computed Overhead Price:</span>
                  <span class="font-bold text-amber-800">₹{{ computeEditOverheadPrice().toFixed(2) }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Minimum 50% Profit Floor:</span>
                  <span class="font-bold text-emerald-700">₹{{ computeEditThresholdPrice().toFixed(2) }}</span>
                </div>
              </div>

              <button 
                type="submit" 
                class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md transition active:scale-95 mt-3">
                Save Changes & Recalculate Margins
              </button>
            </form>
          </div>
        </div>
      }

      <!-- 4. SELECTIVE MULTI-BRANCH SYNC MODAL -->
      @if (isSyncModalOpen()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div class="w-full max-w-md bg-white border border-amber-200 rounded-3xl shadow-2xl p-6">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🔄</span> Sync Products to Destination Branch
              </h3>
              <button (click)="isSyncModalOpen.set(false)" class="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <div class="space-y-4">
              <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-slate-700 space-y-1">
                <p><strong>Source Branch:</strong> <span class="text-amber-900 font-bold">{{ catalogService.selectedShop()?.name }}</span></p>
                <p class="text-[11px] text-slate-500">Products and categories in this branch will be synchronized to the target branch.</p>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Select Destination / Target Branch:</label>
                <select 
                  [(ngModel)]="selectedTargetShopId" 
                  class="w-full px-3 py-2.5 rounded-xl bg-amber-50/40 border border-amber-200 text-slate-800 text-xs font-semibold focus:border-amber-500 focus:bg-white focus:outline-none cursor-pointer">
                  <option [value]="0">🌐 All other active branches</option>
                  @for (s of otherShops(); track s.id) {
                    <option [value]="s.id">🏬 {{ s.name }} ({{ s.city }})</option>
                  }
                </select>
              </div>

              <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800">
                ✅ Existing inventory items and custom selling rates in the destination branch will remain safe and will not be overwritten.
              </div>

              <div class="flex items-center gap-2 pt-2">
                <button 
                  type="button" 
                  (click)="isSyncModalOpen.set(false)"
                  class="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer">
                  Cancel
                </button>
                <button 
                  type="button" 
                  (click)="executeSelectiveSync()"
                  [disabled]="isSyncing()"
                  class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer">
                  @if (isSyncing()) {
                    <span class="animate-spin text-xs">⏳</span> Syncing...
                  } @else {
                    <span>🚀</span> Start Sync Now
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class InventoryManagerComponent implements OnInit {
  inventoryService = inject(InventoryService);
  catalogService = inject(CatalogService);
  adminService = inject(AdminService);
  authService = inject(AuthService);
  router = inject(Router);

  constructor() {
    effect(() => {
      if (!this.authService.isOwner()) {
        this.router.navigate(['/']);
      }
    });
  }

  readonly fallbackImg = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80';

  // Category filter state
  readonly selectedCategoryFilter = signal<string>('ALL');

  // Add Product modal states
  readonly isAddProductOpen = signal<boolean>(false);
  readonly isSavingProduct = signal<boolean>(false);
  newProdCategoryId: number = 1;
  newProdName = '';
  newProdCompany = 'Standard Fireworks';
  newProdPack = '1 Box';
  newProdImageUrl = '';
  newProdPurchasePrice = 100;
  newProdOverheadPct = 25;
  newProdSellingPrice = 180;
  newProdStock = 50;
  newProdLowStock = 10;
  newProdApplyToAllShops = true;
  readonly isUploadingProdPhoto = signal<boolean>(false);
  readonly isUploadingCatPhoto = signal<boolean>(false);
  readonly isSyncing = signal<boolean>(false);
  readonly isSyncModalOpen = signal<boolean>(false);
  selectedTargetShopId: number = 0;

  readonly otherShops = computed(() => {
    const currentId = this.catalogService.selectedShop()?.id;
    return this.catalogService.shops().filter(s => s.id !== currentId);
  });

  // Add Category modal states
  readonly isAddCategoryOpen = signal<boolean>(false);
  newCatName = '';
  newCatSlug = '';
  newCatImageUrl = '';
  newCatDesc = '';
  newCatIcon = 'Sparkles';
  newCatOrder = 1;

  // Edit modal states
  readonly editingItem = signal<OwnerInventory | null>(null);
  editPurchasePrice = 0;
  editOverheadPct = 25;
  editSellingPrice = 0;
  editStockQty = 0;
  editLowStock = 10;

  // Group items by category name
  readonly categorizedGroups = computed<CategoryGroup[]>(() => {
    const items = this.inventoryService.filteredInventory();
    const groupMap = new Map<string, CategoryGroup>();

    items.forEach(item => {
      const cat = item.categoryName || 'Other Fireworks';
      if (!groupMap.has(cat)) {
        groupMap.set(cat, {
          categoryName: cat,
          categoryId: item.categoryId,
          imageUrl: item.imageUrl,
          items: [],
          totalStock: 0,
          lowStockCount: 0
        });
      }
      const g = groupMap.get(cat)!;
      g.items.push(item);
      g.totalStock += item.stockQuantity;
      if (item.isLowStock) g.lowStockCount++;
    });

    return Array.from(groupMap.values());
  });

  // Filtered displayed groups according to selected category tab
  readonly displayedGroups = computed<CategoryGroup[]>(() => {
    const filter = this.selectedCategoryFilter();
    const all = this.categorizedGroups();
    if (filter === 'ALL') return all;
    return all.filter(g => g.categoryName === filter);
  });

  ngOnInit(): void {
    const shopId = this.catalogService.selectedShop()?.id || 1;
    this.inventoryService.loadShopInventory(shopId).subscribe();
    this.catalogService.loadCategories().subscribe();
  }

  onImgError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && target.src !== this.fallbackImg) {
      target.src = this.fallbackImg;
    }
  }

  // --- ADD PRODUCT MODAL ---
  openAddProductModal(): void {
    const cats = this.catalogService.categories();
    if (cats.length > 0 && !this.newProdCategoryId) {
      this.newProdCategoryId = cats[0].id;
    }
    this.isAddProductOpen.set(true);
  }

  openAddProductForCategory(catId?: number): void {
    if (catId) this.newProdCategoryId = catId;
    this.isAddProductOpen.set(true);
  }

  computeNewOverheadPrice(): number {
    return this.newProdPurchasePrice * (1 + (this.newProdOverheadPct / 100));
  }

  computeNewThresholdPrice(): number {
    return this.computeNewOverheadPrice() * 1.50;
  }

  onAddProductSubmit(e: Event): void {
    e.preventDefault();
    const shopId = this.catalogService.selectedShop()?.id || 1;

    const req: QuickCreateProductRequest = {
      shopId,
      categoryId: Number(this.newProdCategoryId),
      productName: this.newProdName,
      companyName: this.newProdCompany,
      packDescription: this.newProdPack,
      imageUrl: this.newProdImageUrl.trim() || undefined,
      purchasePrice: this.newProdPurchasePrice,
      overheadPercentage: this.newProdOverheadPct,
      sellingPrice: this.newProdSellingPrice,
      initialStock: this.newProdStock,
      lowStockThreshold: this.newProdLowStock,
      applyToAllShops: this.newProdApplyToAllShops
    };

    this.isSavingProduct.set(true);
    this.inventoryService.quickCreateProduct(req).subscribe({
      next: () => {
        this.isSavingProduct.set(false);
        this.isAddProductOpen.set(false);
        // Refresh inventory to display new product
        this.inventoryService.loadShopInventory(shopId).subscribe();
        // Reset form
        this.newProdName = '';
        this.newProdImageUrl = '';
      },
      error: () => this.isSavingProduct.set(false)
    });
  }

  onUploadProductPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.isUploadingProdPhoto.set(true);
      this.inventoryService.uploadImage(input.files[0]).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.newProdImageUrl = res.data.url;
          }
          this.isUploadingProdPhoto.set(false);
        },
        error: () => this.isUploadingProdPhoto.set(false)
      });
    }
  }

  onUploadCategoryPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.isUploadingCatPhoto.set(true);
      this.inventoryService.uploadImage(input.files[0]).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.newCatImageUrl = res.data.url;
          }
          this.isUploadingCatPhoto.set(false);
        },
        error: () => this.isUploadingCatPhoto.set(false)
      });
    }
  }

  openSyncModal(): void {
    this.selectedTargetShopId = 0;
    this.isSyncModalOpen.set(true);
  }

  executeSelectiveSync(): void {
    const sourceShopId = this.catalogService.selectedShop()?.id || 1;
    const targetShopId = Number(this.selectedTargetShopId) > 0 ? Number(this.selectedTargetShopId) : undefined;

    this.isSyncing.set(true);
    this.inventoryService.syncInventoryToAllShops(sourceShopId, targetShopId).subscribe({
      next: (res) => {
        this.isSyncing.set(false);
        this.isSyncModalOpen.set(false);
        alert(res.message || 'Catalog synchronized across branches successfully!');
        this.inventoryService.loadShopInventory(sourceShopId).subscribe();
      },
      error: (err) => {
        this.isSyncing.set(false);
        alert('Failed to sync catalog: ' + (err.error?.message || err.message));
      }
    });
  }

  // --- ADD CATEGORY MODAL ---
  openAddCategoryModal(): void {
    this.newCatName = '';
    this.newCatSlug = '';
    this.newCatImageUrl = '';
    this.newCatDesc = '';
    this.newCatOrder = this.catalogService.categories().length + 1;
    this.isAddCategoryOpen.set(true);
  }

  onCatNameChange(): void {
    this.newCatSlug = this.newCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  onAddCategorySubmit(e: Event): void {
    e.preventDefault();
    const req: CategoryDTO = {
      name: this.newCatName,
      slug: this.newCatSlug,
      imageUrl: this.newCatImageUrl.trim() || undefined,
      description: this.newCatDesc,
      iconName: this.newCatIcon || 'Sparkles',
      displayOrder: this.newCatOrder,
      isActive: true
    };

    this.adminService.createCategory(req).subscribe({
      next: () => {
        this.isAddCategoryOpen.set(false);
        this.catalogService.loadCategories().subscribe();
      }
    });
  }

  // --- EDIT MODAL ---
  openEditModal(item: OwnerInventory): void {
    this.editingItem.set(item);
    this.editPurchasePrice = item.purchasePrice;
    this.editOverheadPct = item.overheadPercentage;
    this.editSellingPrice = item.sellingPrice;
    this.editStockQty = item.stockQuantity;
    this.editLowStock = item.lowStockThreshold;
  }

  computeEditOverheadPrice(): number {
    return this.editPurchasePrice * (1 + (this.editOverheadPct / 100));
  }

  computeEditThresholdPrice(): number {
    return this.computeEditOverheadPrice() * 1.50;
  }

  saveEdit(e: Event): void {
    e.preventDefault();
    const item = this.editingItem();
    if (!item) return;

    const req: UpdateShopInventoryRequest = {
      purchasePrice: this.editPurchasePrice,
      overheadPercentage: this.editOverheadPct,
      sellingPrice: this.editSellingPrice,
      stockQuantity: this.editStockQty,
      lowStockThreshold: this.editLowStock
    };

    this.inventoryService.updateInventoryItem(item.id, req).subscribe({
      next: () => this.editingItem.set(null)
    });
  }

  onDeleteProduct(item: OwnerInventory): void {
    const confirmMsg = `Are you sure you want to delete "${item.productName}" from this shop inventory?\n\n(Note: If this product was included in previous customer orders or bills, those historical records and bills will remain safely preserved.)`;
    if (confirm(confirmMsg)) {
      this.inventoryService.deleteInventoryItem(item.id).subscribe({
        next: (res) => {
          if (res.success) {
            alert('Product removed from shop inventory successfully.');
          }
        },
        error: (err) => {
          alert('Failed to delete product: ' + (err.error?.message || err.message));
        }
      });
    }
  }
}
