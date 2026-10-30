package com.fatakamart.payload;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthRequest {

    @NotBlank(message = "Email or mobile number is required")
    private String username; // Email or Mobile Number

    @NotBlank(message = "Password is required")
    private String password;
}
