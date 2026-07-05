package com.tenantliving.finance.job;

import com.tenantliving.common.domain.LeaseStatus;
import com.tenantliving.finance.domain.ChargeConfigTbl;
import com.tenantliving.finance.domain.LeaseTbl;
import com.tenantliving.finance.dto.RentCycleDTOs.GenerateRentCycleRequest;
import com.tenantliving.finance.repository.ChargeConfigRepository;
import com.tenantliving.finance.repository.LeaseRepository;
import com.tenantliving.finance.service.BillingWorksheetService;
import com.tenantliving.finance.service.interfaces.RentCycleService;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.service.interfaces.PropertyQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AutoBillingJob {

    private final PropertyQueryService propertyQueryService;
    private final ChargeConfigRepository chargeConfigRepository;
    private final BillingWorksheetService worksheetService;
    private final LeaseRepository leaseRepository;
    private final RentCycleService rentCycleService;

    /**
     * Runs at the top of every hour to check for properties that need auto-billing.
     */
    @Scheduled(cron = "0 0 * * * *") // Every hour
    public void executeAutoBilling() {
        LocalDateTime now = LocalDateTime.now();
        int currentDay = now.getDayOfMonth();
        int currentHour = now.getHour();
        String currentBillingMonth = now.format(DateTimeFormatter.ofPattern("yyyy-MM"));

        log.info("Starting Auto-Billing Job for Day: {}, Hour: {}, Month: {}", currentDay, currentHour, currentBillingMonth);

        List<PropertyTbl> properties = propertyQueryService.getPropertiesByAutoBillDayOfMonth(currentDay);

        for (PropertyTbl property : properties) {
            if (property.getAutoBillTime() != null && property.getAutoBillTime().getHour() == currentHour) {
                log.info("Processing auto-billing for Property ID: {}", property.getId());
                processPropertyBilling(property, currentBillingMonth);
            }
        }
    }

    private void processPropertyBilling(PropertyTbl property, String billingMonth) {
        try {
            // 1. Initialize Worksheets for all active Charge Configs
            List<ChargeConfigTbl> activeConfigs = chargeConfigRepository.findAllByPropertyIdAndIsActiveTrue(property.getId());
            for (ChargeConfigTbl config : activeConfigs) {
                worksheetService.getOrCreateWorksheetForMonth(property.getId(), config.getId(), billingMonth);
            }

            // 2. Generate Rent Cycles for all active leases
            List<LeaseTbl> activeLeases = leaseRepository.findActiveOccupanciesByProperty(property.getId(), LeaseStatus.ACTIVE);
            LocalDate dueDate = LocalDate.now().plusDays(5); // Default due in 5 days

            for (LeaseTbl lease : activeLeases) {
                try {
                    GenerateRentCycleRequest request = new GenerateRentCycleRequest(
                            lease.getId(),
                            billingMonth,
                            dueDate
                    );
                    rentCycleService.generate(request);
                    log.info("Successfully auto-generated rent cycle for Lease ID: {}", lease.getId());
                } catch (Exception e) {
                    log.error("Failed to auto-generate rent cycle for Lease ID: {}", lease.getId(), e);
                }
            }
        } catch (Exception e) {
            log.error("Failed to process auto-billing for Property ID: {}", property.getId(), e);
        }
    }
}
