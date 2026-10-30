package com.fatakamart.repository;

import com.fatakamart.domain.entity.BillItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BillItemRepository extends JpaRepository<BillItem, Long> {

    List<BillItem> findByBillId(Long billId);

    boolean existsByShopInventoryId(Long shopInventoryId);

    /**
     * Top selling products by quantity in a shop
     */
    @Query("SELECT bi.productName, SUM(bi.quantity), SUM(bi.lineTotal) " +
           "FROM BillItem bi JOIN bi.bill b " +
           "WHERE b.shop.id = :shopId " +
           "GROUP BY bi.productName " +
           "ORDER BY SUM(bi.quantity) DESC")
    List<Object[]> findTopSellingProductsByShop(@Param("shopId") Long shopId);
}
