package com.fatakamart.service;

import com.fatakamart.dto.billing.CustomerSearchDTO;
import com.fatakamart.dto.billing.QuickCustomerCreateRequest;

import java.util.List;

public interface CustomerService {
    List<CustomerSearchDTO> quickSearchCustomers(Long shopId, String query);
    CustomerSearchDTO createQuickCustomer(QuickCustomerCreateRequest request);
    CustomerSearchDTO updateCustomer(Long id, QuickCustomerCreateRequest request);
    CustomerSearchDTO getCustomerById(Long id);
    List<CustomerSearchDTO> getAllShopCustomers(Long shopId);
    void deleteCustomer(Long id);
}
