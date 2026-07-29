package com.livic.billing.service.interfaces;

import com.livic.billing.domain.BillingWalletTbl;
import com.livic.billing.domain.SaasSubscriptionTbl;

import java.util.UUID;

public interface BillingWalletService {

    /**
     * Checks if the user's wallet has enough credits.
     */
    boolean hasBalance(UUID userId, double requiredCredits);

    /**
     * Deducts credits from the user's wallet. Thread-safe to avoid race conditions.
     */
    void debitWallet(UUID userId, double requiredCredits, String reason);

    /**
     * Adds credits to the user's wallet.
     */
    void creditWallet(UUID userId, double credits, String reason, String referenceId);

    /**
     * Returns the remaining credit balance in the wallet.
     */
    double getRemainingBalance(UUID userId);

    /**
     * Resolves the wallet for a user, creating it if it doesn't exist.
     */
    BillingWalletTbl getOrCreateWallet(UUID userId);

    /**
     * Returns the current active subscription for a user.
     */
    SaasSubscriptionTbl getActiveSubscription(UUID userId);
}
