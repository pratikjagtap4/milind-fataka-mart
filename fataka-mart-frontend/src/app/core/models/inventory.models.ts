export interface OwnerInventory {
  id: number;
  shopId: number;
  shopName: string;
  baseProductId: number;
  productName: string;
  customName?: string;
  companyName: string;
  packDescription: string;
  categoryId: number;
  categoryName: string;
  
  // Confidential pricing
  purchasePrice: number;
  overheadPercentage: number;
  overheadPrice: number;
  sellingPrice: number;
  thresholdPrice: number;
  marginOverheadAmount: number;
  marginPercentageOnOverhead: number;
  
  stockQuantity: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  isActive: boolean;
  imageUrl?: string;
}

export interface UpdateShopInventoryRequest {
  customName?: string;
  purchasePrice: number;
  overheadPercentage: number;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  isActive?: boolean;
}

export interface ImportProductRequest {
  baseProductId: number;
  shopId?: number;
  purchasePrice?: number;
  overheadPercentage?: number;
  sellingPrice?: number;
  initialStock?: number;
  lowStockThreshold?: number;
}

export interface QuickCreateProductRequest {
  shopId: number;
  categoryId: number;
  productName: string;
  companyName: string;
  packDescription?: string;
  description?: string;
  imageUrl?: string;
  purchasePrice: number;
  overheadPercentage: number;
  sellingPrice: number;
  initialStock: number;
  lowStockThreshold: number;
  applyToAllShops?: boolean;
}
