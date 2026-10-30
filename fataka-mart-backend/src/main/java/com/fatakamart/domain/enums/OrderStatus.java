package com.fatakamart.domain.enums;

public enum OrderStatus {
    PENDING_REVIEW, // Placed online by customer, awaiting owner review
    DISPATCHED,     // Fatake packed and sent to customer
    COMPLETED,      // Bill finalized and sent to customer
    CANCELLED       // Cancelled / Rejected
}
