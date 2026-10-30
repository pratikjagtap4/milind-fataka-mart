package com.fatakamart.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
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
public class CreateBaseProductRequest {

    @NotNull(message = "Category is required")
    private Long categoryId;

    @NotBlank(message = "Product name is required")
    private String name;

    @NotBlank(message = "Company / Brand name is required")
    private String companyName;

    @NotBlank(message = "Pack description is required (e.g., Box of 10 Pcs)")
    private String packDescription;

    @NotNull(message = "Default purchase price is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Purchase price cannot be negative")
    private BigDecimal defaultPurchasePrice;

    @NotNull(message = "Default selling price is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Selling price cannot be negative")
    private BigDecimal defaultSellingPrice;

    private String imageUrl1;
    private String imageUrl2;
    private String imageUrl3;
    private String safetyInstructions;
    @Builder.Default
    private Boolean isActive = true;
}
