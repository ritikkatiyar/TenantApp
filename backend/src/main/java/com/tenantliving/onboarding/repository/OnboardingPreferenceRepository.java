package com.tenantliving.onboarding.repository;

import com.tenantliving.onboarding.domain.OnboardingPreferenceTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OnboardingPreferenceRepository extends JpaRepository<OnboardingPreferenceTbl, UUID> {
    Optional<OnboardingPreferenceTbl> findByUserId(UUID userId);
}
