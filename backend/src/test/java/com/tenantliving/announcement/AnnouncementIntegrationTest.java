package com.tenantliving.announcement;

import com.tenantliving.announcement.domain.*;
import com.tenantliving.announcement.dto.AnnouncementDTOs.CreateAnnouncementRequest;
import com.tenantliving.announcement.dto.AnnouncementDTOs.AnnouncementResponse;
import com.tenantliving.announcement.repository.AnnouncementReceiptRepository;
import com.tenantliving.announcement.repository.AnnouncementRepository;
import com.tenantliving.announcement.service.interfaces.AnnouncementService;
import com.tenantliving.common.domain.*;
import com.tenantliving.finance.domain.LeaseTbl;
import com.tenantliving.finance.repository.LeaseRepository;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.domain.UnitTbl;
import com.tenantliving.property.repository.PropertyRepository;
import com.tenantliving.property.repository.UnitRepository;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class AnnouncementIntegrationTest {

    @Autowired
    private AnnouncementService announcementService;

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private AnnouncementReceiptRepository announcementReceiptRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private UnitRepository unitRepository;

    @Autowired
    private LeaseRepository leaseRepository;

    private UserTbl landlord;
    private UserTbl tenant;
    private PropertyTbl property;
    private UnitTbl unit;
    private LeaseTbl lease;

    @BeforeEach
    public void setUp() {
        landlord = UserTbl.builder()
                .authUid("landlord-" + UUID.randomUUID() + "@test.com")
                .fullName("Landlord User")
                .phoneNumber("+91" + (9000000000L + (long)(Math.random() * 999999999)))
                .failedLoginAttempts(0)
                .globalRole(UserRole.SUPER_ADMIN)
                .build();
        landlord = userRepository.save(landlord);

        tenant = UserTbl.builder()
                .authUid("tenant-" + UUID.randomUUID() + "@test.com")
                .fullName("Tenant User")
                .phoneNumber("+91" + (9000000000L + (long)(Math.random() * 999999999)))
                .failedLoginAttempts(0)
                .globalRole(UserRole.USER)
                .build();
        tenant = userRepository.save(tenant);

        property = PropertyTbl.builder()
                .name("Test Property")
                .address("123 Test St")
                .city("Test City")
                .landmark("Test Landmark")
                .totalFloors(5)
                .build();
        property = propertyRepository.save(property);

        unit = UnitTbl.builder()
                .property(property)
                .unitNumber("101")
                .floor(1)
                .capacity(2)
                .gridX(1)
                .gridY(1)
                .type(UnitType.STUDIO)
                .facing(FacingDirection.NORTH)
                .build();
        unit = unitRepository.save(unit);

        lease = LeaseTbl.builder()
                .userId(tenant.getId())
                .unit(unit)
                .status(LeaseStatus.ACTIVE)
                .moveInDate(LocalDate.now().minusDays(10))
                .securityDeposit(BigDecimal.valueOf(30000))
                .splitStrategy(LeaseSplitStrategy.FULL_UNIT)
                .build();
        lease = leaseRepository.save(lease);
    }

    @Test
    public void testCreateAnnouncementAndFetchNotices() {
        // Create an announcement targeting property
        CreateAnnouncementRequest request = CreateAnnouncementRequest.builder()
                .propertyId(property.getId())
                .title("Property Broadcast")
                .content("Attention all tenants, scheduled cleaning tomorrow.")
                .category(AnnouncementCategory.MAINTENANCE)
                .severity(AnnouncementSeverity.INFO)
                .targetType(AnnouncementTargetType.PROPERTY)
                .build();

        AnnouncementResponse created = announcementService.createAnnouncement(request, landlord.getId());
        assertNotNull(created);
        assertEquals("Property Broadcast", created.getTitle());

        // Fetch notices for tenant
        List<AnnouncementResponse> tenantNotices = announcementService.getNoticesForTenant(tenant.getId());
        assertEquals(1, tenantNotices.size());
        assertEquals("Property Broadcast", tenantNotices.get(0).getTitle());
        assertFalse(tenantNotices.get(0).isRead());

        // Mark notice as read
        announcementService.markAsRead(created.getId(), tenant.getId());

        // Verify read status
        tenantNotices = announcementService.getNoticesForTenant(tenant.getId());
        assertEquals(1, tenantNotices.size());
        assertTrue(tenantNotices.get(0).isRead());
    }

    @Test
    public void testTargetScoping() {
        // Notice targeting Unit 101
        CreateAnnouncementRequest unitRequest = CreateAnnouncementRequest.builder()
                .propertyId(property.getId())
                .title("Unit Specific Notice")
                .content("Balcony check.")
                .category(AnnouncementCategory.GENERAL)
                .severity(AnnouncementSeverity.WARNING)
                .targetType(AnnouncementTargetType.UNIT)
                .targetValue(unit.getId().toString())
                .build();
        announcementService.createAnnouncement(unitRequest, landlord.getId());

        // Notice targeting Floor 2
        CreateAnnouncementRequest floorRequest = CreateAnnouncementRequest.builder()
                .propertyId(property.getId())
                .title("Floor 2 Notice")
                .content("Painting works on Floor 2.")
                .category(AnnouncementCategory.MAINTENANCE)
                .severity(AnnouncementSeverity.INFO)
                .targetType(AnnouncementTargetType.FLOOR)
                .targetValue("2")
                .build();
        announcementService.createAnnouncement(floorRequest, landlord.getId());

        // Tenant is on floor 1, unit 101. So they should see the unit notice, but NOT the Floor 2 notice.
        List<AnnouncementResponse> tenantNotices = announcementService.getNoticesForTenant(tenant.getId());
        assertEquals(1, tenantNotices.size());
        assertEquals("Unit Specific Notice", tenantNotices.get(0).getTitle());
    }
}
