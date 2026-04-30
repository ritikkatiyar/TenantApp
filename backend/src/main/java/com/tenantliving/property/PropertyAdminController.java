package com.tenantliving.property;

import com.tenantliving.dto.PropertyDTOs;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/properties")
@RequiredArgsConstructor
public class PropertyAdminController {

    private final PropertyService propertyService;

    /**
     * Creates a new property.
     * Only accessible by LANDLORD or ADMIN.
     */
    //todo
//    @PostMapping
//    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
//    public ResponseEntity<Property> createProperty(
//            @Valid @RequestBody PropertyDTOs.CreatePropertyRequest request,
//            @AuthenticationPrincipal UserDetailsImpl currentUser) {
//        // ^ Assumes you have a custom UserDetails implementation holding the UUID
//
//        Property created = propertyService.createProperty(request, currentUser.getId());
//        return ResponseEntity.status(HttpStatus.CREATED).body(created);
//    }

    /**
     * Generates rooms in batch for a specific property.
     * Only accessible by LANDLORD or ADMIN.
     */
    @PostMapping("/{propertyId}/rooms/batch")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<Void> batchCreateRooms(
            @PathVariable UUID propertyId,
            @Valid @RequestBody PropertyDTOs.BatchRoomRequest request) {

        propertyService.generateBatchRooms(propertyId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}