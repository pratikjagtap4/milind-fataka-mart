package com.fatakamart.domain.entity;

import com.fatakamart.domain.enums.CustomerTier;
import com.fatakamart.domain.enums.MarginAlert;
import com.fatakamart.domain.enums.OrderStatus;
import com.fatakamart.domain.enums.PaymentMethod;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bills")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bill_number", nullable = false, unique = true, length = 50)
    private String billNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(name = "customer_name", nullable = false, length = 150)
    private String customerName;

    @Column(name = "customer_mobile", nullable = false, length = 20)
    private String customerMobile;

    @Enumerated(EnumType.STRING)
    @Column(name = "customer_tier", nullable = false, length = 20)
    @Builder.Default
    private CustomerTier customerTier = CustomerTier.NORMAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    @Builder.Default
    private PaymentMethod paymentMethod = PaymentMethod.CASH;

    @Column(name = "overall_discount_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal overallDiscountPercentage = BigDecimal.ZERO;

    @Column(name = "subtotal_mrp", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal subtotalMrp = BigDecimal.ZERO;

    @Column(name = "total_discount_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalDiscountAmount = BigDecimal.ZERO;

    @Column(name = "total_savings_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalSavingsAmount = BigDecimal.ZERO;

    @Column(name = "final_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal finalAmount = BigDecimal.ZERO;

    // CONFIDENTIAL OWNER PROFIT & MARGIN FIELDS (Strictly omitted in Customer DTOs)
    @Column(name = "total_purchase_cost", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalPurchaseCost = BigDecimal.ZERO;

    @Column(name = "total_overhead_cost", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalOverheadCost = BigDecimal.ZERO;

    @Column(name = "profit_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal profitAmount = BigDecimal.ZERO;

    @Column(name = "profit_margin_percentage", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal profitMarginPercentage = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "margin_alert_level", nullable = false, length = 20)
    @Builder.Default
    private MarginAlert marginAlertLevel = MarginAlert.GREEN;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30)
    @Builder.Default
    private OrderStatus status = OrderStatus.COMPLETED;

    @Column(name = "festive_greeting")
    @Builder.Default
    private String festiveGreeting = "Happy Diwali! Thank you for celebrating with Fataka Mart!";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdByUser;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @OneToMany(mappedBy = "bill", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BillItem> items = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = OffsetDateTime.now();
        }
    }

    public void addItem(BillItem item) {
        items.add(item);
        item.setBill(this);
    }
}
