package com.fatakamart.dto.billing;

import com.fatakamart.domain.enums.MarginAlert;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * MARGIN VALIDATION RESULT DTO
 * 
 * Sent to the Angular POS speed billing grid in real-time as items or discounts change.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarginValidationResultDTO {

    private BigDecimal subtotalMrp;
    private BigDecimal totalSavingsAmount;
    private BigDecimal finalAmount;
    
    // CONFIDENTIAL (Owner view)
    private BigDecimal totalOverheadCost;
    private BigDecimal profitAmount;
    private BigDecimal profitMarginPercentage; // (finalAmount - totalOverheadCost) / totalOverheadCost * 100
    private BigDecimal ratioToOverhead;        // finalAmount / totalOverheadCost e.g. 1.55
    
    // MARGIN ALERTS
    private MarginAlert alertLevel;            // GREEN, ORANGE, RED
    private String alertBannerMessage;         // "Warning: Final price is below the 150% overhead threshold!"
    private Boolean isBelow50PercentProfit;    // Below 1.5x overhead
    private Boolean isBelowRegularMarkup;      // Below 1.8x overhead
    
    // Row by row alerts
    private List<ItemMarginAlertDTO> itemAlerts;
}
