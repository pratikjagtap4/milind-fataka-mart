package com.fatakamart.controller;

import com.fatakamart.domain.enums.Role;
import com.fatakamart.dto.ImportProductRequest;
import com.fatakamart.dto.OwnerInventoryDTO;
import com.fatakamart.dto.UpdateShopInventoryRequest;
import com.fatakamart.payload.ApiResponse;
import com.fatakamart.security.UserPrincipal;
import com.fatakamart.service.ShopInventoryService;
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
@RequestMapping("/inventory")
@PreAuthorize("hasAnyRole('OWNER', 'SUPER_ADMIN')")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Shop Owner Inventory & Margins", description = "Shop inventory management, overhead %, confidential purchase pricing, and stock alerts")
public class OwnerInventoryController {

    private final ShopInventoryService shopInventoryService;

    @GetMapping
    @Operation(summary = "Get shop inventory with confidential purchase & overhead prices")
    public ResponseEntity<ApiResponse<List<OwnerInventoryDTO>>> getShopInventory(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) Long shopId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search) {

        Long targetShopId = resolveShopId(user, shopId);
        List<OwnerInventoryDTO> inventory = shopInventoryService.getShopInventory(targetShopId, categoryId, search);
        return ResponseEntity.ok(ApiResponse.ok(inventory));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get specific inventory item pricing and margin details")
    public ResponseEntity<ApiResponse<OwnerInventoryDTO>> getInventoryItem(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(shopInventoryService.getInventoryItem(id)));
    }

    @PostMapping("/import")
    @Operation(summary = "Import a global master product into shop inventory with shop-specific margins")
    public ResponseEntity<ApiResponse<OwnerInventoryDTO>> importBaseProduct(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody ImportProductRequest request) {

        if (request.getShopId() == null) {
            request.setShopId(resolveShopId(user, null));
        }

        OwnerInventoryDTO imported = shopInventoryService.importBaseProduct(request);
        return ResponseEntity.ok(ApiResponse.ok("Product imported to shop inventory successfully", imported));
    }

    @PostMapping("/quick-create")
    @Operation(summary = "Create product and add directly to shop inventory in 1 step")
    public ResponseEntity<ApiResponse<OwnerInventoryDTO>> quickCreateProduct(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody com.fatakamart.dto.QuickCreateProductRequest request) {

        if (request.getShopId() == null) {
            request.setShopId(resolveShopId(user, null));
        }

        OwnerInventoryDTO created = shopInventoryService.quickCreateProduct(request);
        return ResponseEntity.ok(ApiResponse.ok("Product created and added to shop inventory successfully", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update shop inventory item (Purchase Price, Overhead %, Selling Price MRP, Stock)")
    public ResponseEntity<ApiResponse<OwnerInventoryDTO>> updateInventory(
            @PathVariable Long id,
            @Valid @RequestBody UpdateShopInventoryRequest request) {

        OwnerInventoryDTO updated = shopInventoryService.updateInventoryPricingAndStock(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Inventory pricing and stock updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove product from shop inventory (preserves existing order history)")
    public ResponseEntity<ApiResponse<String>> deleteInventoryItem(@PathVariable Long id) {
        shopInventoryService.deleteInventoryItem(id);
        return ResponseEntity.ok(ApiResponse.ok("Product removed from shop inventory successfully. Previous bills and order records remain safely preserved."));
    }

    @PostMapping("/sync-all")
    @Operation(summary = "Sync and clone inventory from one shop to specific or all other shops")
    public ResponseEntity<ApiResponse<String>> syncInventoryToAllShops(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) Long sourceShopId,
            @RequestParam(required = false) Long targetShopId) {

        Long targetSourceId = resolveShopId(user, sourceShopId);
        int synced = shopInventoryService.syncInventoryToAllShops(targetSourceId, targetShopId);
        return ResponseEntity.ok(ApiResponse.ok("Synced " + synced + " items to target branch successfully!"));
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Get list of low-stock products in shop inventory")
    public ResponseEntity<ApiResponse<List<OwnerInventoryDTO>>> getLowStockItems(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) Long shopId) {

        Long targetShopId = resolveShopId(user, shopId);
        return ResponseEntity.ok(ApiResponse.ok(shopInventoryService.getLowStockItems(targetShopId)));
    }

    private Long resolveShopId(UserPrincipal user, Long paramShopId) {
        if (user.getRole() == Role.SUPER_ADMIN && paramShopId != null) {
            return paramShopId;
        }
        if (user.getShopId() != null) {
            return user.getShopId();
        }
        // Fallback for demo
        return 1L;
    }
}
