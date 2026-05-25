package com.tenantliving.finance.strategy;

import com.tenantliving.finance.domain.ChargeConfigTbl;
import com.tenantliving.common.domain.CalculationStrategyType;
import java.math.BigDecimal;

public interface ChargeCalculation {
    /**
     * Calculates the charge amount for a given unit.
     */
    BigDecimal calculate(ChargeConfigTbl config, Long unitId);
    
    /**
     * Returns the strategy type this calculation handles (only relevant for base strategies).
     */
    default CalculationStrategyType getStrategyType() {
        return null;
    }
}
