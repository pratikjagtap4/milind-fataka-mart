package com.fatakamart.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "bill_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_id", nullable = false)
    private Bill bill;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_inventory_id")
    private ShopInventory shopInventory;

    @Column(name = "product_name", nullable = false, length = 200)
    private String productName;

    @Column(name = "company_name", length = 120)
    private String companyName;

    @Column(name = "pack_description", length = 100)
    private String packDescription;

    // CONFIDENTIAL OWNER COSTS (Omitted from Customer Invoice & DTOs)
    @Column(name = "purchase_price", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal purchasePrice = BigDecimal.ZERO;

    @Column(name = "overhead_price", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal overheadPrice = BigDecimal.ZERO;

    @Column(name = "overhead_total", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal overheadTotal = BigDecimal.ZERO;

    // CUSTOMER VISIBLE BILL FIELDS
    @Column(name = "selling_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal sellingPrice; // Line item MRP

    @Column(name = "discount_percentage", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal discountPercentage = BigDecimal.ZERO;

    @Column(name = "final_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal finalRate; // Price per item after discount

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal; // finalRate * quantity
}
