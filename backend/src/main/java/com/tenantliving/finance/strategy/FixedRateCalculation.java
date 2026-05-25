package com.tenantliving.finance.strategy;

import com.tenantliving.common.domain.CalculationStrategyType;
import com.tenantliving.finance.domain.ChargeConfigTbl;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class FixedRateCalculation implements ChargeCalculation {

    @Override
    public CalculationStrategyType getStrategyType() {
        return CalculationStrategyType.FIXED_RATE;
    }

    @Override
    public BigDecimal calculate(ChargeConfigTbl config, Long unitId) {
        return config.getBaseRate();
    }
}
