package com.fatakamart.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
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
public class QuickCreateProductRequest {

    private Long shopId;

    @NotNull(message = "Category is required")
    private Long categoryId;

    @NotBlank(message = "Product name is required")
    @JsonAlias({"productName", "name", "title"})
    private String name;

    @NotBlank(message = "Company name is required")
    @JsonAlias({"companyName", "company", "brand"})
    private String companyName;

    @NotBlank(message = "Pack description is required")
    @JsonAlias({"packDescription", "pack"})
    private String packDescription;

    @NotNull(message = "Purchase price is required")
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal purchasePrice;

    private BigDecimal overheadPercentage;

    @NotNull(message = "Selling price is required")
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal sellingPrice;

    @NotNull(message = "Stock quantity is required")
    @JsonAlias({"stockQuantity", "initialStock", "stock"})
    private Integer stockQuantity;

    @JsonAlias({"imageUrl1", "imageUrl", "photoUrl", "image"})
    private String imageUrl1;

    private String safetyInstructions;

    @Builder.Default
    private Boolean applyToAllShops = true;
}
