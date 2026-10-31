package com.fatakamart.service.impl;

import com.fatakamart.domain.entity.BaseProduct;
import com.fatakamart.domain.entity.Category;
import com.fatakamart.domain.entity.Shop;
import com.fatakamart.domain.entity.ShopInventory;
import com.fatakamart.dto.ImportProductRequest;
import com.fatakamart.dto.OwnerInventoryDTO;
import com.fatakamart.dto.QuickCreateProductRequest;
import com.fatakamart.dto.UpdateShopInventoryRequest;
import com.fatakamart.repository.BaseProductRepository;
import com.fatakamart.repository.CategoryRepository;
import com.fatakamart.repository.ShopInventoryRepository;
import com.fatakamart.repository.ShopRepository;
import com.fatakamart.service.ShopInventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShopInventoryServiceImpl implements ShopInventoryService {

    private final ShopInventoryRepository shopInventoryRepository;
    private final ShopRepository shopRepository;
    private final BaseProductRepository baseProductRepository;
    private final CategoryRepository categoryRepository;
    private final com.fatakamart.repository.BillItemRepository billItemRepository;

    @Override
    @Transactional(readOnly = true)
    public List<OwnerInventoryDTO> getShopInventory(Long shopId, Long categoryId, String search) {
        List<ShopInventory> inventories;

        if (categoryId != null && categoryId > 0) {
            inventories = shopInventoryRepository.findByShopIdAndCategoryId(shopId, categoryId);
        } else if (search != null && !search.trim().isBlank()) {
            inventories = shopInventoryRepository.searchInventory(shopId, search.trim());
        } else {
            inventories = shopInventoryRepository.findByShopIdAndIsActiveTrue(shopId);
        }

        return inventories.stream()
                .map(this::mapToOwnerDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OwnerInventoryDTO getInventoryItem(Long inventoryId) {
        ShopInventory inventory = shopInventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new RuntimeException("Inventory item not found with id: " + inventoryId));
        return mapToOwnerDTO(inventory);
    }

    @Override
    @Transactional
    public OwnerInventoryDTO importBaseProduct(ImportProductRequest request) {
        Shop shop = shopRepository.findById(request.getShopId())
                .orElseThrow(() -> new RuntimeException("Shop not found with id: " + request.getShopId()));

        BaseProduct baseProduct = baseProductRepository.findById(request.getBaseProductId())
                .orElseThrow(() -> new RuntimeException("Base product not found with id: " + request.getBaseProductId()));

        // Check if already imported
        if (shopInventoryRepository.existsByShopIdAndBaseProductId(shop.getId(), baseProduct.getId())) {
            throw new RuntimeException("Product '" + baseProduct.getName() + "' is already in your shop inventory!");
        }

        BigDecimal purchasePrice = request.getPurchasePrice() != null
                ? request.getPurchasePrice()
                : baseProduct.getDefaultPurchasePrice();

        BigDecimal overheadPct = request.getOverheadPercentage() != null
                ? request.getOverheadPercentage()
                : shop.getDefaultOverheadPercentage();

        BigDecimal sellingPrice = request.getSellingPrice() != null
                ? request.getSellingPrice()
                : baseProduct.getDefaultSellingPrice();

        int initialStock = request.getInitialStock() != null ? request.getInitialStock() : 0;
        int lowStock = request.getLowStockThreshold() != null ? request.getLowStockThreshold() : 10;

        ShopInventory inventory = ShopInventory.builder()
                .shop(shop)
                .baseProduct(baseProduct)
                .customName(baseProduct.getName())
                .purchasePrice(purchasePrice)
                .overheadPercentage(overheadPct)
                .sellingPrice(sellingPrice)
                .stockQuantity(initialStock)
                .lowStockThreshold(lowStock)
                .isActive(true)
                .build();

        // Calculate overhead price and 50% min threshold price automatically
        inventory.calculatePricingRules();

        return mapToOwnerDTO(shopInventoryRepository.save(inventory));
    }

    @Override
    @Transactional
    public OwnerInventoryDTO quickCreateProduct(QuickCreateProductRequest request) {
        Long shopId = java.util.Objects.requireNonNull(request.getShopId(), "Shop ID cannot be null");
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new RuntimeException("Shop not found with id: " + shopId));

        Long categoryId = java.util.Objects.requireNonNull(request.getCategoryId(), "Category ID cannot be null");
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));

        String prodName = request.getName() != null ? request.getName().trim() : "Custom Product";
        String compName = request.getCompanyName() != null ? request.getCompanyName().trim() : "Standard Fireworks";
        String packDesc = request.getPackDescription() != null ? request.getPackDescription().trim() : "1 Box";

        // Find existing master product or create new one
        BaseProduct baseProduct = baseProductRepository.findByNameIgnoreCaseAndCompanyNameIgnoreCase(prodName, compName)
                .orElse(null);

        if (baseProduct != null) {
            baseProduct.setCategory(category);
            baseProduct.setPackDescription(packDesc);
            baseProduct.setDefaultPurchasePrice(request.getPurchasePrice());
            baseProduct.setDefaultSellingPrice(request.getSellingPrice());
            if (request.getImageUrl1() != null && !request.getImageUrl1().isBlank()) {
                baseProduct.setImageUrl1(request.getImageUrl1());
            }
            if (request.getSafetyInstructions() != null) {
                baseProduct.setSafetyInstructions(request.getSafetyInstructions());
            }
            baseProduct.setIsActive(true);
            baseProduct = baseProductRepository.save(baseProduct);
        } else {
            baseProduct = BaseProduct.builder()
                    .category(category)
                    .name(prodName)
                    .companyName(compName)
                    .packDescription(packDesc)
                    .defaultPurchasePrice(request.getPurchasePrice())
                    .defaultSellingPrice(request.getSellingPrice())
                    .imageUrl1(request.getImageUrl1())
                    .safetyInstructions(request.getSafetyInstructions())
                    .isActive(true)
                    .build();
            baseProduct = baseProductRepository.save(baseProduct);
        }

        BigDecimal overheadPct = request.getOverheadPercentage() != null
                ? request.getOverheadPercentage()
                : shop.getDefaultOverheadPercentage();

        // Check if item already exists in this shop inventory
        final Long bpId = baseProduct.getId();
        ShopInventory inventory = shopInventoryRepository.findByShopIdAndBaseProductId(shop.getId(), bpId)
                .orElse(null);

        if (inventory != null) {
            inventory.setCustomName(baseProduct.getName());
            inventory.setPurchasePrice(request.getPurchasePrice());
            inventory.setOverheadPercentage(overheadPct);
            inventory.setSellingPrice(request.getSellingPrice());
            inventory.setStockQuantity(request.getStockQuantity() != null ? request.getStockQuantity() : inventory.getStockQuantity());
            inventory.setIsActive(true);
        } else {
            inventory = ShopInventory.builder()
                    .shop(shop)
                    .baseProduct(baseProduct)
                    .customName(baseProduct.getName())
                    .purchasePrice(request.getPurchasePrice())
                    .overheadPercentage(overheadPct)
                    .sellingPrice(request.getSellingPrice())
                    .stockQuantity(request.getStockQuantity() != null ? request.getStockQuantity() : 0)
                    .lowStockThreshold(10)
                    .isActive(true)
                    .build();
        }

        inventory.calculatePricingRules();
        OwnerInventoryDTO result = mapToOwnerDTO(shopInventoryRepository.save(inventory));

        // If applyToAllShops is true, assign/update in sibling branches too
        if (Boolean.TRUE.equals(request.getApplyToAllShops())) {
            List<Shop> allShops = shopRepository.findAll();
            for (Shop otherShop : allShops) {
                if (!otherShop.getId().equals(shop.getId()) && Boolean.TRUE.equals(otherShop.getIsActive())) {
                    BigDecimal otherOv = request.getOverheadPercentage() != null
                            ? request.getOverheadPercentage()
                            : otherShop.getDefaultOverheadPercentage();

                    ShopInventory otherInv = shopInventoryRepository.findByShopIdAndBaseProductId(otherShop.getId(), bpId)
                            .orElse(null);

                    if (otherInv != null) {
                        otherInv.setCustomName(baseProduct.getName());
                        otherInv.setPurchasePrice(request.getPurchasePrice());
                        otherInv.setOverheadPercentage(otherOv);
                        otherInv.setSellingPrice(request.getSellingPrice());
                        otherInv.setIsActive(true);
                    } else {
                        otherInv = ShopInventory.builder()
                                .shop(otherShop)
                                .baseProduct(baseProduct)
                                .customName(baseProduct.getName())
                                .purchasePrice(request.getPurchasePrice())
                                .overheadPercentage(otherOv)
                                .sellingPrice(request.getSellingPrice())
                                .stockQuantity(request.getStockQuantity() != null ? request.getStockQuantity() : 0)
                                .lowStockThreshold(10)
                                .isActive(true)
                                .build();
                    }

                    otherInv.calculatePricingRules();
                    shopInventoryRepository.save(otherInv);
                }
            }
        }

        return result;
    }

    @Override
    @Transactional
    public int syncInventoryToAllShops(Long sourceShopId, Long targetShopId) {
        Shop sourceShop = shopRepository.findById(sourceShopId)
                .orElseThrow(() -> new RuntimeException("Source shop not found with id: " + sourceShopId));

        List<ShopInventory> sourceItems = shopInventoryRepository.findByShopId(sourceShopId);
        List<Shop> targetShops;
        if (targetShopId != null) {
            targetShops = shopRepository.findAll().stream()
                    .filter(s -> s.getId().equals(targetShopId) && !s.getId().equals(sourceShopId) && Boolean.TRUE.equals(s.getIsActive()))
                    .toList();
        } else {
            targetShops = shopRepository.findAll().stream()
                    .filter(s -> !s.getId().equals(sourceShopId) && Boolean.TRUE.equals(s.getIsActive()))
                    .toList();
        }

        int syncedCount = 0;
        for (Shop targetShop : targetShops) {
            List<ShopInventory> targetItems = shopInventoryRepository.findByShopId(targetShop.getId());
            java.util.Set<Long> existingBaseProductIds = targetItems.stream()
                    .map(inv -> inv.getBaseProduct().getId())
                    .collect(java.util.stream.Collectors.toSet());

            for (ShopInventory src : sourceItems) {
                if (!existingBaseProductIds.contains(src.getBaseProduct().getId())) {
                    BigDecimal ov = src.getOverheadPercentage() != null
                            ? src.getOverheadPercentage()
                            : targetShop.getDefaultOverheadPercentage();

                    ShopInventory newInv = ShopInventory.builder()
                            .shop(targetShop)
                            .baseProduct(src.getBaseProduct())
                            .customName(src.getCustomName())
                            .purchasePrice(src.getPurchasePrice())
                            .overheadPercentage(ov)
                            .sellingPrice(src.getSellingPrice())
                            .stockQuantity(src.getStockQuantity())
                            .lowStockThreshold(src.getLowStockThreshold())
                            .isActive(true)
                            .build();
                    newInv.calculatePricingRules();
                    shopInventoryRepository.save(newInv);
                    syncedCount++;
                }
            }
        }

        return syncedCount;
    }

    @Override
    @Transactional
    public OwnerInventoryDTO updateInventoryPricingAndStock(Long inventoryId, UpdateShopInventoryRequest request) {
        ShopInventory inventory = shopInventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new RuntimeException("Inventory item not found with id: " + inventoryId));

        if (request.getCustomName() != null && !request.getCustomName().isBlank()) {
            inventory.setCustomName(request.getCustomName().trim());
        }

        inventory.setPurchasePrice(request.getPurchasePrice());
        inventory.setOverheadPercentage(request.getOverheadPercentage());
        inventory.setSellingPrice(request.getSellingPrice());
        inventory.setStockQuantity(request.getStockQuantity());

        if (request.getLowStockThreshold() != null) {
            inventory.setLowStockThreshold(request.getLowStockThreshold());
        }

        if (request.getIsActive() != null) {
            inventory.setIsActive(request.getIsActive());
        }

        // Auto-recalculate overhead price and 50% threshold floor
        inventory.calculatePricingRules();

        return mapToOwnerDTO(shopInventoryRepository.save(inventory));
    }

    @Override
    @Transactional(readOnly = true)
    public List<OwnerInventoryDTO> getLowStockItems(Long shopId) {
        return shopInventoryRepository.findLowStockItems(shopId).stream()
                .map(this::mapToOwnerDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteInventoryItem(Long inventoryId) {
        ShopInventory item = shopInventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new RuntimeException("Inventory item not found with id: " + inventoryId));

        boolean hasOrders = billItemRepository.existsByShopInventoryId(inventoryId);
        if (hasOrders) {
            // Soft delete/deactivate so existing customer orders and invoices remain 100% intact
            item.setIsActive(false);
            item.setStockQuantity(0);
            shopInventoryRepository.save(item);
        } else {
            shopInventoryRepository.delete(item);
        }
    }

    private OwnerInventoryDTO mapToOwnerDTO(ShopInventory inventory) {
        BaseProduct bp = inventory.getBaseProduct();

        BigDecimal overheadPrice = inventory.getOverheadPrice();
        BigDecimal sellingPrice = inventory.getSellingPrice();
        BigDecimal marginOverheadAmount = sellingPrice.subtract(overheadPrice);

        BigDecimal marginPercentage = BigDecimal.ZERO;
        if (overheadPrice.compareTo(BigDecimal.ZERO) > 0) {
            marginPercentage = marginOverheadAmount
                    .multiply(new BigDecimal("100"))
                    .divide(overheadPrice, 2, RoundingMode.HALF_UP);
        }

        boolean isLowStock = inventory.getStockQuantity() <= inventory.getLowStockThreshold();

        return OwnerInventoryDTO.builder()
                .id(inventory.getId())
                .shopId(inventory.getShop().getId())
                .shopName(inventory.getShop().getName())
                .baseProductId(bp.getId())
                .productName(inventory.getCustomName() != null ? inventory.getCustomName() : bp.getName())
                .customName(inventory.getCustomName())
                .companyName(bp.getCompanyName())
                .packDescription(bp.getPackDescription())
                .categoryId(bp.getCategory().getId())
                .categoryName(bp.getCategory().getName())
                .purchasePrice(inventory.getPurchasePrice())
                .overheadPercentage(inventory.getOverheadPercentage())
                .overheadPrice(overheadPrice)
                .sellingPrice(sellingPrice)
                .thresholdPrice(inventory.getThresholdPrice())
                .marginOverheadAmount(marginOverheadAmount)
                .marginPercentageOnOverhead(marginPercentage)
                .stockQuantity(inventory.getStockQuantity())
                .lowStockThreshold(inventory.getLowStockThreshold())
                .isLowStock(isLowStock)
                .isActive(inventory.getIsActive())
                .imageUrl(bp.getImageUrl1())
                .build();
    }
}
