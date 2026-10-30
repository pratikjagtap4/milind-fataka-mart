package com.fatakamart.dto.billing;

import com.fatakamart.domain.enums.CustomerTier;
import com.fatakamart.domain.enums.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * CUSTOMER BILL RESPONSE DTO
 * 
 * STRICT COMPLIANCE:
 * This DTO is rendered for the customer thermal bill & WhatsApp invoice.
 * Purchase Price, Overhead Price, and Profit Margins are STRICTLY OMITTED.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillResponseDTO {

    private Long id;
    private String billNumber;
    private OffsetDateTime dateTime;
    
    // Shop Details for Header
    private Long shopId;
    private String shopName;
    private String shopAddress;
    private String shopCity;
    private String contactPhone;
    private String gstNumber;
    
    // Customer Details
    private Long customerId;
    private String customerName;
    private String customerMobile;
    private CustomerTier customerTier;
    private PaymentMethod paymentMethod;
    
    // Line Items (Only customer-visible fields)
    private List<BillItemResponseDTO> items;
    
    // Summary Calculations
    private BigDecimal subtotalMrp;           // Total Original MRP
    private BigDecimal overallDiscountPercentage;
    private BigDecimal totalDiscountAmount;
    private BigDecimal totalSavingsAmount;    // How much customer saved!
    private BigDecimal finalAmount;           // Net Payable Amount
    
    private String festiveGreeting;
    private com.fatakamart.domain.enums.OrderStatus status;
    private String whatsappShareUrl;
    private String whatsappMessageText;
}
