package com.fatakamart.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(
    name = "base_products",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_base_product_name_company", columnNames = {"name", "company_name"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BaseProduct extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "company_name", nullable = false, length = 120)
    private String companyName;

    @Column(name = "pack_description", nullable = false, length = 100)
    private String packDescription;

    @Column(name = "default_purchase_price", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal defaultPurchasePrice = BigDecimal.ZERO;

    @Column(name = "default_selling_price", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal defaultSellingPrice = BigDecimal.ZERO;

    @Column(name = "image_url_1", columnDefinition = "TEXT")
    private String imageUrl1;

    @Column(name = "image_url_2", columnDefinition = "TEXT")
    private String imageUrl2;

    @Column(name = "image_url_3", columnDefinition = "TEXT")
    private String imageUrl3;

    @Column(name = "safety_instructions", columnDefinition = "TEXT")
    private String safetyInstructions;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
