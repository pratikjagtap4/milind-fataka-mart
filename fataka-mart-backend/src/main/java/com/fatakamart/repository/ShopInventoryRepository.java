package com.fatakamart.repository;

import com.fatakamart.domain.entity.ShopInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShopInventoryRepository extends JpaRepository<ShopInventory, Long> {

    List<ShopInventory> findByShopId(Long shopId);

    List<ShopInventory> findByShopIdAndIsActiveTrue(Long shopId);

    Optional<ShopInventory> findByShopIdAndBaseProductId(Long shopId, Long baseProductId);

    Boolean existsByShopIdAndBaseProductId(Long shopId, Long baseProductId);

    @Query("SELECT si FROM ShopInventory si " +
           "JOIN FETCH si.baseProduct bp " +
           "JOIN FETCH bp.category c " +
           "WHERE si.shop.id = :shopId AND c.id = :categoryId AND si.isActive = true")
    List<ShopInventory> findByShopIdAndCategoryId(@Param("shopId") Long shopId, @Param("categoryId") Long categoryId);

    @Query("SELECT si FROM ShopInventory si " +
           "JOIN FETCH si.baseProduct bp " +
           "WHERE si.shop.id = :shopId AND si.stockQuantity <= si.lowStockThreshold AND si.isActive = true")
    List<ShopInventory> findLowStockItems(@Param("shopId") Long shopId);

    @Query("SELECT si FROM ShopInventory si " +
           "JOIN FETCH si.baseProduct bp " +
           "WHERE si.shop.id = :shopId AND si.isActive = true AND " +
           "(LOWER(bp.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(bp.companyName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(si.customName) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<ShopInventory> searchInventory(@Param("shopId") Long shopId, @Param("query") String query);
}
