package com.livic.user.dto;

public record UserNotificationPreferencesDTO(
        boolean emailEnabled,
        boolean pushEnabled,
        boolean whatsappEnabled
) {
}
