package com.tenantliving.auth.repository;

import com.tenantliving.auth.domain.PermissionTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PermissionRepository extends JpaRepository<PermissionTbl, UUID> {
    Optional<PermissionTbl> findByCode(String code);
}
