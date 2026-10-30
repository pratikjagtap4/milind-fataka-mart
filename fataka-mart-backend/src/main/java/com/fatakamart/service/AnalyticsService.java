package com.fatakamart.service;

import com.fatakamart.dto.analytics.ShopDashboardDTO;
import com.fatakamart.dto.analytics.SuperAdminDashboardDTO;

public interface AnalyticsService {
    ShopDashboardDTO getShopDashboard(Long shopId);
    SuperAdminDashboardDTO getSuperAdminDashboard();
}
