package com.fatakamart.dto.billing;

import com.fatakamart.domain.enums.CustomerTier;
import com.fatakamart.domain.enums.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillCreateRequest {

    private Long shopId;

    private Long customerId;

    @NotBlank(message = "Customer name is required")
    private String customerName;

    @NotBlank(message = "Customer mobile number is required")
    private String customerMobile;

    @NotNull(message = "Customer tier is required")
    @Builder.Default
    private CustomerTier customerTier = CustomerTier.NORMAL;

    @NotNull(message = "Payment method is required")
    @Builder.Default
    private PaymentMethod paymentMethod = PaymentMethod.CASH;

    @Builder.Default
    private BigDecimal overallDiscountPercentage = BigDecimal.ZERO;

    @NotEmpty(message = "Bill must contain at least one item")
    @Valid
    private List<BillItemRequest> items;

    @Builder.Default
    private String festiveGreeting = "Happy Diwali! Thank you for celebrating with Fataka Mart!";

    private com.fatakamart.domain.enums.OrderStatus status;
}
