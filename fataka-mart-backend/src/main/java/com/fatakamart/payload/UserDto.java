package com.fatakamart.payload;

import com.fatakamart.domain.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String email;
    private String fullName;
    private String mobile;
    private Role role;
    private Long shopId;
    private String shopName;
    private String address;
    private String referredBy;
    private Boolean isEnabled;
}
