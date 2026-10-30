package com.fatakamart.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * PUBLIC CUSTOMER PRODUCT DTO
 * 
 * STRICT CONFIDENTIALITY COMPLIANCE:
 * This DTO is strictly sanitized for guest visitors and customer storefront browsing.
 * - purchasePrice and overheadPrice are EXCLUDED.
 * - profit margins and overhead percentages are EXCLUDED.
 * Under no circumstances should backend cost data be placed into this DTO.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerProductDTO {

    private Long id;                  // ShopInventory ID
    private Long baseProductId;
    private Long shopId;
    private String shopName;
    
    private String name;
    private String companyName;
    private String packDescription;
    
    private Long categoryId;
    private String categoryName;
    private String categorySlug;
    
    // Customer Visible Prices
    private BigDecimal mrp;           // Selling Price / M.R.P.
    private BigDecimal discountedPrice; // Festive promotional storefront price (if discount applicable)
    private BigDecimal discountPercentage;
    
    // Product Gallery & Media
    private String imageUrl1;
    private String imageUrl2;
    private String imageUrl3;
    private List<String> images;
    
    private String safetyInstructions;
    private Boolean inStock;
    private Integer availableStock;
}
