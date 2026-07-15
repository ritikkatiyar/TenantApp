package com.tenantliving.announcement.service;

import com.tenantliving.announcement.domain.AnnouncementTbl;
import com.tenantliving.announcement.repository.AnnouncementRepository;
import com.tenantliving.announcement.service.interfaces.AnnouncementCrudService;
import com.tenantliving.common.service.impl.AbstractCrudService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class AnnouncementCrudServiceImpl extends AbstractCrudService<AnnouncementTbl, UUID, AnnouncementRepository> implements AnnouncementCrudService {

    public AnnouncementCrudServiceImpl(AnnouncementRepository announcementRepository) {
        super(announcementRepository);
    }

    @Override
    public List<AnnouncementTbl> findNoticesForTenant(UUID propertyId, String floor, String unitId) {
        return repository.findNoticesForTenant(propertyId, floor, unitId);
    }

    @Override
    public Page<AnnouncementTbl> findNoticesForTenant(UUID propertyId, String floor, String unitId, Pageable pageable) {
        return repository.findNoticesForTenant(propertyId, floor, unitId, pageable);
    }

    @Override
    public List<AnnouncementTbl> findByPropertyId(UUID propertyId) {
        return repository.findByPropertyId(propertyId);
    }

    @Override
    public Page<AnnouncementTbl> findByPropertyId(UUID propertyId, Pageable pageable) {
        return repository.findByPropertyId(propertyId, pageable);
    }
}
