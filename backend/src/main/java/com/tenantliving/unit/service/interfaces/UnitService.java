package com.tenantliving.unit.service.interfaces;

import com.tenantliving.unit.domain.UnitTbl;
import java.util.List;

public interface UnitService {
    List<UnitTbl> saveAll(List<UnitTbl> units);
}
