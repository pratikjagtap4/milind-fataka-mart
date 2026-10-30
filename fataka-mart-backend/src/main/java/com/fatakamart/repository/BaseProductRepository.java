package com.fatakamart.repository;

import com.fatakamart.domain.entity.BaseProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BaseProductRepository extends JpaRepository<BaseProduct, Long> {
    List<BaseProduct> findByCategoryIdAndIsActiveTrue(Long categoryId);
    List<BaseProduct> findByIsActiveTrue();
    List<BaseProduct> findByNameContainingIgnoreCaseOrCompanyNameContainingIgnoreCase(String name, String companyName);
}
