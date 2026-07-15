package com.tenantliving.finance.service.interfaces;

import com.tenantliving.common.service.interfaces.CrudService;
import com.tenantliving.finance.domain.ExpenseTbl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.UUID;

public interface ExpenseCrudService extends CrudService<ExpenseTbl, UUID> {
    List<ExpenseTbl> findByExpenseGroup_Id(UUID expenseGroupId);
    List<ExpenseTbl> findByBillingMonth(String billingMonth);
    Page<ExpenseTbl> findAll(Specification<ExpenseTbl> spec, Pageable pageable);
    List<ExpenseTbl> findAll(Specification<ExpenseTbl> spec);
}
