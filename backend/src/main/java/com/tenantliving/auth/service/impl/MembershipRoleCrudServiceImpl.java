package com.tenantliving.auth.service.impl;

import com.tenantliving.auth.domain.MembershipRoleTbl;
import com.tenantliving.auth.repository.MembershipRoleRepository;
import com.tenantliving.auth.service.interfaces.MembershipRoleCrudService;
import com.tenantliving.common.service.impl.AbstractCrudService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class MembershipRoleCrudServiceImpl extends AbstractCrudService<MembershipRoleTbl, UUID, MembershipRoleRepository> implements MembershipRoleCrudService {

    public MembershipRoleCrudServiceImpl(MembershipRoleRepository repository) {
        super(repository);
    }

    @Override
    public Optional<MembershipRoleTbl> findByCode(String code) {
        return repository.findByCode(code);
    }

    @Override
    public List<MembershipRoleTbl> findByPropertyId(UUID propertyId) {
        return repository.findByPropertyId(propertyId);
    }

    @Override
    public List<MembershipRoleTbl> findByPropertyIdIsNull() {
        return repository.findByPropertyIdIsNull();
    }

    @Override
    public Optional<MembershipRoleTbl> findByCodeAndPropertyId(String code, UUID propertyId) {
        return repository.findByCodeAndPropertyId(code, propertyId);
    }

    @Override
    public Optional<MembershipRoleTbl> findByCodeAndPropertyIdIsNull(String code) {
        return repository.findByCodeAndPropertyIdIsNull(code);
    }
}
