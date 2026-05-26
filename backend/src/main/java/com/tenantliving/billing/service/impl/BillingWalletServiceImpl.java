package com.tenantliving.billing.service.impl;

import com.tenantliving.billing.domain.BillingWalletTbl;
import com.tenantliving.billing.domain.SaasSubscriptionTbl;
import com.tenantliving.billing.domain.WalletTransactionTbl;
import com.tenantliving.billing.repository.BillingWalletRepository;
import com.tenantliving.billing.repository.SaasSubscriptionRepository;
import com.tenantliving.billing.repository.WalletTransactionRepository;
import com.tenantliving.billing.service.interfaces.BillingWalletService;
import com.tenantliving.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillingWalletServiceImpl implements BillingWalletService {

    private final BillingWalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final SaasSubscriptionRepository subscriptionRepository;

    @Override
    @Transactional(readOnly = true)
    public boolean hasBalance(UUID userId, double requiredCredits) {
        if (requiredCredits <= 0) {
            return true;
        }
        BillingWalletTbl wallet = walletRepository.findByUserId(userId).orElse(null);
        if (wallet == null) {
            // New users start with a free trial of 50 credits
            return 50.0 >= requiredCredits;
        }
        return wallet.getCreditBalance().doubleValue() >= requiredCredits;
    }

    @Override
    @Transactional
    public void debitWallet(UUID userId, double requiredCredits, String reason) {
        log.info("[WALLET DEBIT] Processing debit of {} credits for user: {}, reason: {}", requiredCredits, userId, reason);

        BillingWalletTbl wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseGet(() -> {
                    // Create wallet on first usage with 50 starter credits
                    BillingWalletTbl newWallet = BillingWalletTbl.builder()
                            .userId(userId)
                            .creditBalance(BigDecimal.valueOf(50.0))
                            .currency("USD")
                            .build();
                    return walletRepository.save(newWallet);
                });

        BigDecimal deduction = BigDecimal.valueOf(requiredCredits);
        if (wallet.getCreditBalance().compareTo(deduction) < 0) {
            throw new BusinessException(
                    HttpStatus.PAYMENT_REQUIRED,
                    "Insufficient credits. Please top up your wallet or upgrade your plan."
            );
        }

        wallet.setCreditBalance(wallet.getCreditBalance().subtract(deduction));
        walletRepository.save(wallet);

        // Record the transaction
        WalletTransactionTbl transaction = WalletTransactionTbl.builder()
                .walletId(wallet.getId())
                .amount(deduction)
                .transactionType("DEBIT")
                .reason(reason)
                .build();
        transactionRepository.save(transaction);

        log.info("[WALLET DEBIT] Successfully debited {} credits from user: {}. New balance: {}", 
                requiredCredits, userId, wallet.getCreditBalance());
    }

    @Override
    @Transactional
    public void creditWallet(UUID userId, double credits, String reason, String referenceId) {
        log.info("[WALLET CREDIT] Processing credit of {} credits for user: {}, reason: {}", credits, userId, reason);

        BillingWalletTbl wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseGet(() -> {
                    BillingWalletTbl newWallet = BillingWalletTbl.builder()
                            .userId(userId)
                            .creditBalance(BigDecimal.ZERO)
                            .currency("USD")
                            .build();
                    return walletRepository.save(newWallet);
                });

        BigDecimal addition = BigDecimal.valueOf(credits);
        wallet.setCreditBalance(wallet.getCreditBalance().add(addition));
        wallet.setLastToppedUp(LocalDateTime.now());
        walletRepository.save(wallet);

        // Record the transaction
        WalletTransactionTbl transaction = WalletTransactionTbl.builder()
                .walletId(wallet.getId())
                .amount(addition)
                .transactionType("CREDIT")
                .reason(reason)
                .referenceId(referenceId)
                .build();
        transactionRepository.save(transaction);

        log.info("[WALLET CREDIT] Successfully credited {} credits to user: {}. New balance: {}", 
                credits, userId, wallet.getCreditBalance());
    }

    @Override
    @Transactional(readOnly = true)
    public double getRemainingBalance(UUID userId) {
        BillingWalletTbl wallet = walletRepository.findByUserId(userId).orElse(null);
        if (wallet == null) {
            return 50.0; // Starter tier default credits
        }
        return wallet.getCreditBalance().doubleValue();
    }

    @Override
    @Transactional
    public BillingWalletTbl getOrCreateWallet(UUID userId) {
        return walletRepository.findByUserId(userId)
                .orElseGet(() -> {
                    BillingWalletTbl newWallet = BillingWalletTbl.builder()
                            .userId(userId)
                            .creditBalance(BigDecimal.valueOf(50.0)) // Starter allocation
                            .currency("USD")
                            .build();
                    return walletRepository.save(newWallet);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public SaasSubscriptionTbl getActiveSubscription(UUID userId) {
        return subscriptionRepository.findByUserIdAndStatus(userId, "ACTIVE")
                .orElseGet(() -> {
                    // Return Starter / Free plan representation if no subscription exists
                    return SaasSubscriptionTbl.builder()
                            .userId(userId)
                            .planName("STARTER")
                            .status("ACTIVE")
                            .price(BigDecimal.ZERO)
                            .currentPeriodStart(LocalDateTime.now())
                            .currentPeriodEnd(LocalDateTime.now().plusYears(1))
                            .autoRenew(false)
                            .build();
                });
    }
}
