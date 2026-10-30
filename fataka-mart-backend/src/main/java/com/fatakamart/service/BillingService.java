package com.fatakamart.service;

import com.fatakamart.domain.enums.CustomerTier;
import com.fatakamart.dto.billing.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public interface BillingService {
    // Dynamic POS table calculations & margin validation
    MarginValidationResultDTO validateAndCalculateMargins(
            Long shopId, CustomerTier tier, List<BillItemRequest> items, BigDecimal overallDiscountPercentage);

    TierPriceSuggestionDTO getTierPriceSuggestion(Long shopInventoryId, CustomerTier tier);

    // Bill Generation & Checkout
    BillResponseDTO generateBill(Long createdByUserId, BillCreateRequest request);

    // Bill Retrieval
    BillResponseDTO getPublicBill(String billNumber);
    OwnerBillDetailsDTO getOwnerBill(String billNumber);
    List<BillResponseDTO> getShopBills(Long shopId, OffsetDateTime startDate, OffsetDateTime endDate);

    // Online Customer Orders & Status Management
    BillResponseDTO updateOrderStatus(String billNumber, com.fatakamart.domain.enums.OrderStatus newStatus);
    List<BillResponseDTO> getPendingOrders(Long shopId);
    Long getPendingOrdersCount(Long shopId);
}
