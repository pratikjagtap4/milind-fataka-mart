package com.fatakamart.service;

import com.fatakamart.dto.BaseProductDTO;
import com.fatakamart.dto.CreateBaseProductRequest;
import com.fatakamart.dto.CustomerProductDTO;

import java.util.List;

public interface ProductService {
    // Public Storefront (Sanitized DTOs)
    List<CustomerProductDTO> getPublicStorefrontProducts(Long shopId, Long categoryId, String search);
    CustomerProductDTO getPublicProductDetails(Long inventoryId);

    // Super Admin Master Catalog
    List<BaseProductDTO> getAllBaseProducts();
    List<BaseProductDTO> getBaseProductsByCategory(Long categoryId);
    BaseProductDTO getBaseProductById(Long id);
    BaseProductDTO createBaseProduct(CreateBaseProductRequest request);
    BaseProductDTO updateBaseProduct(Long id, CreateBaseProductRequest request);
    void deleteBaseProduct(Long id);
}
