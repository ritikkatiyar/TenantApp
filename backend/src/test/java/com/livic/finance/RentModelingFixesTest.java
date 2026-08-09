package com.livic.finance;

import com.livic.common.domain.BillingFrequency;
import com.livic.common.domain.CalculationStrategyType;
import com.livic.common.domain.ChargeCategory;
import com.livic.common.domain.LeaseSplitStrategy;
import com.livic.common.domain.LeaseStatus;
import com.livic.common.domain.RentChargeType;
import com.livic.common.domain.RentCycleStatus;
import com.livic.common.event.RentPublishedEvent;
import com.livic.common.exception.BusinessException;
import com.livic.finance.domain.BillingWorksheetEntryTbl;
import com.livic.finance.domain.ChargeConfigTbl;
import com.livic.finance.domain.LeaseTbl;
import com.livic.finance.domain.RentCycleChargeTbl;
import com.livic.finance.domain.RentCycleTbl;
import com.livic.finance.dto.BillingWorksheetDTOs.WorksheetEntryResponse;
import com.livic.finance.dto.ChargeConfigDTOs.ChargeConfigRequest;
import com.livic.finance.dto.LeaseDTOs;
import com.livic.finance.dto.RentCycleDTOs;
import com.livic.finance.mapper.LeaseMapper;
import com.livic.finance.service.impl.BillingWorksheetServiceImpl;
import com.livic.finance.service.impl.ChargeConfigServiceImpl;
import com.livic.finance.service.impl.RentCycleServiceImpl;
import com.livic.finance.service.interfaces.BillingWorksheetCrudService;
import com.livic.finance.service.interfaces.ChargeConfigCrudService;
import com.livic.finance.service.interfaces.LeaseCrudService;
import com.livic.finance.service.interfaces.LeaseQueryService;
import com.livic.finance.service.interfaces.MeterReadingCrudService;
import com.livic.finance.service.interfaces.RentCycleChargeCrudService;
import com.livic.finance.service.interfaces.RentCycleCrudService;
import com.livic.property.domain.PropertyTbl;
import com.livic.property.domain.UnitTbl;
import com.livic.property.dto.PropertySummaryDTO;
import com.livic.property.dto.UnitSummaryDTO;
import com.livic.property.facade.PropertyFacade;
import com.livic.property.facade.UnitFacade;
import com.livic.user.facade.UserFacade;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RentModelingFixesTest {

    @Mock
    private ChargeConfigCrudService chargeConfigCrudService;
    @Mock
    private PropertyFacade propertyFacade;
    @Mock
    private UnitFacade unitFacade;
    @Mock
    private BillingWorksheetCrudService billingWorksheetCrudService;
    @Mock
    private MeterReadingCrudService meterReadingCrudService;
    @Mock
    private RentCycleChargeCrudService rentCycleChargeCrudService;
    @Mock
    private RentCycleCrudService rentCycleCrudService;
    @Mock
    private LeaseQueryService leaseQueryService;
    @Mock
    private LeaseCrudService leaseCrudService;
    @Mock
    private ApplicationEventPublisher eventPublisher;
    @Mock
    private UserFacade userFacade;
    @Mock
    private com.livic.finance.service.interfaces.UnitBookingCrudService unitBookingCrudService;
    @Mock
    private com.livic.finance.service.interfaces.FinanceLedgerCrudService financeLedgerCrudService;
    @Mock
    private com.livic.finance.strategy.ChargeCalculationService chargeCalculationService;

    @InjectMocks
    private ChargeConfigServiceImpl chargeConfigService;

    @InjectMocks
    private BillingWorksheetServiceImpl billingWorksheetService;

    @InjectMocks
    private RentCycleServiceImpl rentCycleService;

    private UUID propertyId;
    private UUID unitId;
    private UUID leaseId;
    private UUID chargeConfigId;
    private PropertyTbl property;
    private UnitTbl unit;
    private LeaseTbl lease;
    private ChargeConfigTbl rentConfig;

    @BeforeEach
    void setUp() {
        propertyId = UUID.randomUUID();
        unitId = UUID.randomUUID();
        leaseId = UUID.randomUUID();
        chargeConfigId = UUID.randomUUID();

        property = new PropertyTbl();
        property.setId(propertyId);
        property.setName("Test Property");

        unit = new UnitTbl();
        unit.setId(unitId);
        unit.setProperty(property);
        unit.setUnitNumber("101");
        unit.setFloor(1);

        lease = LeaseTbl.builder()
                .userId(UUID.randomUUID())
                .unitId(unitId)
                .monthlyRentAmount(BigDecimal.valueOf(1500.00))
                .securityDeposit(BigDecimal.valueOf(3000.00))
                .splitStrategy(LeaseSplitStrategy.FULL_UNIT)
                .moveInDate(LocalDate.now())
                .status(LeaseStatus.ACTIVE)
                .build();
        lease.setId(leaseId);

        rentConfig = ChargeConfigTbl.builder()
                .propertyId(propertyId)
                .chargeName("Rent Charge")
                .chargeCategory(ChargeCategory.RENT)
                .billingFrequency(BillingFrequency.MONTHLY)
                .calculationStrategy(CalculationStrategyType.FIXED_RATE)
                .baseRate(BigDecimal.valueOf(9999.00)) // Legacy base rate should be ignored
                .isSystemRequired(true)
                .isActive(true)
                .build();
        rentConfig.setId(chargeConfigId);
    }

    @Test
    @DisplayName("Verification 3 & 4: ChargeConfigServiceImpl rejects category RENT")
    void testCreateChargeConfig_RejectsRentCategory() {
        ChargeConfigRequest request = new ChargeConfigRequest();
        request.setPropertyId(propertyId);
        request.setChargeName("Custom Rent Config");
        request.setChargeCategory(ChargeCategory.RENT);

        BusinessException exception = assertThrows(BusinessException.class, () ->
                chargeConfigService.createChargeConfig(request)
        );

        assertTrue(exception.getMessage().contains("Rent is no longer configured here"));
    }

    @Test
    @DisplayName("Verification 5: Rent cycle generation uses lease.monthlyRentAmount, not charge_config_tbl base_rate")
    void testProcessLeaseGeneration_SourcesFromLeaseMonthlyRentAmount() {
        when(leaseQueryService.getLeaseById(leaseId)).thenReturn(lease);
        when(rentCycleCrudService.findByLease_IdAndBillingMonth(leaseId, "2026-08")).thenReturn(Optional.empty());
        when(rentCycleCrudService.save(any(RentCycleTbl.class))).thenAnswer(i -> {
            RentCycleTbl c = i.getArgument(0);
            if (c.getId() == null) c.setId(UUID.randomUUID());
            return c;
        });

        RentCycleDTOs.GenerateRentCycleRequest request = new RentCycleDTOs.GenerateRentCycleRequest(leaseId, "2026-08", LocalDate.now().plusDays(10));
        rentCycleService.generate(request);

        ArgumentCaptor<RentCycleChargeTbl> chargeCaptor = ArgumentCaptor.forClass(RentCycleChargeTbl.class);
        verify(rentCycleChargeCrudService, times(1)).save(chargeCaptor.capture());

        RentCycleChargeTbl savedCharge = chargeCaptor.getValue();
        assertEquals(RentChargeType.BASE_RENT, savedCharge.getChargeType());
        assertEquals(BigDecimal.valueOf(1500.00), savedCharge.getAmount()); // Matches lease, NOT charge_config baseRate (9999.00)
    }

    @Test
    @DisplayName("Verification 6: Billing worksheet defaults RENT category from lease.monthlyRentAmount")
    void testGetOrCreateWorksheet_PrefillsRentFromLease() {
        org.springframework.security.core.context.SecurityContext securityContext = mock(org.springframework.security.core.context.SecurityContext.class);
        org.springframework.security.core.Authentication authentication = mock(org.springframework.security.core.Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(UUID.randomUUID().toString());
        org.springframework.security.core.context.SecurityContextHolder.setContext(securityContext);

        when(chargeConfigCrudService.findById(chargeConfigId)).thenReturn(Optional.of(rentConfig));
        when(unitFacade.getUnitsByPropertyId(propertyId)).thenReturn(List.of(UnitSummaryDTO.from(unit)));
        when(leaseQueryService.findActiveLeasesByProperty(propertyId)).thenReturn(List.of(lease));
        when(billingWorksheetCrudService.findAllByPropertyIdAndChargeConfigIdAndBillingMonth(propertyId, chargeConfigId, "2026-08")).thenReturn(List.of());
        when(userFacade.getUsersByIds(any())).thenReturn(Map.of());
        when(rentCycleCrudService.findByPropertyIdAndBillingMonth(propertyId, "2026-08")).thenReturn(List.of());

        List<WorksheetEntryResponse> responses = billingWorksheetService.getOrCreateWorksheetForMonth(propertyId, chargeConfigId, "2026-08");

        assertEquals(1, responses.size());
        assertEquals(BigDecimal.valueOf(1500.00), responses.get(0).getEnteredValue()); // Prefilled from lease
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Verification 7: Single cycle publish and unpublish transition status and fire event")
    void testSingleCyclePublishAndUnpublish() {
        RentCycleTbl cycle = RentCycleTbl.builder()
                .lease(lease)
                .billingMonth("2026-08")
                .dueDate(LocalDate.now().plusDays(5))
                .totalAmount(BigDecimal.valueOf(1500.00))
                .status(RentCycleStatus.PENDING)
                .build();
        UUID cycleId = UUID.randomUUID();
        cycle.setId(cycleId);

        when(rentCycleCrudService.findById(cycleId)).thenReturn(Optional.of(cycle));
        when(rentCycleCrudService.save(any(RentCycleTbl.class))).thenAnswer(i -> i.getArgument(0));

        // Test Publish
        RentCycleDTOs.RentCycleResponse publishedResp = rentCycleService.publish(cycleId);
        assertEquals(RentCycleStatus.PUBLISHED, publishedResp.status());
        verify(eventPublisher, times(1)).publishEvent(any(RentPublishedEvent.class));

        // Test Unpublish
        RentCycleDTOs.RentCycleResponse unpublishedResp = rentCycleService.unpublish(cycleId);
        assertEquals(RentCycleStatus.PENDING, unpublishedResp.status());
    }

    @Test
    @DisplayName("LeaseMapper correctly maps monthlyRentAmount")
    void testLeaseMapper_MapsMonthlyRentAmount() {
        LeaseDTOs.CreateLeaseRequest request = new LeaseDTOs.CreateLeaseRequest(
                UUID.randomUUID(),
                unitId,
                BigDecimal.valueOf(2500.00),
                BigDecimal.valueOf(5000.00),
                LeaseSplitStrategy.FULL_UNIT,
                LocalDate.now(),
                null,
                LeaseStatus.ACTIVE,
                null
        );

        LeaseTbl entity = LeaseMapper.toEntity(request, request.unitId(), request.userId());
        assertEquals(BigDecimal.valueOf(2500.00), entity.getMonthlyRentAmount());

        LeaseDTOs.LeaseResponse response = LeaseMapper.toResponseWithDetails(entity, "John Doe", "1234567890");
        assertEquals(BigDecimal.valueOf(2500.00), response.monthlyRentAmount());
    }
}
