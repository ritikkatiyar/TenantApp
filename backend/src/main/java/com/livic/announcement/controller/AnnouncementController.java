package com.livic.announcement.controller;

import com.livic.announcement.dto.AnnouncementDTOs.CreateAnnouncementRequest;
import com.livic.announcement.dto.AnnouncementDTOs.AnnouncementResponse;
import com.livic.announcement.service.interfaces.AnnouncementService;
import com.livic.auth.principal.UserDetailsImpl;
import com.livic.auth.service.interfaces.AuthorizationService;
import com.livic.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;

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
    private final AuthorizationService authorizationService;

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
        /**
     * Get announcements
     * For tenants, returns scoped notices for their active lease. For landlords/staff, returns all notices for the specified property.
     */

    public ResponseEntity<ApiResponse<Page<AnnouncementResponse>>> getAnnouncements(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestParam(required = false) UUID propertyId,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC, size = 15) Pageable pageable) {

        UUID userId = UUID.fromString(currentUser.getId());

        if (propertyId != null && authorizationService.hasPermission(propertyId, "PROPERTY_VIEW")) {
            return ResponseEntity.ok(ApiResponse.success(announcementService.getAnnouncementsForProperty(propertyId, userId, pageable)));
        }

        return ResponseEntity.ok(ApiResponse.success(announcementService.getNoticesForTenant(userId, pageable)));
    }

    @PostMapping("/{id}/read")
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
