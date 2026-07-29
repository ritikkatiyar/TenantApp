package com.livic.property.service.impl;

import com.livic.common.service.impl.AbstractCrudService;
import com.livic.property.domain.UnitTbl;
import com.livic.property.repository.UnitRepository;
import com.livic.property.service.interfaces.UnitCrudService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class UnitCrudServiceImpl extends AbstractCrudService<UnitTbl, UUID, UnitRepository> implements UnitCrudService {

    public UnitCrudServiceImpl(UnitRepository unitRepository) {
        super(unitRepository);
    }

    @Override
    public List<UnitTbl> findByPropertyId(UUID propertyId) {
        return repository.findByPropertyId(propertyId);
    }

    @Override
    public boolean existsByPropertyIdAndUnitNumber(UUID propertyId, String unitNumber) {
        return repository.existsByPropertyIdAndUnitNumber(propertyId, unitNumber);
    }

    @Override
    public List<UnitTbl> findByPropertyIdAndFloor(UUID propertyId, Integer floor) {
        return repository.findByPropertyIdAndFloor(propertyId, floor);
    }

    @Override
    public int findMaxFloorByPropertyId(UUID propertyId) {
        return repository.findMaxFloorByPropertyId(propertyId);
    }

    @Override
    public void deleteByPropertyId(UUID propertyId) {
        repository.deleteByPropertyId(propertyId);
    }
}
