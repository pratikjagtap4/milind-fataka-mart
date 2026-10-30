package com.fatakamart.dto.billing;

import com.fatakamart.domain.enums.MarginAlert;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemMarginAlertDTO {

    private Long shopInventoryId;
    private String productName;
    private BigDecimal overheadPrice;
    private BigDecimal finalRate;
    private BigDecimal ratioToOverhead;
    private MarginAlert rowAlertLevel;
    private String rowMessage;
}
