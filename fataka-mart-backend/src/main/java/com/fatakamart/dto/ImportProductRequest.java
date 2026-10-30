package com.fatakamart.dto;

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
public class ImportProductRequest {

    @NotNull(message = "Base product ID is required")
    private Long baseProductId;

    private Long shopId; // Required if Super Admin is importing, otherwise extracted from Owner session

    private BigDecimal purchasePrice;       // Optional override, defaults to base product default
    private BigDecimal overheadPercentage;  // Optional override, defaults to shop default %
    private BigDecimal sellingPrice;        // Optional override, defaults to base product default
    private Integer initialStock;           // Defaults to 0
    private Integer lowStockThreshold;      // Defaults to 10
}
