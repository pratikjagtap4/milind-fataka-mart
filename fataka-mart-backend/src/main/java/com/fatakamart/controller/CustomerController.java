package com.fatakamart.controller;

import com.fatakamart.domain.enums.Role;
import com.fatakamart.dto.billing.CustomerSearchDTO;
import com.fatakamart.dto.billing.QuickCustomerCreateRequest;
import com.fatakamart.payload.ApiResponse;
import com.fatakamart.security.UserPrincipal;
import com.fatakamart.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/customers")
@PreAuthorize("hasAnyRole('OWNER', 'SUPER_ADMIN')")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Customer Management & Quick Search", description = "Endpoints for fast POS customer lookup, tier assignment, and inline registration")
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping("/search")
    @Operation(summary = "Quick-search existing customers by Mobile Number, Name, or Referred By")
    public ResponseEntity<ApiResponse<List<CustomerSearchDTO>>> quickSearch(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) Long shopId,
            @RequestParam(required = false) String query) {

        Long targetShopId = resolveShopId(user, shopId);
        List<CustomerSearchDTO> results = customerService.quickSearchCustomers(targetShopId, query);
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    @PostMapping("/quick-create")
    @Operation(summary = "Inline customer creation without leaving the POS billing screen")
    public ResponseEntity<ApiResponse<CustomerSearchDTO>> quickCreate(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody QuickCustomerCreateRequest request) {

        if (request.getShopId() == null) {
            request.setShopId(resolveShopId(user, null));
        }

        CustomerSearchDTO created = customerService.createQuickCustomer(request);
        return ResponseEntity.ok(ApiResponse.ok("Customer added successfully", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update customer profile, tier, and details")
    public ResponseEntity<ApiResponse<CustomerSearchDTO>> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody QuickCustomerCreateRequest request) {
        CustomerSearchDTO updated = customerService.updateCustomer(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Customer updated successfully", updated));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get customer details and purchase stats by ID")
    public ResponseEntity<ApiResponse<CustomerSearchDTO>> getCustomerById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(customerService.getCustomerById(id)));
    }

    @GetMapping
    @Operation(summary = "List all customers registered at the shop")
    public ResponseEntity<ApiResponse<List<CustomerSearchDTO>>> getAllShopCustomers(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) Long shopId) {

        Long targetShopId = resolveShopId(user, shopId);
        return ResponseEntity.ok(ApiResponse.ok(customerService.getAllShopCustomers(targetShopId)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete customer from directory (preserves historical bills & orders)")
    public ResponseEntity<ApiResponse<String>> deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.ok(ApiResponse.ok("Customer deleted successfully. All past bills & order records remain preserved."));
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
