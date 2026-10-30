package com.fatakamart.service.impl;

import com.fatakamart.domain.entity.BaseProduct;
import com.fatakamart.domain.entity.Category;
import com.fatakamart.domain.entity.Shop;
import com.fatakamart.domain.entity.ShopInventory;
import com.fatakamart.dto.BaseProductDTO;
import com.fatakamart.dto.CreateBaseProductRequest;
import com.fatakamart.dto.CustomerProductDTO;
import com.fatakamart.repository.BaseProductRepository;
import com.fatakamart.repository.CategoryRepository;
import com.fatakamart.repository.ShopInventoryRepository;
import com.fatakamart.repository.ShopRepository;
import com.fatakamart.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final BaseProductRepository baseProductRepository;
    private final CategoryRepository categoryRepository;
    private final ShopInventoryRepository shopInventoryRepository;
    private final ShopRepository shopRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CustomerProductDTO> getPublicStorefrontProducts(Long shopId, Long categoryId, String search) {
        // If shopId is null, pick first active shop or fallback
        Long targetShopId = shopId;
        if (targetShopId == null) {
            targetShopId = shopRepository.findByIsActiveTrue().stream()
                    .map(Shop::getId)
                    .findFirst()
                    .orElse(1L);
        }

        List<ShopInventory> inventories;

        if (categoryId != null && categoryId > 0) {
            inventories = shopInventoryRepository.findByShopIdAndCategoryId(targetShopId, categoryId);
        } else if (search != null && !search.trim().isBlank()) {
            inventories = shopInventoryRepository.searchInventory(targetShopId, search.trim());
        } else {
            inventories = shopInventoryRepository.findByShopIdAndIsActiveTrue(targetShopId);
        }

        return inventories.stream()
                .map(this::mapToCustomerProductDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerProductDTO getPublicProductDetails(Long inventoryId) {
        ShopInventory inventory = shopInventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new RuntimeException("Product not found in shop inventory: " + inventoryId));

        return mapToCustomerProductDTO(inventory);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BaseProductDTO> getAllBaseProducts() {
        return baseProductRepository.findAll().stream()
                .map(this::mapToBaseProductDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BaseProductDTO> getBaseProductsByCategory(Long categoryId) {
        return baseProductRepository.findByCategoryIdAndIsActiveTrue(categoryId).stream()
                .map(this::mapToBaseProductDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BaseProductDTO getBaseProductById(Long id) {
        BaseProduct bp = baseProductRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Base product not found with id: " + id));
        return mapToBaseProductDTO(bp);
    }

    @Override
    @Transactional
    public BaseProductDTO createBaseProduct(CreateBaseProductRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + request.getCategoryId()));

        BaseProduct baseProduct = BaseProduct.builder()
                .category(category)
                .name(request.getName().trim())
                .companyName(request.getCompanyName().trim())
                .packDescription(request.getPackDescription().trim())
                .defaultPurchasePrice(request.getDefaultPurchasePrice())
                .defaultSellingPrice(request.getDefaultSellingPrice())
                .imageUrl1(request.getImageUrl1())
                .imageUrl2(request.getImageUrl2())
                .imageUrl3(request.getImageUrl3())
                .safetyInstructions(request.getSafetyInstructions())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        return mapToBaseProductDTO(baseProductRepository.save(baseProduct));
    }

    @Override
    @Transactional
    public BaseProductDTO updateBaseProduct(Long id, CreateBaseProductRequest request) {
        BaseProduct bp = baseProductRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Base product not found with id: " + id));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + request.getCategoryId()));

        bp.setCategory(category);
        bp.setName(request.getName().trim());
        bp.setCompanyName(request.getCompanyName().trim());
        bp.setPackDescription(request.getPackDescription().trim());
        bp.setDefaultPurchasePrice(request.getDefaultPurchasePrice());
        bp.setDefaultSellingPrice(request.getDefaultSellingPrice());
        bp.setImageUrl1(request.getImageUrl1());
        bp.setImageUrl2(request.getImageUrl2());
        bp.setImageUrl3(request.getImageUrl3());
        bp.setSafetyInstructions(request.getSafetyInstructions());
        if (request.getIsActive() != null) {
            bp.setIsActive(request.getIsActive());
        }

        return mapToBaseProductDTO(baseProductRepository.save(bp));
    }

    @Override
    @Transactional
    public void deleteBaseProduct(Long id) {
        BaseProduct bp = baseProductRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Base product not found with id: " + id));
        bp.setIsActive(false);
        baseProductRepository.save(bp);
    }

    /**
     * Maps ShopInventory to CustomerProductDTO.
     * STRICT AUDIT: purchasePrice and overheadPrice are explicitly excluded!
     */
    private CustomerProductDTO mapToCustomerProductDTO(ShopInventory inventory) {
        BaseProduct bp = inventory.getBaseProduct();
        Category cat = bp.getCategory();

        List<String> imageList = new ArrayList<>();
        if (bp.getImageUrl1() != null && !bp.getImageUrl1().isBlank()) imageList.add(bp.getImageUrl1());
        if (bp.getImageUrl2() != null && !bp.getImageUrl2().isBlank()) imageList.add(bp.getImageUrl2());
        if (bp.getImageUrl3() != null && !bp.getImageUrl3().isBlank()) imageList.add(bp.getImageUrl3());
        if (imageList.isEmpty() && cat.getImageUrl() != null) imageList.add(cat.getImageUrl());

        // Default storefront festive discount (e.g. 10% off MRP for walk-ins online)
        BigDecimal mrp = inventory.getSellingPrice();
        BigDecimal defaultDiscountPct = new BigDecimal("10.00");
        BigDecimal discountFactor = BigDecimal.ONE.subtract(defaultDiscountPct.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
        BigDecimal discountedPrice = mrp.multiply(discountFactor).setScale(2, RoundingMode.HALF_UP);

        return CustomerProductDTO.builder()
                .id(inventory.getId())
                .baseProductId(bp.getId())
                .shopId(inventory.getShop().getId())
                .shopName(inventory.getShop().getName())
                .name(inventory.getCustomName() != null ? inventory.getCustomName() : bp.getName())
                .companyName(bp.getCompanyName())
                .packDescription(bp.getPackDescription())
                .categoryId(cat.getId())
                .categoryName(cat.getName())
                .categorySlug(cat.getSlug())
                .mrp(mrp)
                .discountedPrice(discountedPrice)
                .discountPercentage(defaultDiscountPct)
                .imageUrl1(bp.getImageUrl1())
                .imageUrl2(bp.getImageUrl2())
                .imageUrl3(bp.getImageUrl3())
                .images(imageList)
                .safetyInstructions(bp.getSafetyInstructions())
                .inStock(inventory.getStockQuantity() > 0)
                .availableStock(inventory.getStockQuantity())
                .build();
    }

    private BaseProductDTO mapToBaseProductDTO(BaseProduct entity) {
        return BaseProductDTO.builder()
                .id(entity.getId())
                .categoryId(entity.getCategory().getId())
                .categoryName(entity.getCategory().getName())
                .name(entity.getName())
                .companyName(entity.getCompanyName())
                .packDescription(entity.getPackDescription())
                .defaultPurchasePrice(entity.getDefaultPurchasePrice())
                .defaultSellingPrice(entity.getDefaultSellingPrice())
                .imageUrl1(entity.getImageUrl1())
                .imageUrl2(entity.getImageUrl2())
                .imageUrl3(entity.getImageUrl3())
                .safetyInstructions(entity.getSafetyInstructions())
                .isActive(entity.getIsActive())
                .build();
    }
}
