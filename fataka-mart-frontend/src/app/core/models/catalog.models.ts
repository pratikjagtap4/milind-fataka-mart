export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  iconName: string;
  displayOrder: number;
  imageUrl?: string;
  productCount?: number;
  isActive: boolean;
}

export interface CustomerProduct {
  id: number; // ShopInventory ID
  baseProductId: number;
  shopId: number;
  shopName: string;
  name: string;
  companyName: string;
  packDescription: string;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  mrp: number;
  discountedPrice: number;
  discountPercentage: number;
  imageUrl1?: string;
  imageUrl2?: string;
  imageUrl3?: string;
  images: string[];
  safetyInstructions?: string;
  inStock: boolean;
  availableStock: number;
}

export interface Shop {
  id: number;
  name: string;
  branchCode: string;
  address: string;
  city: string;
  state: string;
  contactPhone: string;
  defaultOverheadPercentage: number;
  gstNumber?: string;
  isActive: boolean;
  ownerId?: number;
  ownerName?: string;
  ownerEmail?: string;
  ownerMobile?: string;
  totalProductsCount?: number;
}

export interface CreateShopRequest {
  name: string;
  branchCode: string;
  address: string;
  city: string;
  state: string;
  contactPhone: string;
  defaultOverheadPercentage: number;
  gstNumber?: string;
  ownerId?: number;
}

export interface CategoryDTO {
  id?: number;
  name: string;
  slug: string;
  description?: string;
  iconName: string;
  displayOrder: number;
  imageUrl?: string;
  isActive?: boolean;
}

export interface BaseProductDTO {
  id?: number;
  categoryId: number;
  categoryName?: string;
  name: string;
  companyName: string;
  packDescription?: string;
  standardBaseCost: number;
  standardMrp: number;
  description?: string;
  imageUrl1?: string;
  safetyInstructions?: string;
  isActive?: boolean;
}

export interface CreateBaseProductRequest {
  categoryId: number;
  name: string;
  companyName: string;
  packDescription?: string;
  standardBaseCost: number;
  standardMrp: number;
  description?: string;
  imageUrl1?: string;
  safetyInstructions?: string;
}
