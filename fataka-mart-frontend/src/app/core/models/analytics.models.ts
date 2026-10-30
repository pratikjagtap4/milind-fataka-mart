export interface TopProduct {
  productName: string;
  quantitySold: number;
  totalRevenue: number;
}

export interface CategorySales {
  categoryName: string;
  itemsSold: number;
  revenue: number;
}

export interface ShopDashboard {
  shopId: number;
  shopName: string;
  branchCode: string;
  todaySales: number;
  weeklySales: number;
  monthlySales: number;
  todayProfit: number;
  weeklyProfit: number;
  monthlyProfit: number;
  todayBillsCount: number;
  totalBillsCount: number;
  totalCustomersCount: number;
  topSellingProducts: TopProduct[];
  categoryDistribution: CategorySales[];
}

export interface ShopSalesSummary {
  shopId: number;
  shopName: string;
  branchCode: string;
  city: string;
  ownerName: string;
  totalRevenue: number;
  totalProfit: number;
  totalOrders: number;
  isActive: boolean;
}

export interface SuperAdminDashboard {
  totalGlobalRevenue: number;
  totalGlobalProfit: number;
  totalOrdersCount: number;
  totalShopsCount: number;
  totalCustomersCount: number;
  shopComparisons: ShopSalesSummary[];
}
