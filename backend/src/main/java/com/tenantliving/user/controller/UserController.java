package com.tenantliving.user.controller;

import com.tenantliving.common.response.ApiResponse;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.dto.UserDTOs;
import com.tenantliving.user.service.interfaces.UserService;
import com.tenantliving.auth.principal.UserDetailsImpl;
import com.tenantliving.common.domain.LeaseStatus;
import com.tenantliving.finance.domain.LeaseTbl;
import com.tenantliving.finance.service.interfaces.LeaseService;
import com.tenantliving.user.dto.MeDTOs;
import com.tenantliving.property.domain.UserPropertyRoleTbl;
import com.tenantliving.property.service.interfaces.UserPropertyRoleService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User lookup APIs")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;
    private final UserPropertyRoleService userPropertyRoleService;
    private final LeaseService leaseService;

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_STAFF')")
    public ResponseEntity<ApiResponse<UserDTOs.UserSearchResponse>> searchByPhone(
            @RequestParam String phone
    ) {
        return userService.findByPhoneNumber(phone)
                .map(UserController::toSearchResponse)
                .map(ApiResponse::success)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.success(null)));
    }

    private static UserDTOs.UserSearchResponse toSearchResponse(UserTbl user) {
        return new UserDTOs.UserSearchResponse(
                user.getId(),
                user.getAuthUid(),
                user.getFullName(),
                user.getPhoneNumber(),
                user.getGlobalRole()
        );
    }

    @GetMapping("/me/context")
    @Tag(name = "Me", description = "Current user context APIs")
    public ResponseEntity<ApiResponse<MeDTOs.MyContextResponse>> getContext(
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }

        UUID userId = UUID.fromString(currentUser.getId());
        UserTbl user = userService.getUserById(userId);
        
        List<UserPropertyRoleTbl> propertyRoles = userPropertyRoleService.getRolesByUserId(userId);
        List<MeDTOs.PropertyRoleSummary> roleSummaries = propertyRoles.stream()
                .map(role -> new MeDTOs.PropertyRoleSummary(
                        role.getProperty().getId(),
                        role.getProperty().getName(),
                        role.getRole()
                ))
                .toList();

        List<MeDTOs.ActiveLeaseSummary> activeLeases = leaseService.findByUserIdAndStatus(userId, LeaseStatus.ACTIVE)
                .stream()
                .map(UserController::toActiveLeaseSummary)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(new MeDTOs.MyContextResponse(
                user.getGlobalRole(),
                roleSummaries,
                activeLeases
        )));
    }

    private static MeDTOs.ActiveLeaseSummary toActiveLeaseSummary(LeaseTbl lease) {
        return new MeDTOs.ActiveLeaseSummary(
                lease.getId(),
                lease.getUnit().getProperty().getId(),
                lease.getUnit().getProperty().getName(),
                lease.getUnit().getId(),
                lease.getUnit().getUnitNumber(),
                lease.getRentAmount(),
                lease.getStatus().name()
        );
    }
}
