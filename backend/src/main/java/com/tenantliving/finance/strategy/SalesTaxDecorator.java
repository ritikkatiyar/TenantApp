package com.tenantliving.finance.strategy;

import com.tenantliving.finance.domain.ChargeConfigTbl;
import java.math.BigDecimal;
import java.math.RoundingMode;

public class SalesTaxDecorator extends ChargeModifierDecorator {

    public SalesTaxDecorator(ChargeCalculation wrappedCalculation) {
        super(wrappedCalculation);
    }

    @Override
    public BigDecimal calculate(ChargeConfigTbl config, Long unitId) {
        // Get the base amount
        BigDecimal baseAmount = super.calculate(config, unitId);
        
        // Example: Apply a flat 5% state tax (0.05) if the config requires it
        BigDecimal taxRate = new BigDecimal("0.05");
        BigDecimal taxAmount = baseAmount.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        
        return baseAmount.add(taxAmount);
    }
}
