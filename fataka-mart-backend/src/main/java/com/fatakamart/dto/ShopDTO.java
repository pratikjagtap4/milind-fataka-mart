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
public class ShopDTO {

    private Long id;
    private String name;
    private String branchCode;
    private String address;
    private String city;
    private String state;
    private String contactPhone;
    private BigDecimal defaultOverheadPercentage;
    private String gstNumber;
    private Boolean isActive;
    
    // Owner Info
    private Long ownerId;
    private String ownerName;
    private String ownerEmail;
    private String ownerMobile;
    
    // Inventory count
    private Long totalProductsCount;
}
