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
public class OwnerBillItemBreakdownDTO {

    private Long id;
    private Long shopInventoryId;
    private String productName;
    private BigDecimal purchasePrice;       // Confidential
    private BigDecimal overheadPrice;       // Confidential
    private BigDecimal sellingPrice;        // MRP
    private BigDecimal discountPercentage;
    private BigDecimal finalRate;
    private Integer quantity;
    private BigDecimal lineTotal;
    private BigDecimal overheadTotal;       // overheadPrice * quantity
    private BigDecimal lineProfit;          // lineTotal - overheadTotal
}
