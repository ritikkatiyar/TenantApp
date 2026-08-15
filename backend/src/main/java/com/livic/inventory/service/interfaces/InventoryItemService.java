package com.livic.inventory.service.interfaces;

import com.livic.inventory.domain.enums.InventoryScope;
import com.livic.inventory.domain.enums.InventoryStatus;
import com.livic.inventory.dto.InventoryDTOs;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface InventoryItemService {

    InventoryDTOs.InventoryItemResponse createItem(InventoryDTOs.CreateInventoryItemRequest request, UUID userId);

    InventoryDTOs.InventoryItemResponse updateItem(UUID itemId, InventoryDTOs.UpdateInventoryItemRequest request, UUID userId);

    InventoryDTOs.InventoryItemResponse getItem(UUID itemId);

    List<InventoryDTOs.InventoryItemResponse> listItemsByProperty(
            UUID propertyId, 
            String query, 
            InventoryStatus status, 
            InventoryScope scope, 
            Boolean serviceDueOnly);

    Page<InventoryDTOs.InventoryItemResponse> listItemsByPropertyPaginated(UUID propertyId, Pageable pageable);

    InventoryDTOs.TenantVisibleInventoryResponse getTenantVisibleItems(UUID userId, UUID propertyId);

    InventoryDTOs.InventoryStatsResponse getInventoryStats(UUID propertyId);
}
