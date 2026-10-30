package com.fatakamart.dto.billing;

import com.fatakamart.domain.enums.CustomerTier;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerSearchDTO {

    private Long id;
    private Long shopId;
    private String fullName;
    private String mobileNumber;
    private String address;
    private String referredBy;
    private CustomerTier tier;
    private Integer totalPurchasesCount;
    private BigDecimal totalSpent;
    private BigDecimal outstandingBalance;
}
