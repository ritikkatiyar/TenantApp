package com.tenantliving.user.dto;

import com.tenantliving.user.domain.UserMode;
import jakarta.validation.constraints.NotNull;

public record SaveUserPreferenceRequest(
        @NotNull(message = "Active mode is required") UserMode activeMode
) {
}
