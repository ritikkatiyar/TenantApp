package com.livic.user.dto;

import com.livic.user.domain.UserMode;
import jakarta.validation.constraints.NotNull;

public record SaveUserPreferenceRequest(
        @NotNull(message = "Active mode is required") UserMode activeMode
) {
}
