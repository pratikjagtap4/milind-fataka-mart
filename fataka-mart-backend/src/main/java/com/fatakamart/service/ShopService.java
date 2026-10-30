package com.fatakamart.service;

import com.fatakamart.dto.AssignUserShopRequest;
import com.fatakamart.dto.CreateShopRequest;
import com.fatakamart.dto.ShopDTO;
import com.fatakamart.payload.UserDto;

import java.util.List;

public interface ShopService {
    List<ShopDTO> getAllActiveShops();
    List<ShopDTO> getAllShopsAdmin();
    ShopDTO getShopById(Long id);
    ShopDTO createShop(CreateShopRequest request);
    ShopDTO updateShop(Long id, CreateShopRequest request);
    UserDto assignUserToShopAndRole(AssignUserShopRequest request);
}
