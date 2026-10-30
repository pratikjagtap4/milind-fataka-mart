package com.fatakamart.service.impl;

import com.fatakamart.domain.entity.Customer;
import com.fatakamart.domain.entity.Shop;
import com.fatakamart.dto.billing.CustomerSearchDTO;
import com.fatakamart.dto.billing.QuickCustomerCreateRequest;
import com.fatakamart.repository.CustomerRepository;
import com.fatakamart.repository.ShopRepository;
import com.fatakamart.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final ShopRepository shopRepository;
    private final com.fatakamart.repository.BillRepository billRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CustomerSearchDTO> quickSearchCustomers(Long shopId, String query) {
        String cleanQuery = (query != null) ? query.trim() : "";
        return customerRepository.quickSearch(shopId, cleanQuery).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CustomerSearchDTO createQuickCustomer(QuickCustomerCreateRequest request) {
        Shop shop = null;
        if (request.getShopId() != null) {
            shop = shopRepository.findById(request.getShopId()).orElse(null);
        }

        String mobile = request.getMobileNumber().trim();

        // Check if customer already exists for this shop
        if (request.getShopId() != null) {
            var existing = customerRepository.findByShopIdAndMobileNumber(request.getShopId(), mobile);
            if (existing.isPresent()) {
                return mapToDTO(existing.get());
            }
        }

        Customer customer = Customer.builder()
                .shop(shop)
                .fullName(request.getFullName().trim())
                .mobileNumber(mobile)
                .address(request.getAddress())
                .referredBy(request.getReferredBy())
                .tier(request.getTier())
                .totalPurchasesCount(0)
                .totalSpent(BigDecimal.ZERO)
                .outstandingBalance(BigDecimal.ZERO)
                .notes(request.getNotes())
                .build();

        return mapToDTO(customerRepository.save(customer));
    }

    @Override
    @Transactional
    public CustomerSearchDTO updateCustomer(Long id, QuickCustomerCreateRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));

        customer.setFullName(request.getFullName().trim());
        if (request.getMobileNumber() != null && !request.getMobileNumber().isBlank()) {
            customer.setMobileNumber(request.getMobileNumber().trim());
        }
        if (request.getAddress() != null) {
            customer.setAddress(request.getAddress());
        }
        if (request.getReferredBy() != null) {
            customer.setReferredBy(request.getReferredBy());
        }
        if (request.getTier() != null) {
            customer.setTier(request.getTier());
        }
        if (request.getNotes() != null) {
            customer.setNotes(request.getNotes());
        }

        return mapToDTO(customerRepository.save(customer));
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerSearchDTO getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));
        return mapToDTO(customer);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerSearchDTO> getAllShopCustomers(Long shopId) {
        return customerRepository.findByShopId(shopId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));
        // Disassociate customer link from bills so past orders, invoices, and sales reports remain 100% preserved
        billRepository.detachCustomerFromBills(id);
        customerRepository.delete(customer);
    }

    private CustomerSearchDTO mapToDTO(Customer customer) {
        return CustomerSearchDTO.builder()
                .id(customer.getId())
                .shopId(customer.getShop() != null ? customer.getShop().getId() : null)
                .fullName(customer.getFullName())
                .mobileNumber(customer.getMobileNumber())
                .address(customer.getAddress())
                .referredBy(customer.getReferredBy())
                .tier(customer.getTier())
                .totalPurchasesCount(customer.getTotalPurchasesCount())
                .totalSpent(customer.getTotalSpent())
                .outstandingBalance(customer.getOutstandingBalance())
                .build();
    }
}
