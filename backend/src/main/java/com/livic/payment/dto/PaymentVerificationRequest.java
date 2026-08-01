package com.livic.payment.dto;

public record PaymentVerificationRequest(
        String razorpayPaymentId,
        String razorpayOrderId,
        String razorpaySignature
) {}
