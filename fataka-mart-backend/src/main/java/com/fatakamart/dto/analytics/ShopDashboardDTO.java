package com.fatakamart.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopDashboardDTO {

    private Long shopId;
    private String shopName;
    private String branchCode;
    
    // Sales Totals
    private BigDecimal todaySales;
    private BigDecimal weeklySales;
    private BigDecimal monthlySales;
    
    // Profit Totals (Confidential)
    private BigDecimal todayProfit;
    private BigDecimal weeklyProfit;
    private BigDecimal monthlyProfit;
    
    private Long todayBillsCount;
    private Long totalBillsCount;
    private Long totalCustomersCount;
    
    // Top 5 Products
    private List<TopProductDTO> topSellingProducts;
    
    // Category Sales Distribution
    private List<CategorySalesDTO> categoryDistribution;
}
