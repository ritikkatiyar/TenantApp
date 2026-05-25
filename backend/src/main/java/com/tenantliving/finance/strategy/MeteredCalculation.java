package com.tenantliving.finance.strategy;

import com.tenantliving.common.domain.CalculationStrategyType;
import com.tenantliving.finance.domain.ChargeConfigTbl;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class MeteredCalculation implements ChargeCalculation {

    // Note: In a real implementation, you would inject a MeterReadingRepository here
    // to fetch the latest consumption values. We will mock the lookup for now.
    
    @Override
    public CalculationStrategyType getStrategyType() {
        return CalculationStrategyType.METERED;
    }

    @Override
    public BigDecimal calculate(ChargeConfigTbl config, Long unitId) {
        // Mock consumption multiplier (e.g., 150 units of electricity used)
        BigDecimal mockRecentConsumption = new BigDecimal("150.00");
        
        if (config.getBaseRate() == null) {
            return BigDecimal.ZERO;
        }
        
        return config.getBaseRate().multiply(mockRecentConsumption);
    }
}
