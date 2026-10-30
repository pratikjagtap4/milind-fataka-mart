package com.fatakamart.service.impl;

import com.fatakamart.domain.entity.*;
import com.fatakamart.domain.enums.CustomerTier;
import com.fatakamart.domain.enums.MarginAlert;
import com.fatakamart.domain.enums.OrderStatus;
import com.fatakamart.domain.enums.Role;
import com.fatakamart.dto.billing.*;
import com.fatakamart.repository.*;
import com.fatakamart.service.BillingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillingServiceImpl implements BillingService {

    private final BillRepository billRepository;
    private final BillItemRepository billItemRepository;
    private final ShopInventoryRepository shopInventoryRepository;
    private final CustomerRepository customerRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public MarginValidationResultDTO validateAndCalculateMargins(
            Long shopId, CustomerTier tier, List<BillItemRequest> items, BigDecimal overallDiscountPercentage) {

        if (items == null || items.isEmpty()) {
            return MarginValidationResultDTO.builder()
                    .subtotalMrp(BigDecimal.ZERO)
                    .totalSavingsAmount(BigDecimal.ZERO)
                    .finalAmount(BigDecimal.ZERO)
                    .totalOverheadCost(BigDecimal.ZERO)
                    .profitAmount(BigDecimal.ZERO)
                    .profitMarginPercentage(BigDecimal.ZERO)
                    .ratioToOverhead(BigDecimal.ZERO)
                    .alertLevel(MarginAlert.GREEN)
                    .isBelow50PercentProfit(false)
                    .isBelowRegularMarkup(false)
                    .itemAlerts(new ArrayList<>())
                    .build();
        }

        BigDecimal discountPct = overallDiscountPercentage != null ? overallDiscountPercentage : BigDecimal.ZERO;

        BigDecimal subtotalMrp = BigDecimal.ZERO;
        BigDecimal finalAmount = BigDecimal.ZERO;
        BigDecimal totalOverheadCost = BigDecimal.ZERO;

        List<ItemMarginAlertDTO> itemAlerts = new ArrayList<>();

        // Fetch inventories in batch
        List<Long> inventoryIds = items.stream().map(BillItemRequest::getShopInventoryId).collect(Collectors.toList());
        Map<Long, ShopInventory> inventoryMap = shopInventoryRepository.findAllById(inventoryIds).stream()
                .collect(Collectors.toMap(ShopInventory::getId, inv -> inv));

        for (BillItemRequest itemReq : items) {
            ShopInventory inv = inventoryMap.get(itemReq.getShopInventoryId());
            if (inv == null)
                continue;

            int qty = itemReq.getQuantity() != null && itemReq.getQuantity() > 0 ? itemReq.getQuantity() : 1;
            BigDecimal mrp = itemReq.getSellingPrice() != null ? itemReq.getSellingPrice() : inv.getSellingPrice();
            BigDecimal itemDiscount = itemReq.getDiscountPercentage() != null
                    && itemReq.getDiscountPercentage().compareTo(BigDecimal.ZERO) > 0
                            ? itemReq.getDiscountPercentage()
                            : discountPct;

            // Compute final rate
            BigDecimal finalRate = itemReq.getFinalRate();
            if (finalRate == null) {
                BigDecimal factor = BigDecimal.ONE
                        .subtract(itemDiscount.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
                finalRate = mrp.multiply(factor).setScale(2, RoundingMode.HALF_UP);
            }

            BigDecimal lineMrp = mrp.multiply(BigDecimal.valueOf(qty));
            BigDecimal lineTotal = finalRate.multiply(BigDecimal.valueOf(qty));
            BigDecimal lineOverhead = inv.getOverheadPrice().multiply(BigDecimal.valueOf(qty));

            subtotalMrp = subtotalMrp.add(lineMrp);
            finalAmount = finalAmount.add(lineTotal);
            totalOverheadCost = totalOverheadCost.add(lineOverhead);

            // Row-level checks
            BigDecimal ratio = BigDecimal.ZERO;
            if (inv.getOverheadPrice().compareTo(BigDecimal.ZERO) > 0) {
                ratio = finalRate.divide(inv.getOverheadPrice(), 2, RoundingMode.HALF_UP);
            }

            MarginAlert rowAlert = MarginAlert.GREEN;
            String rowMessage = "Margin OK";

            if (tier == CustomerTier.REGULAR) {
                // Regular customers: Warning if falls below 180% of Overhead Price
                if (ratio.compareTo(new BigDecimal("1.80")) < 0) {
                    rowAlert = MarginAlert.ORANGE;
                    BigDecimal suggested = inv.getOverheadPrice().multiply(new BigDecimal("1.85")).setScale(2,
                            RoundingMode.HALF_UP);
                    rowMessage = "Below 180% overhead markup! Suggested: ₹" + suggested;
                }
            } else if (tier == CustomerTier.CLOSE) {
                // Tier 1 Close customers: Alert only if below overhead cost (selling at a loss)
                if (ratio.compareTo(BigDecimal.ONE) < 0) {
                    rowAlert = MarginAlert.RED;
                    rowMessage = "Below overhead cost (selling at a loss)!";
                }
            } else {
                // Normal / other: Alert if below 150% of Overhead Price (< 50% profit)
                if (ratio.compareTo(new BigDecimal("1.50")) < 0) {
                    rowAlert = MarginAlert.RED;
                    rowMessage = "Below 150% overhead floor (< 50% profit)!";
                }
            }

            itemAlerts.add(ItemMarginAlertDTO.builder()
                    .shopInventoryId(inv.getId())
                    .productName(inv.getCustomName() != null ? inv.getCustomName() : inv.getBaseProduct().getName())
                    .overheadPrice(inv.getOverheadPrice())
                    .finalRate(finalRate)
                    .ratioToOverhead(ratio)
                    .rowAlertLevel(rowAlert)
                    .rowMessage(rowMessage)
                    .build());
        }

        BigDecimal totalSavings = subtotalMrp.subtract(finalAmount);
        BigDecimal profitAmount = finalAmount.subtract(totalOverheadCost);

        BigDecimal profitMarginPct = BigDecimal.ZERO;
        BigDecimal overallRatio = BigDecimal.ZERO;
        if (totalOverheadCost.compareTo(BigDecimal.ZERO) > 0) {
            profitMarginPct = profitAmount.multiply(new BigDecimal("100")).divide(totalOverheadCost, 2,
                    RoundingMode.HALF_UP);
            overallRatio = finalAmount.divide(totalOverheadCost, 2, RoundingMode.HALF_UP);
        }

        // Global Alert Level evaluation
        MarginAlert alertLevel = MarginAlert.GREEN;
        String bannerMessage = null;
        boolean belowCost = overallRatio.compareTo(BigDecimal.ONE) < 0;
        boolean below50 = overallRatio.compareTo(new BigDecimal("1.50")) < 0;
        boolean belowRegular = overallRatio.compareTo(new BigDecimal("1.80")) < 0;

        if (tier == CustomerTier.CLOSE) {
            if (belowCost) {
                alertLevel = MarginAlert.RED;
                bannerMessage = "Warning: Final price is below overhead cost (selling at a loss)!";
            }
        } else if (tier == CustomerTier.REGULAR) {
            if (belowCost) {
                alertLevel = MarginAlert.RED;
                bannerMessage = "Warning: Final price is below overhead cost!";
            } else if (belowRegular) {
                alertLevel = MarginAlert.ORANGE;
                bannerMessage = "Caution: Total bill is below 180% of overhead cost! Regular customer suggested markup is 85%.";
            }
        } else {
            // Normal customers
            if (below50) {
                alertLevel = MarginAlert.RED;
                bannerMessage = "Warning: Final price is below the 150% overhead threshold! Profit is less than 50% over costs.";
            }
        }

        return MarginValidationResultDTO.builder()
                .subtotalMrp(subtotalMrp)
                .totalSavingsAmount(totalSavings)
                .finalAmount(finalAmount)
                .totalOverheadCost(totalOverheadCost)
                .profitAmount(profitAmount)
                .profitMarginPercentage(profitMarginPct)
                .ratioToOverhead(overallRatio)
                .alertLevel(alertLevel)
                .alertBannerMessage(bannerMessage)
                .isBelow50PercentProfit(below50)
                .isBelowRegularMarkup(belowRegular)
                .itemAlerts(itemAlerts)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public TierPriceSuggestionDTO getTierPriceSuggestion(Long shopInventoryId, CustomerTier tier) {
        ShopInventory inv = shopInventoryRepository.findById(shopInventoryId)
                .orElseThrow(() -> new RuntimeException("Inventory not found with id: " + shopInventoryId));

        BigDecimal overheadPrice = inv.getOverheadPrice();
        BigDecimal mrp = inv.getSellingPrice();
        BigDecimal threshold = inv.getThresholdPrice(); // 1.50 * overhead

        BigDecimal suggestedRate;
        String explanation;

        if (tier == CustomerTier.CLOSE) {
            // Tier 3: Close (Friends & Family) -> 55% margin over Overhead Price (Overhead
            // * 1.55)
            suggestedRate = overheadPrice.multiply(new BigDecimal("1.55")).setScale(2, RoundingMode.HALF_UP);
            explanation = "Close Friends & Family: Target 55% margin over overhead (₹" + overheadPrice + " * 1.55)";
        } else if (tier == CustomerTier.REGULAR) {
            // Tier 2: Regular Customer -> 85% markup over Overhead Price (Overhead * 1.85)
            suggestedRate = overheadPrice.multiply(new BigDecimal("1.85")).setScale(2, RoundingMode.HALF_UP);
            explanation = "Regular Customer: Suggested 85% markup over overhead (₹" + overheadPrice + " * 1.85)";
        } else {
            // Tier 1: Normal Customer -> Default 20% discount on MRP or threshold
            suggestedRate = mrp.multiply(new BigDecimal("0.80")).setScale(2, RoundingMode.HALF_UP);
            if (suggestedRate.compareTo(threshold) < 0) {
                suggestedRate = threshold;
            }
            explanation = "Normal Walk-in: Standard 20% off MRP (Protected by 50% profit floor)";
        }

        BigDecimal discountPct = BigDecimal.ZERO;
        if (mrp.compareTo(BigDecimal.ZERO) > 0 && suggestedRate.compareTo(mrp) < 0) {
            discountPct = mrp.subtract(suggestedRate)
                    .multiply(new BigDecimal("100"))
                    .divide(mrp, 2, RoundingMode.HALF_UP);
        }

        return TierPriceSuggestionDTO.builder()
                .shopInventoryId(inv.getId())
                .productName(inv.getCustomName() != null ? inv.getCustomName() : inv.getBaseProduct().getName())
                .tier(tier)
                .overheadPrice(overheadPrice)
                .sellingPriceMrp(mrp)
                .suggestedRate(suggestedRate)
                .suggestedDiscountPercentage(discountPct)
                .minimumThresholdRate(threshold)
                .ruleExplanation(explanation)
                .build();
    }

    @Override
    @Transactional
    public BillResponseDTO generateBill(Long createdByUserId, BillCreateRequest request) {
        Shop shop = shopRepository.findById(Objects.requireNonNull(request.getShopId()))
                .orElseThrow(() -> new RuntimeException("Shop not found with id: " + request.getShopId()));

        User createdByUser = createdByUserId != null
                ? userRepository.findById(Objects.requireNonNull(createdByUserId)).orElse(null)
                : null;

        // Find or create customer
        Customer customer = null;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(Objects.requireNonNull(request.getCustomerId())).orElse(null);
        }
        if (customer == null && request.getCustomerMobile() != null) {
            var existing = customerRepository.findByShopIdAndMobileNumber(shop.getId(),
                    request.getCustomerMobile().trim());
            if (existing.isPresent()) {
                customer = existing.get();
            } else {
                customer = customerRepository.save(Customer.builder()
                        .shop(shop)
                        .fullName(request.getCustomerName().trim())
                        .mobileNumber(request.getCustomerMobile().trim())
                        .tier(request.getCustomerTier())
                        .totalPurchasesCount(0)
                        .totalSpent(BigDecimal.ZERO)
                        .build());
            }
        }

        // Generate sequential Bill Number: MFM-PUN01-2026-0001
        String branch = shop.getBranchCode().replaceAll("[^A-Za-z0-9]", "");
        int year = Year.now().getValue();
        long count = billRepository.count() + 1;
        String billNumber = String.format("MFM-%s-%d-%04d", branch, year, count);

        // Determine initial status: Customer online orders need owner review!
        OrderStatus orderStatus = request.getStatus();
        if (orderStatus == null) {
            if (createdByUser != null && createdByUser.getRole() == Role.CUSTOMER) {
                orderStatus = OrderStatus.PENDING_REVIEW;
            } else {
                orderStatus = OrderStatus.COMPLETED;
            }
        }

        Bill bill = Bill.builder()
                .billNumber(billNumber)
                .shop(shop)
                .customer(customer)
                .customerName(request.getCustomerName().trim())
                .customerMobile(request.getCustomerMobile().trim())
                .customerTier(request.getCustomerTier())
                .paymentMethod(request.getPaymentMethod())
                .overallDiscountPercentage(request.getOverallDiscountPercentage())
                .status(orderStatus)
                .festiveGreeting(request.getFestiveGreeting())
                .createdByUser(createdByUser)
                .createdAt(OffsetDateTime.now())
                .build();

        BigDecimal subtotalMrp = BigDecimal.ZERO;
        BigDecimal totalDiscountAmount = BigDecimal.ZERO;
        BigDecimal finalAmount = BigDecimal.ZERO;
        BigDecimal totalPurchaseCost = BigDecimal.ZERO;
        BigDecimal totalOverheadCost = BigDecimal.ZERO;

        List<BillItem> billItems = new ArrayList<>();
        List<BillItemResponseDTO> responseItems = new ArrayList<>();

        int srNo = 1;
        for (BillItemRequest itemReq : request.getItems()) {
            ShopInventory inv = shopInventoryRepository.findById(itemReq.getShopInventoryId())
                    .orElseThrow(() -> new RuntimeException("Inventory not found: " + itemReq.getShopInventoryId()));

            BaseProduct bp = inv.getBaseProduct();
            int qty = itemReq.getQuantity();

            // Stock check and decrement
            if (inv.getStockQuantity() < qty) {
                log.warn("Low stock alert for {}: Available {}, Requested {}", bp.getName(), inv.getStockQuantity(),
                        qty);
            }
            inv.setStockQuantity(Math.max(0, inv.getStockQuantity() - qty));
            shopInventoryRepository.save(inv);

            BigDecimal mrp = itemReq.getSellingPrice() != null ? itemReq.getSellingPrice() : inv.getSellingPrice();
            BigDecimal discountPct = itemReq.getDiscountPercentage() != null
                    && itemReq.getDiscountPercentage().compareTo(BigDecimal.ZERO) > 0
                            ? itemReq.getDiscountPercentage()
                            : request.getOverallDiscountPercentage();

            BigDecimal finalRate = itemReq.getFinalRate();
            if (finalRate == null) {
                BigDecimal factor = BigDecimal.ONE
                        .subtract(discountPct.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
                finalRate = mrp.multiply(factor).setScale(2, RoundingMode.HALF_UP);
            } else if (mrp.compareTo(BigDecimal.ZERO) > 0) {
                // If finalRate is provided directly, compute actual discount on MRP for customer invoice
                BigDecimal diff = mrp.subtract(finalRate);
                if (diff.compareTo(BigDecimal.ZERO) >= 0) {
                    discountPct = diff.multiply(new BigDecimal("100")).divide(mrp, 1, RoundingMode.HALF_UP);
                }
            }

            BigDecimal lineMrp = mrp.multiply(BigDecimal.valueOf(qty));
            BigDecimal lineTotal = finalRate.multiply(BigDecimal.valueOf(qty));
            BigDecimal linePurchase = inv.getPurchasePrice().multiply(BigDecimal.valueOf(qty));
            BigDecimal lineOverhead = inv.getOverheadPrice().multiply(BigDecimal.valueOf(qty));

            subtotalMrp = subtotalMrp.add(lineMrp);
            finalAmount = finalAmount.add(lineTotal);
            totalPurchaseCost = totalPurchaseCost.add(linePurchase);
            totalOverheadCost = totalOverheadCost.add(lineOverhead);

            BillItem billItem = BillItem.builder()
                    .bill(bill)
                    .shopInventory(inv)
                    .productName(inv.getCustomName() != null ? inv.getCustomName() : bp.getName())
                    .companyName(bp.getCompanyName())
                    .packDescription(bp.getPackDescription())
                    .purchasePrice(inv.getPurchasePrice())
                    .overheadPrice(inv.getOverheadPrice())
                    .overheadTotal(lineOverhead)
                    .sellingPrice(mrp)
                    .discountPercentage(discountPct)
                    .finalRate(finalRate)
                    .quantity(qty)
                    .lineTotal(lineTotal)
                    .build();

            billItems.add(billItem);

            // Customer facing item DTO
            responseItems.add(BillItemResponseDTO.builder()
                    .srNo(srNo++)
                    .id(null)
                    .shopInventoryId(inv.getId())
                    .productName(billItem.getProductName())
                    .companyName(bp.getCompanyName())
                    .packDescription(bp.getPackDescription())
                    .sellingPrice(mrp)
                    .discountPercentage(discountPct)
                    .finalRate(finalRate)
                    .quantity(qty)
                    .lineTotal(lineTotal)
                    .build());
        }

        BigDecimal totalSavings = subtotalMrp.subtract(finalAmount);
        totalDiscountAmount = totalSavings;
        BigDecimal profitAmount = finalAmount.subtract(totalOverheadCost);

        BigDecimal profitMarginPct = BigDecimal.ZERO;
        BigDecimal overallRatio = BigDecimal.ZERO;
        if (totalOverheadCost.compareTo(BigDecimal.ZERO) > 0) {
            profitMarginPct = profitAmount.multiply(new BigDecimal("100")).divide(totalOverheadCost, 2,
                    RoundingMode.HALF_UP);
            overallRatio = finalAmount.divide(totalOverheadCost, 2, RoundingMode.HALF_UP);
        }

        MarginAlert alertLevel = MarginAlert.GREEN;
        if (request.getCustomerTier() == CustomerTier.REGULAR && overallRatio.compareTo(new BigDecimal("1.80")) < 0) {
            alertLevel = MarginAlert.ORANGE;
        }
        if (overallRatio.compareTo(new BigDecimal("1.50")) < 0) {
            alertLevel = MarginAlert.RED;
        }

        bill.setSubtotalMrp(subtotalMrp);
        bill.setTotalDiscountAmount(totalDiscountAmount);
        bill.setTotalSavingsAmount(totalSavings);
        bill.setFinalAmount(finalAmount);
        bill.setTotalPurchaseCost(totalPurchaseCost);
        bill.setTotalOverheadCost(totalOverheadCost);
        bill.setProfitAmount(profitAmount);
        bill.setProfitMarginPercentage(profitMarginPct);
        bill.setMarginAlertLevel(alertLevel);
        bill.setItems(billItems);

        Bill savedBill = billRepository.save(bill);

        // Update Customer Loyalty Records
        if (customer != null) {
            customer.setTotalPurchasesCount(customer.getTotalPurchasesCount() + 1);
            customer.setTotalSpent(customer.getTotalSpent().add(finalAmount));
            customerRepository.save(customer);
        }

        // WhatsApp message preparation
        String cleanPhone = request.getCustomerMobile().replaceAll("[^0-9]", "");
        String waText = buildWhatsAppText(savedBill, shop);
        String waUrl = "https://wa.me/91" + cleanPhone + "?text=" + URLEncoder.encode(waText, StandardCharsets.UTF_8);

        return BillResponseDTO.builder()
                .id(savedBill.getId())
                .billNumber(savedBill.getBillNumber())
                .dateTime(savedBill.getCreatedAt())
                .shopId(shop.getId())
                .shopName(shop.getName())
                .shopAddress(shop.getAddress())
                .shopCity(shop.getCity())
                .contactPhone(shop.getContactPhone())
                .gstNumber(shop.getGstNumber())
                .customerId(customer != null ? customer.getId() : null)
                .customerName(savedBill.getCustomerName())
                .customerMobile(savedBill.getCustomerMobile())
                .customerTier(savedBill.getCustomerTier())
                .paymentMethod(savedBill.getPaymentMethod())
                .items(responseItems)
                .subtotalMrp(subtotalMrp)
                .overallDiscountPercentage(savedBill.getOverallDiscountPercentage())
                .totalDiscountAmount(totalDiscountAmount)
                .totalSavingsAmount(totalSavings)
                .finalAmount(finalAmount)
                .festiveGreeting(savedBill.getFestiveGreeting())
                .status(savedBill.getStatus())
                .whatsappShareUrl(waUrl)
                .whatsappMessageText(waText)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public BillResponseDTO getPublicBill(String billNumber) {
        Bill bill = billRepository.findByBillNumber(billNumber)
                .orElseThrow(() -> new RuntimeException("Bill not found: " + billNumber));
        return mapToPublicBillDTO(bill);
    }

    @Override
    @Transactional(readOnly = true)
    public OwnerBillDetailsDTO getOwnerBill(String billNumber) {
        Bill bill = billRepository.findByBillNumber(billNumber)
                .orElseThrow(() -> new RuntimeException("Bill not found: " + billNumber));

        BillResponseDTO publicPart = mapToPublicBillDTO(bill);

        List<OwnerBillItemBreakdownDTO> itemBreakdowns = bill.getItems().stream().map(item -> {
            BigDecimal profit = item.getLineTotal().subtract(item.getOverheadTotal());
            return OwnerBillItemBreakdownDTO.builder()
                    .id(item.getId())
                    .shopInventoryId(item.getShopInventory() != null ? item.getShopInventory().getId() : null)
                    .productName(item.getProductName())
                    .purchasePrice(item.getPurchasePrice())
                    .overheadPrice(item.getOverheadPrice())
                    .sellingPrice(item.getSellingPrice())
                    .discountPercentage(item.getDiscountPercentage())
                    .finalRate(item.getFinalRate())
                    .quantity(item.getQuantity())
                    .lineTotal(item.getLineTotal())
                    .overheadTotal(item.getOverheadTotal())
                    .lineProfit(profit)
                    .build();
        }).collect(Collectors.toList());

        String message = bill.getMarginAlertLevel() == MarginAlert.RED
                ? "Warning: Final price is below the 150% overhead threshold!"
                : (bill.getMarginAlertLevel() == MarginAlert.ORANGE ? "Below recommended regular markup"
                        : "Margin Healthy");

        return OwnerBillDetailsDTO.builder()
                .publicBill(publicPart)
                .totalPurchaseCost(bill.getTotalPurchaseCost())
                .totalOverheadCost(bill.getTotalOverheadCost())
                .profitAmount(bill.getProfitAmount())
                .profitMarginPercentage(bill.getProfitMarginPercentage())
                .marginAlertLevel(bill.getMarginAlertLevel())
                .marginAlertMessage(message)
                .itemBreakdowns(itemBreakdowns)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BillResponseDTO> getShopBills(Long shopId, OffsetDateTime startDate, OffsetDateTime endDate) {
        List<Bill> bills;
        if (shopId != null && shopId > 0) {
            if (startDate != null && endDate != null) {
                bills = billRepository.findByShopIdAndCreatedAtBetweenOrderByCreatedAtDesc(shopId, startDate, endDate);
            } else {
                bills = billRepository.findByShopIdOrderByCreatedAtDesc(shopId);
            }
        } else {
            if (startDate != null && endDate != null) {
                bills = billRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startDate, endDate);
            } else {
                bills = billRepository.findAllByOrderByCreatedAtDesc();
            }
        }
        return bills.stream().map(this::mapToPublicBillDTO).collect(Collectors.toList());
    }

    private BillResponseDTO mapToPublicBillDTO(Bill bill) {
        Shop shop = bill.getShop();

        List<BillItemResponseDTO> items = new ArrayList<>();
        int sr = 1;
        for (BillItem item : bill.getItems()) {
            items.add(BillItemResponseDTO.builder()
                    .srNo(sr++)
                    .id(item.getId())
                    .shopInventoryId(item.getShopInventory() != null ? item.getShopInventory().getId() : null)
                    .productName(item.getProductName())
                    .companyName(item.getCompanyName())
                    .packDescription(item.getPackDescription())
                    .sellingPrice(item.getSellingPrice())
                    .discountPercentage(item.getDiscountPercentage())
                    .finalRate(item.getFinalRate())
                    .quantity(item.getQuantity())
                    .lineTotal(item.getLineTotal())
                    .build());
        }

        String cleanPhone = bill.getCustomerMobile().replaceAll("[^0-9]", "");
        String waText = buildWhatsAppText(bill, shop);
        String waUrl = "https://wa.me/91" + cleanPhone + "?text=" + URLEncoder.encode(waText, StandardCharsets.UTF_8);

        return BillResponseDTO.builder()
                .id(bill.getId())
                .billNumber(bill.getBillNumber())
                .dateTime(bill.getCreatedAt())
                .shopId(shop.getId())
                .shopName(shop.getName())
                .shopAddress(shop.getAddress())
                .shopCity(shop.getCity())
                .contactPhone(shop.getContactPhone())
                .gstNumber(shop.getGstNumber())
                .customerId(bill.getCustomer() != null ? bill.getCustomer().getId() : null)
                .customerName(bill.getCustomerName())
                .customerMobile(bill.getCustomerMobile())
                .customerTier(bill.getCustomerTier())
                .paymentMethod(bill.getPaymentMethod())
                .items(items)
                .subtotalMrp(bill.getSubtotalMrp())
                .overallDiscountPercentage(bill.getOverallDiscountPercentage())
                .totalDiscountAmount(bill.getTotalDiscountAmount())
                .totalSavingsAmount(bill.getTotalSavingsAmount())
                .finalAmount(bill.getFinalAmount())
                .festiveGreeting(bill.getFestiveGreeting())
                .status(bill.getStatus() != null ? bill.getStatus() : OrderStatus.COMPLETED)
                .whatsappShareUrl(waUrl)
                .whatsappMessageText(waText)
                .build();
    }

    @Override
    @Transactional
    public BillResponseDTO updateOrderStatus(String billNumber, OrderStatus newStatus) {
        Bill bill = billRepository.findByBillNumber(billNumber)
                .orElseThrow(() -> new RuntimeException("Bill/Order not found: " + billNumber));
        bill.setStatus(newStatus);
        Bill saved = billRepository.save(bill);
        log.info("Updated order {} status to {}", billNumber, newStatus);
        return mapToPublicBillDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BillResponseDTO> getPendingOrders(Long shopId) {
        List<Bill> bills;
        if (shopId != null && shopId > 0) {
            bills = billRepository.findByShopIdAndStatusOrderByCreatedAtDesc(shopId, OrderStatus.PENDING_REVIEW);
        } else {
            bills = billRepository.findByStatusOrderByCreatedAtDesc(OrderStatus.PENDING_REVIEW);
        }
        return bills.stream().map(this::mapToPublicBillDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Long getPendingOrdersCount(Long shopId) {
        if (shopId != null && shopId > 0) {
            return billRepository.countByShopIdAndStatus(shopId, OrderStatus.PENDING_REVIEW);
        }
        return billRepository.countByStatus(OrderStatus.PENDING_REVIEW);
    }

    private String buildWhatsAppText(Bill bill, Shop shop) {
        return String.format(
                "✨ *%s* ✨\n" +
                        "📍 %s, %s\n" +
                        "📞 %s\n\n" +
                        "🧾 *Invoice No:* %s\n" +
                        "👤 *Customer:* %s\n" +
                        "💰 *Total MRP:* ₹%.2f\n" +
                        "🎉 *You Saved:* ₹%.2f\n" +
                        "✅ *Net Payable:* ₹%.2f\n\n" +
                        "🎆 *%s*\n" +
                        "Thank you for choosing Fataka Mart!",
                shop.getName(),
                shop.getAddress(),
                shop.getCity(),
                shop.getContactPhone(),
                bill.getBillNumber(),
                bill.getCustomerName(),
                bill.getSubtotalMrp(),
                bill.getTotalSavingsAmount(),
                bill.getFinalAmount(),
                bill.getFestiveGreeting());
    }
}
