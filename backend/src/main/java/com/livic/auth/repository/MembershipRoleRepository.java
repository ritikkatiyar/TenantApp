package com.livic.auth.repository;

import com.livic.auth.domain.MembershipRoleTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MembershipRoleRepository extends JpaRepository<MembershipRoleTbl, UUID> {
    Optional<MembershipRoleTbl> findByCode(String code);
    
    java.util.List<MembershipRoleTbl> findByPropertyId(UUID propertyId);
    java.util.List<MembershipRoleTbl> findByPropertyIdIsNull();
    
    Optional<MembershipRoleTbl> findByCodeAndPropertyId(String code, UUID propertyId);
    Optional<MembershipRoleTbl> findByCodeAndPropertyIdIsNull(String code);
}

