package com.livic.finance.service.interfaces;

import com.livic.finance.dto.ExpenseSplitDTOs;

import java.util.List;
import java.util.UUID;

public interface ExpenseSplitService {
    List<ExpenseSplitDTOs.ExpenseSplitResponse> generate(ExpenseSplitDTOs.GenerateExpenseSplitsRequest request);

    List<ExpenseSplitDTOs.ExpenseSplitResponse> myDues(UUID userId);

    ExpenseSplitDTOs.ExpenseSplitResponse settle(UUID id);
}
