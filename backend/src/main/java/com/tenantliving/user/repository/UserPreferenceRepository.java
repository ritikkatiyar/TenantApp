package com.tenantliving.user.repository;

import com.tenantliving.user.domain.UserPreferenceTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserPreferenceRepository extends JpaRepository<UserPreferenceTbl, UUID> {
    Optional<UserPreferenceTbl> findByUserId(UUID userId);
}
