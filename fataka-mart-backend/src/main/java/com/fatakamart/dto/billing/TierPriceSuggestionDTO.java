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
public class TierPriceSuggestionDTO {

    private Long shopInventoryId;
    private String productName;
    private CustomerTier tier;
    private BigDecimal overheadPrice;
    private BigDecimal sellingPriceMrp;
    
    // Suggested price & markup
    private BigDecimal suggestedRate;
    private BigDecimal suggestedDiscountPercentage;
    private BigDecimal minimumThresholdRate; // 50% min margin floor
    private String ruleExplanation;
}
