package com.tenantliving.finance.strategy;

import com.tenantliving.finance.domain.ChargeConfigTbl;
import java.math.BigDecimal;

public abstract class ChargeModifierDecorator implements ChargeCalculation {
    
    protected final ChargeCalculation wrappedCalculation;

    public ChargeModifierDecorator(ChargeCalculation wrappedCalculation) {
        this.wrappedCalculation = wrappedCalculation;
    }

    @Override
    public BigDecimal calculate(ChargeConfigTbl config, Long unitId) {
        return wrappedCalculation.calculate(config, unitId);
    }
}
