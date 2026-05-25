package com.tenantliving.finance.strategy;

import com.tenantliving.finance.domain.ChargeConfigTbl;
import com.tenantliving.finance.domain.RentCycleChargeTbl;
import com.tenantliving.common.domain.RentChargeType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class ChargeCalculationService {

    private final ChargeCalculationFactory strategyFactory;

    @Autowired
    public ChargeCalculationService(ChargeCalculationFactory strategyFactory) {
        this.strategyFactory = strategyFactory;
    }

    /**
     * Dynamically builds a calculation pipeline (Strategy + Decorators) based on the specific Charge Configuration.
     */
    public RentCycleChargeTbl executeChargePipeline(ChargeConfigTbl config, Long unitId, boolean isPaymentLate) {
        
        // 1. Get Base Calculation Strategy
        ChargeCalculation calculationPipeline = strategyFactory.getBaseStrategy(config.getCalculationStrategy());
        
        // 2. Wrap Pipeline with Tax Decorator (If Applicable)
        if (Boolean.TRUE.equals(config.getApplySalesTax())) {
            calculationPipeline = new SalesTaxDecorator(calculationPipeline);
        }
        
        // 3. Wrap Pipeline with Late Fee Decorator (If Applicable and Payment is Late)
        if (isPaymentLate && config.getLateFeePercentage() != null) {
            calculationPipeline = new LateFeeDecorator(calculationPipeline);
        }
        
        // 4. Calculate Final Total!
        BigDecimal finalAmount = calculationPipeline.calculate(config, unitId);
        
        // 5. Generate and return the Charge Record
        return RentCycleChargeTbl.builder()
                .chargeType(RentChargeType.CUSTOM)
                .customChargeConfig(config)
                .amount(finalAmount)
                .description(config.getChargeName())
                .build();
    }
}
