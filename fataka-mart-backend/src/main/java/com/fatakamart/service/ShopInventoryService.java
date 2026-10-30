package com.fatakamart.service;

import com.fatakamart.dto.ImportProductRequest;
import com.fatakamart.dto.OwnerInventoryDTO;
import com.fatakamart.dto.UpdateShopInventoryRequest;

import java.util.List;

public interface ShopInventoryService {
    List<OwnerInventoryDTO> getShopInventory(Long shopId, Long categoryId, String search);
    OwnerInventoryDTO getInventoryItem(Long inventoryId);
    OwnerInventoryDTO importBaseProduct(ImportProductRequest request);
    OwnerInventoryDTO quickCreateProduct(com.fatakamart.dto.QuickCreateProductRequest request);
    OwnerInventoryDTO updateInventoryPricingAndStock(Long inventoryId, UpdateShopInventoryRequest request);
    List<OwnerInventoryDTO> getLowStockItems(Long shopId);
    int syncInventoryToAllShops(Long sourceShopId, Long targetShopId);
    void deleteInventoryItem(Long inventoryId);
}
