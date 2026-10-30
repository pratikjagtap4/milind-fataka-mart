package com.fatakamart.controller;

import com.fatakamart.dto.*;
import com.fatakamart.payload.ApiResponse;
import com.fatakamart.payload.UserDto;
import com.fatakamart.service.CategoryService;
import com.fatakamart.service.ProductService;
import com.fatakamart.service.ShopService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasAnyRole('OWNER', 'SUPER_ADMIN')")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Master Management & Catalog", description = "Endpoints for managing sibling shops, user roles, master catalog, and global base products")
public class AdminCatalogController {

    private final ShopService shopService;
    private final CategoryService categoryService;
    private final ProductService productService;

    // --- SHOPS (Super Admin Only for creating/updating sibling branches) ---
    @GetMapping("/shops")
    @Operation(summary = "List all sibling shops")
    public ResponseEntity<ApiResponse<List<ShopDTO>>> getAllShops() {
        return ResponseEntity.ok(ApiResponse.ok(shopService.getAllShopsAdmin()));
    }

    @PostMapping("/shops")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Create a new sibling shop")
    public ResponseEntity<ApiResponse<ShopDTO>> createShop(@Valid @RequestBody CreateShopRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Shop created successfully", shopService.createShop(request)));
    }

    @PutMapping("/shops/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Update shop branch details")
    public ResponseEntity<ApiResponse<ShopDTO>> updateShop(
            @PathVariable Long id,
            @Valid @RequestBody CreateShopRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Shop updated successfully", shopService.updateShop(id, request)));
    }

    // --- USER PROMOTION & SHOP ASSIGNMENT ---
    @PostMapping("/users/assign-shop")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Assign user to a shop and promote role (e.g., CUSTOMER to OWNER)")
    public ResponseEntity<ApiResponse<UserDto>> assignUserToShop(@Valid @RequestBody AssignUserShopRequest request) {
        UserDto updated = shopService.assignUserToShopAndRole(request);
        return ResponseEntity.ok(ApiResponse.ok("User promoted and assigned to shop successfully", updated));
    }

    // --- MASTER CATEGORIES ---
    @GetMapping("/categories")
    @Operation(summary = "List all categories for management")
    public ResponseEntity<ApiResponse<List<CategoryDTO>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.getAllCategoriesAdmin()));
    }

    @PostMapping("/categories")
    @Operation(summary = "Create a new festival category")
    public ResponseEntity<ApiResponse<CategoryDTO>> createCategory(@Valid @RequestBody CategoryDTO categoryDTO) {
        return ResponseEntity.ok(ApiResponse.ok("Category created successfully", categoryService.createCategory(categoryDTO)));
    }

    @PutMapping("/categories/{id}")
    @Operation(summary = "Update an existing category")
    public ResponseEntity<ApiResponse<CategoryDTO>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryDTO categoryDTO) {
        return ResponseEntity.ok(ApiResponse.ok("Category updated successfully", categoryService.updateCategory(id, categoryDTO)));
    }

    @DeleteMapping("/categories/{id}")
    @Operation(summary = "Deactivate/delete category")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.ok("Category deactivated successfully", null));
    }

    // --- GLOBAL MASTER PRODUCTS ---
    @GetMapping("/base-products")
    @Operation(summary = "List all global master base products")
    public ResponseEntity<ApiResponse<List<BaseProductDTO>>> getAllBaseProducts() {
        return ResponseEntity.ok(ApiResponse.ok(productService.getAllBaseProducts()));
    }

    @PostMapping("/base-products")
    @Operation(summary = "Create a new global master base product")
    public ResponseEntity<ApiResponse<BaseProductDTO>> createBaseProduct(@Valid @RequestBody CreateBaseProductRequest request) {
        BaseProductDTO created = productService.createBaseProduct(request);
        return ResponseEntity.ok(ApiResponse.ok("Base product created successfully in master catalog", created));
    }

    @PutMapping("/base-products/{id}")
    @Operation(summary = "Update an existing master base product")
    public ResponseEntity<ApiResponse<BaseProductDTO>> updateBaseProduct(
            @PathVariable Long id,
            @Valid @RequestBody CreateBaseProductRequest request) {
        BaseProductDTO updated = productService.updateBaseProduct(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Base product updated successfully", updated));
    }

    @DeleteMapping("/base-products/{id}")
    @Operation(summary = "Deactivate/delete master base product")
    public ResponseEntity<ApiResponse<Void>> deleteBaseProduct(@PathVariable Long id) {
        productService.deleteBaseProduct(id);
        return ResponseEntity.ok(ApiResponse.ok("Base product deactivated successfully", null));
    }
}
