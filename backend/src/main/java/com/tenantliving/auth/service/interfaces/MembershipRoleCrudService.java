package com.tenantliving.auth.service.interfaces;

import com.tenantliving.auth.domain.MembershipRoleTbl;
import com.tenantliving.common.service.interfaces.CrudService;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MembershipRoleCrudService extends CrudService<MembershipRoleTbl, UUID> {
    Optional<MembershipRoleTbl> findByCode(String code);
    List<MembershipRoleTbl> findByPropertyId(UUID propertyId);
    List<MembershipRoleTbl> findByPropertyIdIsNull();
    Optional<MembershipRoleTbl> findByCodeAndPropertyId(String code, UUID propertyId);
    Optional<MembershipRoleTbl> findByCodeAndPropertyIdIsNull(String code);
}
