package com.tenantliving.payment.service.impl;

import com.razorpay.Utils;
import com.tenantliving.common.event.PaymentConfirmedEvent;
import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.payment.config.RazorpayProperties;
import com.tenantliving.payment.domain.PaymentTransactionTbl;
import com.tenantliving.payment.domain.PaymentWebhookEventTbl;
import com.tenantliving.payment.repository.PaymentTransactionRepository;
import com.tenantliving.payment.repository.PaymentWebhookEventRepository;
import com.tenantliving.payment.service.PaymentGatewayRouter;
import com.tenantliving.payment.service.interfaces.PaymentTransactionService;
import com.tenantliving.billing.domain.PaymentGatewayType;
import com.tenantliving.billing.dto.PaymentIntentRequest;
import com.tenantliving.billing.dto.PaymentIntentResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PaymentTransactionServiceImpl implements PaymentTransactionService {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final PaymentWebhookEventRepository paymentWebhookEventRepository;
    private final PaymentGatewayRouter paymentGatewayRouter;
    private final RazorpayProperties razorpayProperties;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public PaymentTransactionTbl initiateOnlinePayment(UUID payerUserId, String referenceType, UUID referenceId, BigDecimal amount) {
        log.info("Initiating online payment for user: {}, refType: {}, refId: {}, amount: {}", payerUserId, referenceType, referenceId, amount);

        // 1. Request Razorpay order from the gateway
        PaymentIntentRequest intentRequest = new PaymentIntentRequest(
                payerUserId.toString(),
                amount.doubleValue(),
                "INR",
                "Rent statement online payment",
                "billing@tenantliving.com",
                com.tenantliving.billing.domain.PaymentGatewayType.RAZORPAY
        );
        PaymentIntentResponse intentResponse = paymentGatewayRouter
                .getGateway(PaymentGatewayType.RAZORPAY)
                .createPaymentIntent(intentRequest);

        // 2. Save the transaction with status INITIATED
        PaymentTransactionTbl transaction = PaymentTransactionTbl.builder()
                .payerUserId(payerUserId)
                .paymentMethod("ONLINE")
                .referenceType(referenceType)
                .referenceId(referenceId)
                .gatewayName("RAZORPAY")
                .gatewayTransactionId(intentResponse.gatewayTransactionId())
                .amount(amount)
                .status("INITIATED")
                .build();

        return paymentTransactionRepository.save(transaction);
    }

    @Override
    public PaymentTransactionTbl recordCashPayment(UUID payerUserId, String referenceType, UUID referenceId, BigDecimal amount, UUID confirmedBy, String note) {
        log.info("Recording cash payment for user: {}, refType: {}, refId: {}, amount: {}, confirmedBy: {}", payerUserId, referenceType, referenceId, amount, confirmedBy);

        PaymentTransactionTbl transaction = PaymentTransactionTbl.builder()
                .payerUserId(payerUserId)
                .paymentMethod("CASH")
                .referenceType(referenceType)
                .referenceId(referenceId)
                .amount(amount)
                .status("SUCCESS")
                .confirmedBy(confirmedBy)
                .confirmedAt(LocalDateTime.now())
                .note(note)
                .build();

        transaction = paymentTransactionRepository.save(transaction);

        // Publish event to trigger downstream modules (finance/rent/bookings)
        eventPublisher.publishEvent(new PaymentConfirmedEvent(
                this,
                referenceType,
                referenceId,
                transaction.getId(),
                amount,
                "CASH"
        ));

        return transaction;
    }

    @Override
    public void handleWebhook(String gatewayName, String payload, String signatureHeader) {
        log.info("Handling webhook from gateway: {}", gatewayName);

        if (!"RAZORPAY".equalsIgnoreCase(gatewayName)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Unsupported webhook gateway: " + gatewayName);
        }

        // 1. Verify Signature
        try {
            boolean isValid = Utils.verifyWebhookSignature(payload, signatureHeader, razorpayProperties.getWebhookSecret());
            if (!isValid) {
                log.error("Razorpay webhook signature verification failed!");
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Invalid signature");
            }
        } catch (Exception e) {
            log.error("Razorpay webhook signature validation error", e);
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Signature verification error");
        }

        // 2. Parse Webhook Event
        JSONObject webhookJson = new JSONObject(payload);
        String eventId = webhookJson.optString("id");
        String eventType = webhookJson.optString("event");

        // Idempotency check
        if (paymentWebhookEventRepository.existsByGatewayEventId(eventId)) {
            log.info("Webhook event {} already processed. Skipping.", eventId);
            return;
        }

        // 3. Persist Webhook Event
        PaymentWebhookEventTbl eventEntity = PaymentWebhookEventTbl.builder()
                .gatewayName("RAZORPAY")
                .gatewayEventId(eventId)
                .eventType(eventType)
                .payload(payload)
                .processedAt(LocalDateTime.now())
                .build();
        paymentWebhookEventRepository.save(eventEntity);

        // 4. Process Payment Success Event
        if ("order.paid".equals(eventType) || "payment.captured".equals(eventType)) {
            JSONObject eventPayload = webhookJson.optJSONObject("payload");
            if (eventPayload != null) {
                JSONObject paymentObj = eventPayload.optJSONObject("payment");
                if (paymentObj != null) {
                    JSONObject entityObj = paymentObj.optJSONObject("entity");
                    if (entityObj != null) {
                        String orderId = entityObj.optString("order_id");
                        String paymentMethod = entityObj.optString("method", "ONLINE");

                        PaymentTransactionTbl transaction = paymentTransactionRepository.findByGatewayTransactionId(orderId)
                                .orElse(null);

                        if (transaction != null && !"SUCCESS".equals(transaction.getStatus())) {
                            transaction.setStatus("SUCCESS");
                            transaction.setConfirmedAt(LocalDateTime.now());
                            paymentTransactionRepository.save(transaction);

                            // Publish payment confirmation event
                            eventPublisher.publishEvent(new PaymentConfirmedEvent(
                                    this,
                                    transaction.getReferenceType(),
                                    transaction.getReferenceId(),
                                    transaction.getId(),
                                    transaction.getAmount(),
                                    paymentMethod.toUpperCase()
                            ));
                            log.info("Successfully processed payment webhook for order: {}", orderId);
                        }
                    }
                }
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.Optional<PaymentTransactionTbl> findTransactionById(UUID id) {
        return paymentTransactionRepository.findById(id);
    }
}
