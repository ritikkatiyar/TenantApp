package com.tenantliving.unit.service.impl;

import com.tenantliving.unit.domain.UnitTbl;
import com.tenantliving.unit.repository.UnitRepository;
import com.tenantliving.unit.service.interfaces.UnitService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UnitServiceImpl implements UnitService {

    private final UnitRepository unitRepository;

    @Override
    public List<UnitTbl> saveAll(List<UnitTbl> units) {
        return unitRepository.saveAll(units);
    }
}
