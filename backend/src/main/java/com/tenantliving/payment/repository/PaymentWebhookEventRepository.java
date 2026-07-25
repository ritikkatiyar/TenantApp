package com.tenantliving.payment.repository;

import com.tenantliving.payment.domain.PaymentWebhookEventTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PaymentWebhookEventRepository extends JpaRepository<PaymentWebhookEventTbl, UUID> {
    boolean existsByGatewayEventId(String gatewayEventId);
}
