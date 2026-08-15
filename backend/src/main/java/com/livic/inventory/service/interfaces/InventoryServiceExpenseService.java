package com.livic.inventory.service.interfaces;

import com.livic.inventory.dto.InventoryDTOs;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface InventoryServiceExpenseService {

    InventoryDTOs.ServiceExpenseResponse recordExpense(UUID itemId, InventoryDTOs.ServiceExpenseRequest request, UUID userId);

    List<InventoryDTOs.ServiceExpenseResponse> listExpensesByItem(UUID itemId);

    Page<InventoryDTOs.ServiceExpenseResponse> listExpensesByProperty(UUID propertyId, Pageable pageable);
}
