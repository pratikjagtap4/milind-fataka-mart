package com.fatakamart.controller;

import com.fatakamart.dto.CategoryDTO;
import com.fatakamart.dto.CustomerProductDTO;
import com.fatakamart.dto.ShopDTO;
import com.fatakamart.payload.ApiResponse;
import com.fatakamart.service.CategoryService;
import com.fatakamart.service.ProductService;
import com.fatakamart.service.ShopService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
@Tag(name = "Public Festive Storefront", description = "Public guest/customer storefront catalog (strictly sanitized, zero cost margins leaked)")
public class PublicCatalogController {

    private final CategoryService categoryService;
    private final ProductService productService;
    private final ShopService shopService;
    private final com.fatakamart.service.BillingService billingService;

    @GetMapping("/shops")
    @Operation(summary = "Get list of active sibling shops for customer branch selection")
    public ResponseEntity<ApiResponse<List<ShopDTO>>> getActiveShops() {
        return ResponseEntity.ok(ApiResponse.ok(shopService.getAllActiveShops()));
    }

    @GetMapping("/categories")
    @Operation(summary = "Get active festive categories for category tiles")
    public ResponseEntity<ApiResponse<List<CategoryDTO>>> getActiveCategories() {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.getAllActiveCategories()));
    }

    @GetMapping("/categories/{slug}")
    @Operation(summary = "Get category details by slug")
    public ResponseEntity<ApiResponse<CategoryDTO>> getCategoryBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.getCategoryBySlug(slug)));
    }

    @GetMapping("/products")
    @Operation(summary = "Browse festive products by shop, category, or search term (Strictly sanitized CustomerProductDTO)")
    public ResponseEntity<ApiResponse<List<CustomerProductDTO>>> getProducts(
            @RequestParam(required = false) Long shopId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search) {

        List<CustomerProductDTO> products = productService.getPublicStorefrontProducts(shopId, categoryId, search);
        return ResponseEntity.ok(ApiResponse.ok(products));
    }

    @GetMapping("/products/{inventoryId}")
    @Operation(summary = "Get detailed product information, gallery, and safety instructions")
    public ResponseEntity<ApiResponse<CustomerProductDTO>> getProductDetails(@PathVariable Long inventoryId) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getPublicProductDetails(inventoryId)));
    }

    @GetMapping("/bills/{billNumber}")
    @Operation(summary = "Get customer bill invoice (Strictly sanitized, zero private costs exposed)")
    public ResponseEntity<ApiResponse<com.fatakamart.dto.billing.BillResponseDTO>> getPublicBill(@PathVariable String billNumber) {
        return ResponseEntity.ok(ApiResponse.ok(billingService.getPublicBill(billNumber)));
    }
}
