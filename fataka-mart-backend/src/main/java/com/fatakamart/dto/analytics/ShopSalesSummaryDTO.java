package com.fatakamart.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopSalesSummaryDTO {

    private Long shopId;
    private String shopName;
    private String branchCode;
    private String city;
    private String ownerName;
    private BigDecimal totalRevenue;
    private BigDecimal totalProfit;
    private Long totalOrders;
    private Boolean isActive;
}
