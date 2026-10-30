package com.fatakamart.domain.enums;

public enum CustomerTier {
    NORMAL,  // Tier 1: Regular walk-in / new customer (standard discount, 50% min margin check)
    REGULAR, // Tier 2: Repeat customer (suggested 85% markup, 80% min margin check)
    CLOSE    // Tier 3: Friends & Family (auto-target 55% margin over overhead)
}
