package com.fatakamart.payload;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Full name is mandatory")
    private String fullName;

    @NotBlank(message = "Mobile number is mandatory")
    @Pattern(regexp = "^[0-9+ -]{10,15}$", message = "Please provide a valid mobile number")
    private String mobile;

    private String email;

    @NotBlank(message = "Password is mandatory")
    private String password;

    private String address;

    private String referredBy;
}
