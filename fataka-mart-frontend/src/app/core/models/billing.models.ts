export type CustomerTier = 'NORMAL' | 'REGULAR' | 'CLOSE';
export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'CREDIT' | 'ONLINE';
export type MarginAlert = 'GREEN' | 'ORANGE' | 'RED';
export type OrderStatus = 'PENDING_REVIEW' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';

export interface Customer {
  id: number;
  shopId?: number;
  fullName: string;
  mobileNumber: string;
  address?: string;
  referredBy?: string;
  tier: CustomerTier;
  totalPurchasesCount: number;
  totalSpent: number;
  outstandingBalance: number;
}

export interface QuickCustomerCreateRequest {
  shopId?: number;
  fullName: string;
  mobileNumber: string;
  address?: string;
  referredBy?: string;
  tier: CustomerTier;
  notes?: string;
}

export interface BillItemRequest {
  shopInventoryId: number;
  quantity: number;
  sellingPrice: number;
  discountPercentage: number;
  finalRate?: number;
}

export interface PosGridItem {
  srNo: number;
  shopInventoryId: number;
  productName: string;
  companyName: string;
  packDescription?: string;
  overheadPrice: number;       // Visible when eye toggle is ON
  sellingPrice: number;        // MRP
  discountPercentage: number;  // Editable per row
  finalRate: number;           // Unit rate after discount
  quantity: number;
  lineTotal: number;
  rowAlertLevel?: MarginAlert;
  rowMessage?: string;
  stockQuantity: number;
  imageUrl?: string;
}

export interface BillCreateRequest {
  shopId?: number;
  customerId?: number;
  customerName: string;
  customerMobile: string;
  customerTier: CustomerTier;
  paymentMethod: PaymentMethod;
  overallDiscountPercentage: number;
  items: BillItemRequest[];
  festiveGreeting?: string;
  status?: OrderStatus;
}

export interface BillItemResponse {
  srNo: number;
  id?: number;
  shopInventoryId?: number;
  productName: string;
  companyName: string;
  packDescription?: string;
  sellingPrice: number;
  discountPercentage: number;
  finalRate: number;
  quantity: number;
  lineTotal: number;
}

export interface BillResponse {
  id: number;
  billNumber: string;
  dateTime: string;
  shopId: number;
  shopName: string;
  shopAddress: string;
  shopCity: string;
  contactPhone: string;
  gstNumber?: string;
  customerId?: number;
  customerName: string;
  customerMobile: string;
  customerTier: CustomerTier;
  paymentMethod: PaymentMethod;
  items: BillItemResponse[];
  subtotalMrp: number;
  overallDiscountPercentage: number;
  totalDiscountAmount: number;
  totalSavingsAmount: number;
  finalAmount: number;
  festiveGreeting: string;
  status?: OrderStatus;
  whatsappShareUrl: string;
  whatsappMessageText: string;
}

export interface ItemMarginAlert {
  shopInventoryId: number;
  productName: string;
  overheadPrice: number;
  finalRate: number;
  ratioToOverhead: number;
  rowAlertLevel: MarginAlert;
  rowMessage: string;
}

export interface MarginValidationResult {
  subtotalMrp: number;
  totalSavingsAmount: number;
  finalAmount: number;
  totalOverheadCost: number;
  profitAmount: number;
  profitMarginPercentage: number;
  ratioToOverhead: number;
  alertLevel: MarginAlert;
  alertBannerMessage?: string;
  isBelow50PercentProfit: boolean;
  isBelowRegularMarkup: boolean;
  itemAlerts: ItemMarginAlert[];
}

export interface TierPriceSuggestion {
  shopInventoryId: number;
  productName: string;
  tier: CustomerTier;
  overheadPrice: number;
  sellingPriceMrp: number;
  suggestedRate: number;
  suggestedDiscountPercentage: number;
  minimumThresholdRate: number;
  ruleExplanation: string;
}
