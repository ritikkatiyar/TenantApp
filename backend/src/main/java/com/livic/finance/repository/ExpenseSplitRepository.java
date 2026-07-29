package com.livic.finance.repository;

import com.livic.common.domain.ExpenseSplitStatus;
import com.livic.finance.domain.ExpenseSplitTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExpenseSplitRepository extends JpaRepository<ExpenseSplitTbl, UUID> {
    List<ExpenseSplitTbl> findByExpense_Id(UUID expenseId);

    List<ExpenseSplitTbl> findByUserIdAndStatus(UUID userId, ExpenseSplitStatus status);
}
