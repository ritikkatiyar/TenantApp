package com.tenantliving.finance.strategy;

import com.tenantliving.finance.domain.ChargeConfigTbl;
import java.math.BigDecimal;
import java.math.RoundingMode;

public class LateFeeDecorator extends ChargeModifierDecorator {

    public LateFeeDecorator(ChargeCalculation wrappedCalculation) {
        super(wrappedCalculation);
    }

    @Override
    public BigDecimal calculate(ChargeConfigTbl config, Long unitId) {
        // Get the base amount (which might already include tax if wrapped sequentially)
        BigDecimal baseAmount = super.calculate(config, unitId);
        
        // Add the configured late fee percentage
        if (config.getLateFeePercentage() != null) {
            BigDecimal lateFeeRate = config.getLateFeePercentage().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
            BigDecimal penalty = baseAmount.multiply(lateFeeRate).setScale(2, RoundingMode.HALF_UP);
            return baseAmount.add(penalty);
        }
        
        return baseAmount;
    }
}
