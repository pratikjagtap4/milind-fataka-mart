package com.fatakamart.domain.entity;

import com.fatakamart.domain.enums.CustomerTier;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(
    name = "customers",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_customer_shop_mobile", columnNames = {"shop_id", "mobile_number"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id")
    private Shop shop;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "mobile_number", nullable = false, length = 20)
    private String mobileNumber;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "referred_by", length = 150)
    private String referredBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private CustomerTier tier = CustomerTier.NORMAL;

    @Column(name = "total_purchases_count", nullable = false)
    @Builder.Default
    private Integer totalPurchasesCount = 0;

    @Column(name = "total_spent", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalSpent = BigDecimal.ZERO;

    @Column(name = "outstanding_balance", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal outstandingBalance = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
