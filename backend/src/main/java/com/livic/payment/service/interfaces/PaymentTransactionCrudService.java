package com.livic.payment.service.interfaces;

import com.livic.common.service.interfaces.CrudService;
import com.livic.payment.domain.PaymentTransactionTbl;

import java.util.Optional;
import java.util.UUID;

public interface PaymentTransactionCrudService extends CrudService<PaymentTransactionTbl, UUID> {
    Optional<PaymentTransactionTbl> findByGatewayTransactionId(String gatewayTransactionId);
}
