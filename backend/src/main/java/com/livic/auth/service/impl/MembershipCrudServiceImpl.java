package com.livic.auth.service.impl;

import com.livic.auth.domain.MembershipTbl;
import com.livic.auth.repository.MembershipRepository;
import com.livic.auth.service.interfaces.MembershipCrudService;
import com.livic.common.service.impl.AbstractCrudService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class MembershipCrudServiceImpl extends AbstractCrudService<MembershipTbl, UUID, MembershipRepository> implements MembershipCrudService {

    public MembershipCrudServiceImpl(MembershipRepository repository) {
        super(repository);
    }

    @Override
    public List<MembershipTbl> findByUserId(UUID userId) {
        return repository.findByUserId(userId);
    }

    @Override
    public List<MembershipTbl> findByPropertyId(UUID propertyId) {
        return repository.findByPropertyId(propertyId);
    }

    @Override
    public List<MembershipTbl> findByUserIdAndPropertyId(UUID userId, UUID propertyId) {
        return repository.findByUserIdAndPropertyId(userId, propertyId);
    }

    @Override
    public boolean existsByUserIdAndPropertyId(UUID userId, UUID propertyId) {
        return repository.existsByUserIdAndPropertyId(userId, propertyId);
    }

    @Override
    @Cacheable(value = "userPermissions", key = "#userId.toString() + ':' + #propertyId.toString()")
    public Set<String> findPermissionCodesByUserIdAndPropertyId(UUID userId, UUID propertyId) {
        return repository.findPermissionCodesByUserIdAndPropertyId(userId, propertyId);
    }

    @Override
    public boolean existsByUserIdAndPropertyIdAndRoleCode(UUID userId, UUID propertyId, String roleCode) {
        return repository.existsByUserIdAndPropertyIdAndRoleCode(userId, propertyId, roleCode);
    }

    @Override
    public List<UUID> findPropertyIdsByUserId(UUID userId) {
        return repository.findPropertyIdsByUserId(userId);
    }

    @Override
    public List<MembershipTbl> findByPropertyIdAndRoleCode(UUID propertyId, String roleCode) {
        return repository.findByPropertyIdAndRoleCode(propertyId, roleCode);
    }

    @Override
    @CacheEvict(value = "userPermissions", allEntries = true)
    public void deleteByPropertyId(UUID propertyId) {
        repository.deleteByPropertyId(propertyId);
    }
}
