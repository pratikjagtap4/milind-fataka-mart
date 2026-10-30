package com.fatakamart.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * OWNER & ADMIN INVENTORY DTO
 * 
 * Contains full pricing metrics including confidential Purchase Price, Overhead %,
 * Overhead Price, and 50% profit Threshold Price.
 * Accessible only by users with ROLE_OWNER or ROLE_SUPER_ADMIN.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnerInventoryDTO {

    private Long id;                  // ShopInventory ID
    private Long shopId;
    private String shopName;
    private Long baseProductId;
    private String productName;
    private String customName;
    private String companyName;
    private String packDescription;
    private Long categoryId;
    private String categoryName;
    
    // CONFIDENTIAL OWNER PRICING
    private BigDecimal purchasePrice;       // What we buy it for
    private BigDecimal overheadPercentage;  // e.g. 25%
    private BigDecimal overheadPrice;       // purchase + overhead
    private BigDecimal sellingPrice;        // MRP for regular walk-in
    private BigDecimal thresholdPrice;      // Floor price protecting >= 50% profit over overhead
    private BigDecimal marginOverheadAmount; // sellingPrice - overheadPrice
    private BigDecimal marginPercentageOnOverhead; // ((sellingPrice - overheadPrice) / overheadPrice) * 100
    
    // Inventory Stock
    private Integer stockQuantity;
    private Integer lowStockThreshold;
    private Boolean isLowStock;
    private Boolean isActive;
    
    // Media
    private String imageUrl;
}
