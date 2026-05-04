package com.tenantliving.auth.repository;

import com.tenantliving.auth.domain.RefreshTokenTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshTokenTbl, UUID> {

    Optional<RefreshTokenTbl> findByTokenHashAndRevokedIsFalse(String tokenHash);
}
