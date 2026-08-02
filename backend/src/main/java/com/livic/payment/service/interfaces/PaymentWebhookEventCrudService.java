package com.livic.payment.service.interfaces;

import com.livic.common.service.interfaces.CrudService;
import com.livic.payment.domain.PaymentWebhookEventTbl;

import java.util.UUID;

public interface PaymentWebhookEventCrudService extends CrudService<PaymentWebhookEventTbl, UUID> {
    boolean existsByEventId(String eventId);
}
