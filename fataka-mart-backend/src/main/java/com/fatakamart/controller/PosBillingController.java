package com.fatakamart.controller;

import com.fatakamart.domain.enums.CustomerTier;
import com.fatakamart.domain.enums.OrderStatus;
import com.fatakamart.domain.enums.Role;
import com.fatakamart.dto.billing.*;
import com.fatakamart.payload.ApiResponse;
import com.fatakamart.security.UserPrincipal;
import com.fatakamart.service.BillingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/pos")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Speed Billing POS & Margins", description = "Endpoints for fast festival billing, real-time margin warnings, tier calculations, and invoice generation")
public class PosBillingController {

    private final BillingService billingService;

    @PostMapping("/validate-margins")
    @PreAuthorize("hasAnyRole('OWNER', 'SUPER_ADMIN')")
    @Operation(summary = "Real-time dynamic margin check & alert validation for the billing grid")
    public ResponseEntity<ApiResponse<MarginValidationResultDTO>> validateMargins(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) Long shopId,
            @RequestParam(defaultValue = "NORMAL") CustomerTier tier,
            @RequestParam(defaultValue = "0.0") BigDecimal overallDiscountPercentage,
            @RequestBody List<BillItemRequest> items) {

        Long targetShopId = resolveShopId(user, shopId);
        MarginValidationResultDTO result = billingService.validateAndCalculateMargins(
                targetShopId, tier, items, overallDiscountPercentage);

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/suggest-rate")
    @PreAuthorize("hasAnyRole('OWNER', 'SUPER_ADMIN')")
    @Operation(summary = "Calculate suggested final rate based on customer tier (Normal, Regular 85%, Close 55%)")
    public ResponseEntity<ApiResponse<TierPriceSuggestionDTO>> getSuggestedRate(
            @RequestParam Long shopInventoryId,
            @RequestParam CustomerTier tier) {

        return ResponseEntity.ok(ApiResponse.ok(billingService.getTierPriceSuggestion(shopInventoryId, tier)));
    }

    @PostMapping("/generate-bill")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Generate bill, update customer loyalty, decrement inventory, and produce WhatsApp share URL")
    public ResponseEntity<ApiResponse<BillResponseDTO>> generateBill(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody BillCreateRequest request) {

        if (request.getShopId() == null) {
            request.setShopId(resolveShopId(user, null));
        }

        BillResponseDTO response = billingService.generateBill(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Bill generated successfully!", response));
    }

    @GetMapping("/bills/{billNumber}")
    @PreAuthorize("hasAnyRole('OWNER', 'SUPER_ADMIN')")
    @Operation(summary = "Get full bill audit with confidential purchase price and overhead profit breakdown")
    public ResponseEntity<ApiResponse<OwnerBillDetailsDTO>> getOwnerBillDetails(
            @PathVariable String billNumber) {

        return ResponseEntity.ok(ApiResponse.ok(billingService.getOwnerBill(billNumber)));
    }

    @GetMapping("/bills")
    @PreAuthorize("hasAnyRole('OWNER', 'SUPER_ADMIN')")
    @Operation(summary = "List shop bills with optional date range filters")
    public ResponseEntity<ApiResponse<List<BillResponseDTO>>> getShopBills(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) Long shopId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {

        Long targetShopId;
        if (user.getRole() == Role.SUPER_ADMIN) {
            targetShopId = (shopId != null && shopId > 0) ? shopId : null;
        } else {
            targetShopId = user.getShopId() != null ? user.getShopId() : 1L;
        }
        return ResponseEntity.ok(ApiResponse.ok(billingService.getShopBills(targetShopId, startDate, endDate)));
    }

    @GetMapping("/orders/pending")
    @PreAuthorize("hasAnyRole('OWNER', 'SUPER_ADMIN')")
    @Operation(summary = "Get pending customer online orders awaiting owner review")
    public ResponseEntity<ApiResponse<List<BillResponseDTO>>> getPendingOrders(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) Long shopId) {

        Long targetShopId;
        if (user.getRole() == Role.SUPER_ADMIN) {
            targetShopId = (shopId != null && shopId > 0) ? shopId : null;
        } else {
            targetShopId = user.getShopId() != null ? user.getShopId() : 1L;
        }
        return ResponseEntity.ok(ApiResponse.ok(billingService.getPendingOrders(targetShopId)));
    }

    @GetMapping("/orders/pending/count")
    @PreAuthorize("hasAnyRole('OWNER', 'SUPER_ADMIN')")
    @Operation(summary = "Get count of pending customer online orders for notification badge")
    public ResponseEntity<ApiResponse<Long>> getPendingOrdersCount(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) Long shopId) {

        Long targetShopId;
        if (user.getRole() == Role.SUPER_ADMIN) {
            targetShopId = (shopId != null && shopId > 0) ? shopId : null;
        } else {
            targetShopId = user.getShopId() != null ? user.getShopId() : 1L;
        }
        return ResponseEntity.ok(ApiResponse.ok(billingService.getPendingOrdersCount(targetShopId)));
    }

    @PutMapping("/orders/{billNumber}/status")
    @PreAuthorize("hasAnyRole('OWNER', 'SUPER_ADMIN')")
    @Operation(summary = "Update customer order status (PENDING_REVIEW -> DISPATCHED -> COMPLETED / CANCELLED)")
    public ResponseEntity<ApiResponse<BillResponseDTO>> updateOrderStatus(
            @PathVariable String billNumber,
            @RequestParam OrderStatus status) {

        BillResponseDTO updated = billingService.updateOrderStatus(billNumber, status);
        return ResponseEntity.ok(ApiResponse.ok("Order status updated successfully", updated));
    }

    private Long resolveShopId(UserPrincipal user, Long paramShopId) {
        if (user.getRole() == Role.SUPER_ADMIN && paramShopId != null) {
            return paramShopId;
        }
        if (user.getShopId() != null) {
            return user.getShopId();
        }
        return 1L;
    }
}
