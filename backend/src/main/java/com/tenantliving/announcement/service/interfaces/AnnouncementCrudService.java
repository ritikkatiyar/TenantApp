package com.tenantliving.announcement.service.interfaces;

import com.tenantliving.announcement.domain.AnnouncementTbl;
import com.tenantliving.common.service.interfaces.CrudService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface AnnouncementCrudService extends CrudService<AnnouncementTbl, UUID> {
    List<AnnouncementTbl> findNoticesForTenant(UUID propertyId, String floor, String unitId);
    Page<AnnouncementTbl> findNoticesForTenant(UUID propertyId, String floor, String unitId, Pageable pageable);
    List<AnnouncementTbl> findByPropertyId(UUID propertyId);
    Page<AnnouncementTbl> findByPropertyId(UUID propertyId, Pageable pageable);
}
