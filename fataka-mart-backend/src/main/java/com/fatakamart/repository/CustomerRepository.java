package com.fatakamart.repository;

import com.fatakamart.domain.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByShopIdAndMobileNumber(Long shopId, String mobileNumber);

    Optional<Customer> findByMobileNumber(String mobileNumber);

    List<Customer> findByShopId(Long shopId);

    /**
     * Fast customer quick search for Speed Billing POS by Mobile, Name, or Referred By.
     */
    @Query("SELECT c FROM Customer c WHERE " +
           "(:shopId IS NULL OR c.shop.id = :shopId) AND (" +
           "c.mobileNumber LIKE CONCAT('%', :query, '%') OR " +
           "LOWER(c.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.referredBy) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Customer> quickSearch(@Param("shopId") Long shopId, @Param("query") String query);
}
