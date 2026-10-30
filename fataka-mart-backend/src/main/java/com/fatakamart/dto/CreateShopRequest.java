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
public class CreateShopRequest {

    @NotBlank(message = "Shop name is required")
    private String name;

    @NotBlank(message = "Branch code is required (e.g. FM-PUN-03)")
    private String branchCode;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "City is required")
    private String city;

    @Builder.Default
    private String state = "Maharashtra";

    @NotBlank(message = "Contact phone is required")
    private String contactPhone;

    @NotNull(message = "Default overhead percentage is required")
    @DecimalMin(value = "0.0", message = "Overhead percentage cannot be negative")
    @Builder.Default
    private BigDecimal defaultOverheadPercentage = new BigDecimal("25.00");

    private String gstNumber;

    private Long ownerUserId; // Optional: user to immediately assign as shop owner
}
