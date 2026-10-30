package com.fatakamart.service.impl;

import com.fatakamart.domain.entity.Shop;
import com.fatakamart.domain.entity.User;
import com.fatakamart.domain.enums.Role;
import com.fatakamart.dto.AssignUserShopRequest;
import com.fatakamart.dto.CreateShopRequest;
import com.fatakamart.dto.ShopDTO;
import com.fatakamart.payload.UserDto;
import com.fatakamart.repository.ShopInventoryRepository;
import com.fatakamart.repository.ShopRepository;
import com.fatakamart.repository.UserRepository;
import com.fatakamart.service.ShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShopServiceImpl implements ShopService {

    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final ShopInventoryRepository shopInventoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ShopDTO> getAllActiveShops() {
        return shopRepository.findByIsActiveTrue().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShopDTO> getAllShopsAdmin() {
        return shopRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ShopDTO getShopById(Long id) {
        Shop shop = shopRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shop not found with id: " + id));
        return mapToDTO(shop);
    }

    @Override
    @Transactional
    public ShopDTO createShop(CreateShopRequest request) {
        if (shopRepository.findByBranchCode(request.getBranchCode().trim()).isPresent()) {
            throw new RuntimeException("Shop branch code already exists: " + request.getBranchCode());
        }

        Shop shop = Shop.builder()
                .name(request.getName().trim())
                .branchCode(request.getBranchCode().trim().toUpperCase())
                .address(request.getAddress().trim())
                .city(request.getCity().trim())
                .state(request.getState() != null ? request.getState().trim() : "Maharashtra")
                .contactPhone(request.getContactPhone().trim())
                .defaultOverheadPercentage(request.getDefaultOverheadPercentage())
                .gstNumber(request.getGstNumber())
                .isActive(true)
                .build();

        Shop savedShop = shopRepository.save(shop);

        // If an initial owner was provided, assign them
        if (request.getOwnerUserId() != null) {
            User owner = userRepository.findById(request.getOwnerUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + request.getOwnerUserId()));
            owner.setShop(savedShop);
            owner.setRole(Role.OWNER);
            userRepository.save(owner);
        }

        return mapToDTO(savedShop);
    }

    @Override
    @Transactional
    public ShopDTO updateShop(Long id, CreateShopRequest request) {
        Shop shop = shopRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shop not found with id: " + id));

        shop.setName(request.getName().trim());
        shop.setAddress(request.getAddress().trim());
        shop.setCity(request.getCity().trim());
        if (request.getState() != null) {
            shop.setState(request.getState().trim());
        }
        shop.setContactPhone(request.getContactPhone().trim());
        shop.setDefaultOverheadPercentage(request.getDefaultOverheadPercentage());
        shop.setGstNumber(request.getGstNumber());

        return mapToDTO(shopRepository.save(shop));
    }

    @Override
    @Transactional
    public UserDto assignUserToShopAndRole(AssignUserShopRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + request.getUserId()));

        Shop shop = shopRepository.findById(request.getShopId())
                .orElseThrow(() -> new RuntimeException("Shop not found with id: " + request.getShopId()));

        user.setShop(shop);
        user.setRole(request.getTargetRole());
        User updated = userRepository.save(user);

        return UserDto.builder()
                .id(updated.getId())
                .email(updated.getEmail())
                .fullName(updated.getFullName())
                .mobile(updated.getMobile())
                .role(updated.getRole())
                .shopId(shop.getId())
                .shopName(shop.getName())
                .isEnabled(updated.getIsEnabled())
                .build();
    }

    private ShopDTO mapToDTO(Shop shop) {
        // Find owner of this shop
        User owner = userRepository.findByShopId(shop.getId()).stream()
                .filter(u -> u.getRole() == Role.OWNER)
                .findFirst()
                .orElse(null);

        long productCount = shopInventoryRepository.findByShopIdAndIsActiveTrue(shop.getId()).size();

        return ShopDTO.builder()
                .id(shop.getId())
                .name(shop.getName())
                .branchCode(shop.getBranchCode())
                .address(shop.getAddress())
                .city(shop.getCity())
                .state(shop.getState())
                .contactPhone(shop.getContactPhone())
                .defaultOverheadPercentage(shop.getDefaultOverheadPercentage())
                .gstNumber(shop.getGstNumber())
                .isActive(shop.getIsActive())
                .ownerId(owner != null ? owner.getId() : null)
                .ownerName(owner != null ? owner.getFullName() : "Unassigned")
                .ownerEmail(owner != null ? owner.getEmail() : null)
                .ownerMobile(owner != null ? owner.getMobile() : null)
                .totalProductsCount(productCount)
                .build();
    }
}
