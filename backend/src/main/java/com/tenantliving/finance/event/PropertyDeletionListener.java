package com.tenantliving.finance.event;

import com.tenantliving.common.event.PropertyDeletionEvent;
import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.finance.repository.LeaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PropertyDeletionListener {

    private final LeaseRepository leaseRepository;

    @EventListener
    public void onBeforePropertyDelete(PropertyDeletionEvent event) {
        if (leaseRepository.existsByUnit_Property_Id(event.getPropertyId())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Cannot delete property because it has assigned tenants or leases.");
        }
    }
}
