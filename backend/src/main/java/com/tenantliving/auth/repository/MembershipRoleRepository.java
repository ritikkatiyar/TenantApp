package com.tenantliving.auth.repository;

import com.tenantliving.auth.domain.MembershipRoleTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MembershipRoleRepository extends JpaRepository<MembershipRoleTbl, UUID> {
    Optional<MembershipRoleTbl> findByCode(String code);
}
