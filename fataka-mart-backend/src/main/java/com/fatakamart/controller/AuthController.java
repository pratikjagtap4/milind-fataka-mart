package com.fatakamart.controller;

import com.fatakamart.domain.entity.User;
import com.fatakamart.domain.enums.Role;
import com.fatakamart.payload.ApiResponse;
import com.fatakamart.payload.AuthRequest;
import com.fatakamart.payload.AuthResponse;
import com.fatakamart.payload.RegisterRequest;
import com.fatakamart.payload.UserDto;
import com.fatakamart.repository.UserRepository;
import com.fatakamart.security.JwtTokenProvider;
import com.fatakamart.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication & Authorization", description = "Endpoints for JWT login, customer signup, and current profile")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @PostMapping("/login")
    @Operation(summary = "Login with Email or Mobile Number and Password")
    public ResponseEntity<ApiResponse<AuthResponse>> authenticateUser(@Valid @RequestBody AuthRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername().trim(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        AuthResponse authResponse = AuthResponse.builder()
                .accessToken(jwt)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .mobile(user.getMobile())
                .role(user.getRole())
                .shopId(user.getShop() != null ? user.getShop().getId() : null)
                .shopName(user.getShop() != null ? user.getShop().getName() : null)
                .branchCode(user.getShop() != null ? user.getShop().getBranchCode() : null)
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Login successful", authResponse));
    }

    @PostMapping("/register")
    @Operation(summary = "Register new Customer (Mandatory: Name, Mobile, Password)")
    public ResponseEntity<ApiResponse<AuthResponse>> registerCustomer(@Valid @RequestBody RegisterRequest request) {
        String mobile = request.getMobile().trim();
        String email = request.getEmail() != null && !request.getEmail().isBlank()
                ? request.getEmail().trim().toLowerCase()
                : mobile + "@fatakamart.local";

        if (userRepository.existsByMobile(mobile)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Mobile number is already registered. Please login."));
        }

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email is already registered. Please use another email or login."));
        }

        // New registrations always default to CUSTOMER
        User user = User.builder()
                .fullName(request.getFullName().trim())
                .mobile(mobile)
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.CUSTOMER)
                .address(request.getAddress())
                .referredBy(request.getReferredBy())
                .isEnabled(true)
                .build();

        User savedUser = userRepository.save(user);

        // Auto authenticate newly registered user
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        AuthResponse authResponse = AuthResponse.builder()
                .accessToken(jwt)
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .fullName(savedUser.getFullName())
                .mobile(savedUser.getMobile())
                .role(savedUser.getRole())
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Registration successful! Welcome to Fataka Mart.", authResponse));
    }

    @GetMapping("/me")
    @Operation(summary = "Get currently authenticated user profile")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(@AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("User is not authenticated"));
        }

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserDto userDto = UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .mobile(user.getMobile())
                .role(user.getRole())
                .shopId(user.getShop() != null ? user.getShop().getId() : null)
                .shopName(user.getShop() != null ? user.getShop().getName() : null)
                .address(user.getAddress())
                .referredBy(user.getReferredBy())
                .isEnabled(user.getIsEnabled())
                .build();

        return ResponseEntity.ok(ApiResponse.ok(userDto));
    }
}
