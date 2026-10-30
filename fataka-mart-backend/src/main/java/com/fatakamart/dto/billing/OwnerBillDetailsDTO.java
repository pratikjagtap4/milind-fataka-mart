package com.fatakamart.dto.billing;

import com.fatakamart.domain.enums.MarginAlert;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * OWNER BILL AUDIT DTO
 * 
 * Accessible exclusively to Shop Owner and Super Admin.
 * Displays behind-the-scenes purchase costs, overhead totals, net profit, and margin alert levels.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnerBillDetailsDTO {

    private BillResponseDTO publicBill;
    
    // CONFIDENTIAL MARGIN METRICS
    private BigDecimal totalPurchaseCost;
    private BigDecimal totalOverheadCost;
    private BigDecimal profitAmount;                 // finalAmount - totalOverheadCost
    private BigDecimal profitMarginPercentage;       // profit / totalOverheadCost * 100
    private MarginAlert marginAlertLevel;            // GREEN, ORANGE, RED
    private String marginAlertMessage;
    
    // Line items with confidential overhead breakdowns
    private List<OwnerBillItemBreakdownDTO> itemBreakdowns;
}
