package com.fatakamart.domain.enums;

public enum MarginAlert {
    GREEN,   // Healthy margin (safe profit level)
    ORANGE,  // Cautionary threshold (below recommended tier markup)
    RED      // Critical threshold (below 150% overhead price / less than 50% profit)
}
