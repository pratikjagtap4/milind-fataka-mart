package com.fatakamart.dto.billing;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fatakamart.domain.enums.CustomerTier;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuickCustomerCreateRequest {

    private Long shopId;

    @NotBlank(message = "Customer name is mandatory")
    @JsonAlias({"fullName", "name", "customerName"})
    private String fullName;

    @NotBlank(message = "Mobile number is mandatory")
    @Pattern(regexp = "^[0-9+ -]{6,20}$", message = "Please provide a valid mobile number")
    @JsonAlias({"mobileNumber", "mobile", "phone"})
    private String mobileNumber;

    private String address;

    private String referredBy;

    @Builder.Default
    private CustomerTier tier = CustomerTier.NORMAL;

    private String notes;
}
