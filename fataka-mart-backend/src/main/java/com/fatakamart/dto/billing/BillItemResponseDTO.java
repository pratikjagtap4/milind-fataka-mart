package com.fatakamart.dto.billing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillItemResponseDTO {

    private Integer srNo;
    private Long id;
    private Long shopInventoryId;
    private String productName;
    private String companyName;
    private String packDescription;
    private BigDecimal sellingPrice;       // MRP per unit
    private BigDecimal discountPercentage;
    private BigDecimal finalRate;          // Unit rate after discount
    private Integer quantity;
    private BigDecimal lineTotal;          // finalRate * quantity
}
