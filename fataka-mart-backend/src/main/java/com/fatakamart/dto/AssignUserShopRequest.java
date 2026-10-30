package com.fatakamart.dto;

import com.fatakamart.domain.enums.Role;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignUserShopRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Shop ID is required")
    private Long shopId;

    @NotNull(message = "Role is required")
    @Builder.Default
    private Role targetRole = Role.OWNER;
}
