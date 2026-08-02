package com.livic.payment.service.impl;

import com.livic.common.service.impl.AbstractCrudService;
import com.livic.payment.domain.PaymentWebhookEventTbl;
import com.livic.payment.repository.PaymentWebhookEventRepository;
import com.livic.payment.service.interfaces.PaymentWebhookEventCrudService;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class PaymentWebhookEventCrudServiceImpl
        extends AbstractCrudService<PaymentWebhookEventTbl, UUID, PaymentWebhookEventRepository>
        implements PaymentWebhookEventCrudService {

    public PaymentWebhookEventCrudServiceImpl(PaymentWebhookEventRepository repository) {
        super(repository);
    }

    @Override
    public boolean existsByEventId(String eventId) {
        return repository.existsByGatewayEventId(eventId);
    }
}
