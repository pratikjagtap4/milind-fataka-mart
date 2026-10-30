package com.fatakamart.controller;

import com.fatakamart.payload.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/health")
@Tag(name = "System Health", description = "Liveness and readiness health endpoints")
public class HealthCheckController {

    @GetMapping
    @Operation(summary = "Check backend service status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> healthCheck() {
        Map<String, Object> health = Map.of(
                "status", "UP",
                "service", "Fataka Mart ERP & Speed Billing Engine",
                "version", "1.0.0",
                "mode", "Production-Ready"
        );
        return ResponseEntity.ok(ApiResponse.ok("Service is running smoothly", health));
    }
}
