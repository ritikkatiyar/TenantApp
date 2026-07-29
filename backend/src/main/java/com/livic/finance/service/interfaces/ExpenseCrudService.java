package com.livic.finance.service.interfaces;

import com.livic.common.service.interfaces.CrudService;
import com.livic.finance.domain.ExpenseTbl;
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
