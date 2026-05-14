package com.tenantliving.expensegroup.repository;

import com.tenantliving.expensegroup.domain.ExpenseGroupTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ExpenseGroupRepository extends JpaRepository<ExpenseGroupTbl, UUID> {
}
