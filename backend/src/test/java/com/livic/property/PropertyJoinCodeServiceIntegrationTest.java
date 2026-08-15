package com.livic.property;

import com.livic.auth.dto.MembershipSummaryDTO;
import com.livic.auth.repository.MembershipRepository;
import com.livic.auth.repository.MembershipRoleRepository;
import com.livic.auth.service.interfaces.MembershipService;
import com.livic.common.domain.UserRole;
import com.livic.common.exception.BusinessException;
import com.livic.property.domain.PropertyJoinCodeTbl;
import com.livic.property.domain.PropertyTbl;
import com.livic.property.dto.PropertyJoinCodeDTOs;
import com.livic.property.repository.PropertyJoinCodeRepository;
import com.livic.property.repository.PropertyRepository;
import com.livic.property.service.interfaces.PropertyJoinCodeService;
import com.livic.common.constant.RoleConstants;
import com.livic.user.domain.UserTbl;

import com.livic.user.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class PropertyJoinCodeServiceIntegrationTest {

    @Autowired
    private PropertyJoinCodeService propertyJoinCodeService;

    @Autowired
    private PropertyJoinCodeRepository propertyJoinCodeRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private MembershipRoleRepository membershipRoleRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    @Autowired
    private MembershipService membershipService;

    @Autowired
    private UserRepository userRepository;

    private UserTbl landlord;
    private UserTbl manager;
    private UserTbl newStaff;
    private PropertyTbl property;

    @BeforeEach
    public void setUp() {
        landlord = UserTbl.builder()
                .authUid("landlord-" + UUID.randomUUID() + "@test.com")
                .fullName("Landlord User")
                .phoneNumber("+919000000001")
                .failedLoginAttempts(0)
                .globalRole(UserRole.USER)
                .build();
        landlord = userRepository.save(landlord);

        manager = UserTbl.builder()
                .authUid("manager-" + UUID.randomUUID() + "@test.com")
                .fullName("Manager User")
                .phoneNumber("+919000000002")
                .failedLoginAttempts(0)
                .globalRole(UserRole.USER)
                .build();
        manager = userRepository.save(manager);

        newStaff = UserTbl.builder()
                .authUid("caretaker-" + UUID.randomUUID() + "@test.com")
                .fullName("Caretaker User")
                .phoneNumber("+919000000003")
                .failedLoginAttempts(0)
                .globalRole(UserRole.USER)
                .build();
        newStaff = userRepository.save(newStaff);

        property = PropertyTbl.builder()
                .name("Standard Green Mansion")
                .address("Sector 15")
                .city("Faridabad")
                .build();
        property = propertyRepository.save(property);

        // Assign landlord as property owner
        membershipService.createOwnerMembership(property.getId(), landlord.getId());

        // Assign manager as manager
        membershipService.assignRole(property.getId(), manager.getId(), RoleConstants.PROPERTY_MANAGER, landlord.getId());
    }

    @Test
    public void testLandlordCanGenerateJoinCodeAndStaffCanApply() {
        // Act - Landlord generates caretaker join code
        PropertyJoinCodeDTOs.JoinCodeResponse joinCode = propertyJoinCodeService.generateJoinCode(
                property.getId(),
                RoleConstants.PROPERTY_CARETAKER,
                1,
                landlord.getId()
        );

        assertNotNull(joinCode);
        assertNotNull(joinCode.code());
        assertTrue(joinCode.isActive());
        assertEquals(RoleConstants.PROPERTY_CARETAKER, joinCode.roleCode());

        // Act - New caretaker applies join code
        PropertyJoinCodeDTOs.JoinCodeResultResponse result = propertyJoinCodeService.validateAndApplyJoinCode(
                joinCode.code(),
                newStaff.getId()
        );

        // Assert - Membership created successfully
        assertNotNull(result);
        assertEquals(property.getId(), result.propertyId());
        assertEquals(RoleConstants.PROPERTY_CARETAKER, result.roleCode());
        assertNotNull(result.membershipId());

        // Assert - Join code usage tracked
        PropertyJoinCodeTbl updatedCode = propertyJoinCodeRepository.findById(joinCode.id()).orElseThrow();
        assertEquals(1, updatedCode.getUsesCount());
        assertFalse(updatedCode.isActive(), "Single use code should be deactivated after use");
    }

    @Test
    public void testManagerCannotDelegateHigherRole() {
        // Act & Assert - Manager tries to generate Owner join code, should fail delegation check
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            propertyJoinCodeService.generateJoinCode(
                    property.getId(),
                    RoleConstants.PROPERTY_OWNER,
                    1,
                    manager.getId()
            );
        });

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        assertTrue(exception.getMessage().contains("Cannot invite someone to a role containing permissions you do not possess"));
    }

}
