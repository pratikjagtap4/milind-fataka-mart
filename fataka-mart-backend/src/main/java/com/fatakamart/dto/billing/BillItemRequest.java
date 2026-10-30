package com.fatakamart.dto.billing;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillItemRequest {

    @NotNull(message = "Shop inventory product ID is required")
    private Long shopInventoryId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    @NotNull(message = "Selling price (MRP) is required")
    @DecimalMin(value = "0.01", message = "Selling price must be greater than zero")
    private BigDecimal sellingPrice;

    @Builder.Default
    private BigDecimal discountPercentage = BigDecimal.ZERO;

    // Rate after discount; if null, will be auto computed from sellingPrice & discountPercentage
    private BigDecimal finalRate;
}
