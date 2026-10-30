package com.fatakamart.service.impl;

import com.fatakamart.domain.entity.Shop;
import com.fatakamart.domain.entity.User;
import com.fatakamart.domain.enums.Role;
import com.fatakamart.dto.analytics.*;
import com.fatakamart.repository.*;
import com.fatakamart.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final BillRepository billRepository;
    private final BillItemRepository billItemRepository;
    private final ShopRepository shopRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public ShopDashboardDTO getShopDashboard(Long shopId) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new RuntimeException("Shop not found with id: " + shopId));

        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime todayStart = now.truncatedTo(ChronoUnit.DAYS);
        OffsetDateTime weekStart = now.minusDays(7);
        OffsetDateTime monthStart = now.minusDays(30);

        BigDecimal todaySales = billRepository.sumRevenueSince(shopId, todayStart);
        BigDecimal weeklySales = billRepository.sumRevenueSince(shopId, weekStart);
        BigDecimal monthlySales = billRepository.sumRevenueSince(shopId, monthStart);

        BigDecimal todayProfit = billRepository.sumProfitSince(shopId, todayStart);
        BigDecimal weeklyProfit = billRepository.sumProfitSince(shopId, weekStart);
        BigDecimal monthlyProfit = billRepository.sumProfitSince(shopId, monthStart);

        Long todayBills = billRepository.countSalesSince(shopId, todayStart);
        Long totalBills = billRepository.countSalesSince(shopId, OffsetDateTime.MIN);
        Long totalCustomers = (long) customerRepository.findByShopId(shopId).size();

        // Top 5 Products
        List<Object[]> topProdRows = billItemRepository.findTopSellingProductsByShop(shopId);
        List<TopProductDTO> topProducts = new ArrayList<>();
        int count = 0;
        for (Object[] row : topProdRows) {
            if (count++ >= 5) break;
            topProducts.add(TopProductDTO.builder()
                    .productName((String) row[0])
                    .quantitySold(((Number) row[1]).longValue())
                    .totalRevenue((BigDecimal) row[2])
                    .build());
        }

        return ShopDashboardDTO.builder()
                .shopId(shop.getId())
                .shopName(shop.getName())
                .branchCode(shop.getBranchCode())
                .todaySales(todaySales)
                .weeklySales(weeklySales)
                .monthlySales(monthlySales)
                .todayProfit(todayProfit)
                .weeklyProfit(weeklyProfit)
                .monthlyProfit(monthlyProfit)
                .todayBillsCount(todayBills)
                .totalBillsCount(totalBills)
                .totalCustomersCount(totalCustomers)
                .topSellingProducts(topProducts)
                .categoryDistribution(new ArrayList<>())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public SuperAdminDashboardDTO getSuperAdminDashboard() {
        OffsetDateTime allTime = OffsetDateTime.MIN;
        BigDecimal totalRevenue = billRepository.sumTotalGlobalRevenueSince(allTime);
        long totalOrders = billRepository.count();
        long totalShops = shopRepository.count();
        long totalCustomers = customerRepository.count();

        List<ShopSalesSummaryDTO> shopSummaries = shopRepository.findAll().stream().map(shop -> {
            BigDecimal rev = billRepository.sumRevenueSince(shop.getId(), allTime);
            BigDecimal prof = billRepository.sumProfitSince(shop.getId(), allTime);
            Long orders = billRepository.countSalesSince(shop.getId(), allTime);

            User owner = userRepository.findByShopId(shop.getId()).stream()
                    .filter(u -> u.getRole() == Role.OWNER)
                    .findFirst()
                    .orElse(null);

            return ShopSalesSummaryDTO.builder()
                    .shopId(shop.getId())
                    .shopName(shop.getName())
                    .branchCode(shop.getBranchCode())
                    .city(shop.getCity())
                    .ownerName(owner != null ? owner.getFullName() : "Unassigned")
                    .totalRevenue(rev)
                    .totalProfit(prof)
                    .totalOrders(orders)
                    .isActive(shop.getIsActive())
                    .build();
        }).collect(Collectors.toList());

        BigDecimal totalGlobalProfit = shopSummaries.stream()
                .map(ShopSalesSummaryDTO::getTotalProfit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return SuperAdminDashboardDTO.builder()
                .totalGlobalRevenue(totalRevenue)
                .totalGlobalProfit(totalGlobalProfit)
                .totalOrdersCount(totalOrders)
                .totalShopsCount(totalShops)
                .totalCustomersCount(totalCustomers)
                .shopComparisons(shopSummaries)
                .build();
    }
}
