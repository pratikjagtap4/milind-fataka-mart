package com.fatakamart.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Entity
@Table(
    name = "shop_inventories",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_shop_base_product", columnNames = {"shop_id", "base_product_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopInventory extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "base_product_id", nullable = false)
    private BaseProduct baseProduct;

    @Column(name = "custom_name", length = 200)
    private String customName;

    // STRICTLY CONFIDENTIAL - Never expose to public/customer DTOs
    @Column(name = "purchase_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "overhead_percentage", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal overheadPercentage = new BigDecimal("25.00");

    // STRICTLY CONFIDENTIAL - Overhead Price = Purchase + (Purchase * Overhead% / 100)
    @Column(name = "overhead_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal overheadPrice;

    // Selling Price (M.R.P.) - Visible to customers
    @Column(name = "selling_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal sellingPrice;

    // Threshold Price - Floor price to protect >= 50% profit over Overhead Price (Overhead Price * 1.50)
    @Column(name = "threshold_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal thresholdPrice;

    @Column(name = "stock_quantity", nullable = false)
    @Builder.Default
    private Integer stockQuantity = 0;

    @Column(name = "low_stock_threshold", nullable = false)
    @Builder.Default
    private Integer lowStockThreshold = 10;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /**
     * Calculates Overhead Price and Minimum 50% Threshold Price automatically.
     */
    public void calculatePricingRules() {
        if (this.purchasePrice != null && this.overheadPercentage != null) {
            // overheadPrice = purchasePrice + (purchasePrice * overheadPercentage / 100)
            BigDecimal overheadAmount = this.purchasePrice
                    .multiply(this.overheadPercentage)
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            this.overheadPrice = this.purchasePrice.add(overheadAmount).setScale(2, RoundingMode.HALF_UP);
            
            // thresholdPrice = overheadPrice * 1.50 (50% profit over overhead cost)
            this.thresholdPrice = this.overheadPrice.multiply(new BigDecimal("1.50")).setScale(2, RoundingMode.HALF_UP);
        }
    }

    @PrePersist
    @Override
    protected void onCreate() {
        super.onCreate();
        calculatePricingRules();
    }

    @PreUpdate
    @Override
    protected void onUpdate() {
        super.onUpdate();
        calculatePricingRules();
    }
}
