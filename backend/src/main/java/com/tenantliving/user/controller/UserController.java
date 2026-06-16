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
import com.tenantliving.auth.domain.MembershipTbl;
import com.tenantliving.auth.repository.MembershipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
    /**
     * Users
     * User lookup APIs
     */

public class UserController {

    private final UserService userService;
    private final MembershipRepository membershipRepository;
    private final LeaseService leaseService;

    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<UserDTOs.UserSearchResponse>>> searchByPhone(
            @RequestParam String phone
    ) {
        List<UserDTOs.UserSearchResponse> results = userService.searchByPhoneNumber(phone).stream()
                .map(UserController::toSearchResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @PostMapping("/create-tenant")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserDTOs.UserSearchResponse>> createTenant(
            @Valid @RequestBody UserDTOs.CreateTenantRequest request
    ) {
        String email = request.email().trim().toLowerCase();
        if (userService.existsByEmail(email)) {
            throw new com.tenantliving.common.exception.BusinessException(
                    org.springframework.http.HttpStatus.CONFLICT, "Email already registered"
            );
        }

        String phone = request.phoneNumber().trim();
        if (userService.findByPhoneNumber(phone).isPresent()) {
            throw new com.tenantliving.common.exception.BusinessException(
                    org.springframework.http.HttpStatus.CONFLICT, "Phone number already registered"
            );
        }

        UserTbl user = UserTbl.builder()
                .authUid(email)
                .fullName(request.fullName().trim())
                .phoneNumber(phone)
                .globalRole(com.tenantliving.common.domain.UserRole.USER)
                .build();

        UserTbl savedUser = userService.createUser(user);

        return ResponseEntity.ok(ApiResponse.success(toSearchResponse(savedUser)));
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
    @Transactional(readOnly = true)
    /**
     * Me
     * Current user context APIs
     */

    public ResponseEntity<ApiResponse<MeDTOs.MyContextResponse>> getContext(
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }

        UUID userId = UUID.fromString(currentUser.getId());
        UserTbl user = userService.getUserById(userId);
        
        List<MembershipTbl> memberships = membershipRepository.findByUserId(userId);
        
        List<MeDTOs.MembershipSummary> managedProperties = memberships.stream()
                .filter(m -> m.getProperty() != null && !m.getRole().getCode().equals("PROPERTY_TENANT"))
                .map(membership -> new MeDTOs.MembershipSummary(
                        membership.getProperty().getId(),
                        membership.getProperty().getName(),
                        membership.getRole().getCode(),
                        membership.getRole().getName()
                ))
                .toList();
                
        List<MeDTOs.MembershipSummary> tenantProperties = memberships.stream()
                .filter(m -> m.getProperty() != null && m.getRole().getCode().equals("PROPERTY_TENANT"))
                .map(membership -> new MeDTOs.MembershipSummary(
                        membership.getProperty().getId(),
                        membership.getProperty().getName(),
                        membership.getRole().getCode(),
                        membership.getRole().getName()
                ))
                .toList();

        List<MeDTOs.ActiveLeaseSummary> activeLeases = leaseService.findByUserIdAndStatus(userId, LeaseStatus.ACTIVE)
                .map(lease -> List.of(UserController.toActiveLeaseSummary(lease)))
                .orElse(List.of());
                
        boolean isLandlord = !managedProperties.isEmpty();
        boolean isTenant = !activeLeases.isEmpty();

        return ResponseEntity.ok(ApiResponse.success(new MeDTOs.MyContextResponse(
                user.getGlobalRole(),
                managedProperties,
                tenantProperties,
                activeLeases,
                isLandlord,
                isTenant
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
