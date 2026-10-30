package com.fatakamart.controller;

import com.fatakamart.domain.enums.Role;
import com.fatakamart.dto.analytics.ShopDashboardDTO;
import com.fatakamart.dto.analytics.SuperAdminDashboardDTO;
import com.fatakamart.payload.ApiResponse;
import com.fatakamart.security.UserPrincipal;
import com.fatakamart.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Analytics & Sales Dashboards", description = "Endpoints for Shop Owner dashboards and Super Admin multi-shop analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/shop-dashboard")
    @PreAuthorize("hasAnyRole('OWNER', 'SUPER_ADMIN')")
    @Operation(summary = "Get Shop Owner sales metrics (Today, Weekly, Monthly sales, Top 5 Products)")
    public ResponseEntity<ApiResponse<ShopDashboardDTO>> getShopDashboard(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) Long shopId) {

        Long targetShopId = resolveShopId(user, shopId);
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getShopDashboard(targetShopId)));
    }

    @GetMapping("/master-dashboard")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Get Super Admin master analytics (Cross-shop comparison, total revenue)")
    public ResponseEntity<ApiResponse<SuperAdminDashboardDTO>> getMasterDashboard() {
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getSuperAdminDashboard()));
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
