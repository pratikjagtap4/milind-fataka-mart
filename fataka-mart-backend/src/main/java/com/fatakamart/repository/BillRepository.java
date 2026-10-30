package com.fatakamart.repository;

import com.fatakamart.domain.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {

    Optional<Bill> findByBillNumber(String billNumber);

    List<Bill> findByShopIdOrderByCreatedAtDesc(Long shopId);

    List<Bill> findByShopIdAndCreatedAtBetweenOrderByCreatedAtDesc(
            Long shopId, OffsetDateTime startDate, OffsetDateTime endDate);

    List<Bill> findByCreatedAtBetweenOrderByCreatedAtDesc(
            OffsetDateTime startDate, OffsetDateTime endDate);

    List<Bill> findAllByOrderByCreatedAtDesc();

    List<Bill> findByStatusOrderByCreatedAtDesc(com.fatakamart.domain.enums.OrderStatus status);

    List<Bill> findByShopIdAndStatusOrderByCreatedAtDesc(Long shopId, com.fatakamart.domain.enums.OrderStatus status);

    Long countByStatus(com.fatakamart.domain.enums.OrderStatus status);

    Long countByShopIdAndStatus(Long shopId, com.fatakamart.domain.enums.OrderStatus status);

    boolean existsByCustomerId(Long customerId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Bill b SET b.customer = NULL WHERE b.customer.id = :customerId")
    void detachCustomerFromBills(@Param("customerId") Long customerId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Bill b SET b.createdByUser = :targetUser WHERE b.createdByUser.id = :oldUserId")
    void reassignBillsUser(@Param("oldUserId") Long oldUserId, @Param("targetUser") com.fatakamart.domain.entity.User targetUser);

    @Query("SELECT COUNT(b) FROM Bill b WHERE b.shop.id = :shopId AND b.createdAt >= :since")
    Long countSalesSince(@Param("shopId") Long shopId, @Param("since") OffsetDateTime since);

    @Query("SELECT COALESCE(SUM(b.finalAmount), 0) FROM Bill b WHERE b.shop.id = :shopId AND b.createdAt >= :since")
    BigDecimal sumRevenueSince(@Param("shopId") Long shopId, @Param("since") OffsetDateTime since);

    @Query("SELECT COALESCE(SUM(b.profitAmount), 0) FROM Bill b WHERE b.shop.id = :shopId AND b.createdAt >= :since")
    BigDecimal sumProfitSince(@Param("shopId") Long shopId, @Param("since") OffsetDateTime since);

    @Query("SELECT COALESCE(SUM(b.finalAmount), 0) FROM Bill b WHERE b.createdAt >= :since")
    BigDecimal sumTotalGlobalRevenueSince(@Param("since") OffsetDateTime since);
}
