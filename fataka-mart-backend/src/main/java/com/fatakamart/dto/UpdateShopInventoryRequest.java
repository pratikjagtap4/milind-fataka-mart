package com.fatakamart.dto;

import jakarta.validation.constraints.DecimalMin;
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
public class UpdateShopInventoryRequest {

    private String customName;

    @NotNull(message = "Purchase price is required")
    @DecimalMin(value = "0.01", message = "Purchase price must be greater than zero")
    private BigDecimal purchasePrice;

    @NotNull(message = "Overhead percentage is required")
    @DecimalMin(value = "0.0", message = "Overhead percentage cannot be negative")
    private BigDecimal overheadPercentage;

    @NotNull(message = "Selling price (M.R.P.) is required")
    @DecimalMin(value = "0.01", message = "Selling price must be greater than zero")
    private BigDecimal sellingPrice;

    @NotNull(message = "Stock quantity is required")
    private Integer stockQuantity;

    private Integer lowStockThreshold;

    private Boolean isActive;
}
