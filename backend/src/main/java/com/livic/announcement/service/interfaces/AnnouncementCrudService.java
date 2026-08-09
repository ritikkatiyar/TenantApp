package com.livic.announcement.service.interfaces;

import com.livic.announcement.domain.AnnouncementTbl;
import com.livic.common.service.interfaces.CrudService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface AnnouncementCrudService extends CrudService<AnnouncementTbl, UUID> {
    Page<AnnouncementTbl> findNoticesForTenant(UUID propertyId, String floor, String unitId, Pageable pageable);
    Page<AnnouncementTbl> findByPropertyId(UUID propertyId, Pageable pageable);
}
