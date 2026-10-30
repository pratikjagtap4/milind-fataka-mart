package com.fatakamart.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BaseProductDTO {

    private Long id;
    private Long categoryId;
    private String categoryName;
    private String name;
    private String companyName;
    private String packDescription;
    private BigDecimal defaultPurchasePrice;
    private BigDecimal defaultSellingPrice;
    private String imageUrl1;
    private String imageUrl2;
    private String imageUrl3;
    private String safetyInstructions;
    private Boolean isActive;
}
