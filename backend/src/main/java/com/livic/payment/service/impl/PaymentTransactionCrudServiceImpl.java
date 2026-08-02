package com.livic.payment.service.impl;

import com.livic.common.service.impl.AbstractCrudService;
import com.livic.payment.domain.PaymentTransactionTbl;
import com.livic.payment.repository.PaymentTransactionRepository;
import com.livic.payment.service.interfaces.PaymentTransactionCrudService;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class PaymentTransactionCrudServiceImpl
        extends AbstractCrudService<PaymentTransactionTbl, UUID, PaymentTransactionRepository>
        implements PaymentTransactionCrudService {

    public PaymentTransactionCrudServiceImpl(PaymentTransactionRepository repository) {
        super(repository);
    }

    @Override
    public Optional<PaymentTransactionTbl> findByGatewayTransactionId(String gatewayTransactionId) {
        return repository.findByGatewayTransactionId(gatewayTransactionId);
    }
}
