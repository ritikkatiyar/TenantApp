package com.livic.billing.repository;

import com.livic.billing.domain.WalletTransactionTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransactionTbl, UUID> {
    List<WalletTransactionTbl> findByWalletIdOrderByCreatedAtDesc(UUID walletId);
}
