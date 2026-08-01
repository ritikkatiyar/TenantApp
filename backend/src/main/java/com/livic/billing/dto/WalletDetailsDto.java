package com.livic.billing.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class WalletDetailsDto {
    private String id;
    private String userId;
    private BigDecimal creditBalance;
    private String currency;
    private String lastToppedUp;
}
