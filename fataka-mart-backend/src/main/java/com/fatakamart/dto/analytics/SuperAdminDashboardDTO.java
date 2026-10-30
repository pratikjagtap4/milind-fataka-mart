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
public class SuperAdminDashboardDTO {

    private BigDecimal totalGlobalRevenue;
    private BigDecimal totalGlobalProfit;
    private Long totalOrdersCount;
    private Long totalShopsCount;
    private Long totalCustomersCount;

    // Cross-shop comparative cards
    private List<ShopSalesSummaryDTO> shopComparisons;
}
