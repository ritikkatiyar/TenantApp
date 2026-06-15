package com.tenantliving.announcement.controller;

import com.tenantliving.announcement.dto.AnnouncementDTOs.CreateAnnouncementRequest;
import com.tenantliving.announcement.dto.AnnouncementDTOs.AnnouncementResponse;
import com.tenantliving.announcement.service.interfaces.AnnouncementService;
import com.tenantliving.auth.principal.UserDetailsImpl;
import com.tenantliving.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/announcements")
@RequiredArgsConstructor
    /**
     * Announcements & Notices
     * Endpoints for creating and viewing property broadcasts and tracking read-status.
     */

public class AnnouncementController {

    private final AnnouncementService announcementService;

    @PostMapping
    @PreAuthorize("@authorizationService.hasPermission(#request.propertyId(), 'ANNOUNCEMENT_CREATE')")
        /**
     * Create and broadcast announcement
     * Creates a notice and triggers event broadcasts to target recipients.
     */

    public ResponseEntity<ApiResponse<AnnouncementResponse>> createAnnouncement(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @Valid @RequestBody CreateAnnouncementRequest request) {
        UUID creatorId = UUID.fromString(currentUser.getId());
        AnnouncementResponse response = announcementService.createAnnouncement(request, creatorId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
        /**
     * Get announcements
     * For tenants, returns scoped notices for their active lease. For landlords/staff, returns all notices for the specified property.
     */

    public ResponseEntity<ApiResponse<List<AnnouncementResponse>>> getAnnouncements(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestParam(required = false) UUID propertyId) {

        UUID userId = UUID.fromString(currentUser.getId());
        boolean isTenant = currentUser.hasGlobalRole("USER");

        List<AnnouncementResponse> responses;
        if (isTenant) {
            responses = announcementService.getNoticesForTenant(userId);
        } else {
            if (propertyId == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Property ID is required for landlord/staff roles"));
            }
            responses = announcementService.getAnnouncementsForProperty(propertyId, userId);
        }

        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PostMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
        /**
     * Mark announcement as read
     * Logs a read receipt for the current tenant user.
     */

    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @PathVariable UUID id) {
        UUID tenantUserId = UUID.fromString(currentUser.getId());
        announcementService.markAsRead(id, tenantUserId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
