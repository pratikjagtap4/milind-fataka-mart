package com.fatakamart.repository;

import com.fatakamart.domain.entity.Shop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShopRepository extends JpaRepository<Shop, Long> {
    Optional<Shop> findByBranchCode(String branchCode);
    List<Shop> findByIsActiveTrue();
}
