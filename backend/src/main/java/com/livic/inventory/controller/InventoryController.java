package com.livic.inventory.controller;

import com.livic.auth.principal.UserDetailsImpl;
import com.livic.common.response.ApiResponse;
import com.livic.inventory.domain.enums.InventoryScope;
import com.livic.inventory.domain.enums.InventoryStatus;
import com.livic.inventory.dto.InventoryDTOs;
import com.livic.inventory.service.interfaces.InventoryItemService;
import com.livic.inventory.service.interfaces.InventoryServiceExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryItemService inventoryItemService;
    private final InventoryServiceExpenseService serviceExpenseService;

    @GetMapping("/properties/{propertyId}/items")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
    public ResponseEntity<ApiResponse<List<InventoryDTOs.InventoryItemResponse>>> listPropertyItems(
            @PathVariable UUID propertyId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) InventoryStatus status,
            @RequestParam(required = false) InventoryScope scope,
            @RequestParam(required = false) Boolean serviceDueOnly) {
        List<InventoryDTOs.InventoryItemResponse> items = inventoryItemService.listItemsByProperty(
                propertyId, q, status, scope, serviceDueOnly
        );
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @PostMapping("/items")
    @PreAuthorize("@authorizationService.hasPermission(#request.propertyId(), 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<InventoryDTOs.InventoryItemResponse>> createItem(
            @Valid @RequestBody InventoryDTOs.CreateInventoryItemRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID userId = UUID.fromString(currentUser.getId());
        InventoryDTOs.InventoryItemResponse response = inventoryItemService.createItem(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @PutMapping("/items/{itemId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<InventoryDTOs.InventoryItemResponse>> updateItem(
            @PathVariable UUID itemId,
            @Valid @RequestBody InventoryDTOs.UpdateInventoryItemRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID userId = UUID.fromString(currentUser.getId());
        InventoryDTOs.InventoryItemResponse response = inventoryItemService.updateItem(itemId, request, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/items/{itemId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<InventoryDTOs.InventoryItemResponse>> getItem(@PathVariable UUID itemId) {
        return ResponseEntity.ok(ApiResponse.success(inventoryItemService.getItem(itemId)));
    }

    @PostMapping("/items/{itemId}/service-expenses")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<InventoryDTOs.ServiceExpenseResponse>> recordServiceExpense(
            @PathVariable UUID itemId,
            @Valid @RequestBody InventoryDTOs.ServiceExpenseRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID userId = UUID.fromString(currentUser.getId());
        InventoryDTOs.ServiceExpenseResponse response = serviceExpenseService.recordExpense(itemId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping("/items/{itemId}/service-expenses")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<InventoryDTOs.ServiceExpenseResponse>>> listServiceExpenses(@PathVariable UUID itemId) {
        return ResponseEntity.ok(ApiResponse.success(serviceExpenseService.listExpensesByItem(itemId)));
    }

    @GetMapping("/properties/{propertyId}/stats")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
    public ResponseEntity<ApiResponse<InventoryDTOs.InventoryStatsResponse>> getPropertyStats(@PathVariable UUID propertyId) {
        return ResponseEntity.ok(ApiResponse.success(inventoryItemService.getInventoryStats(propertyId)));
    }

    @GetMapping("/my-visible-items")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<InventoryDTOs.TenantVisibleInventoryResponse>> getTenantVisibleItems(
            @RequestParam UUID propertyId,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID userId = UUID.fromString(currentUser.getId());
        InventoryDTOs.TenantVisibleInventoryResponse response = inventoryItemService.getTenantVisibleItems(userId, propertyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
