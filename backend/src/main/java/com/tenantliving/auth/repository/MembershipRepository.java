package com.tenantliving.auth.repository;

import com.tenantliving.auth.domain.MembershipTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MembershipRepository extends JpaRepository<MembershipTbl, UUID> {
    List<MembershipTbl> findByUserId(UUID userId);
    List<MembershipTbl> findByPropertyId(UUID propertyId);
    Optional<MembershipTbl> findByUserIdAndPropertyId(UUID userId, UUID propertyId);
    boolean existsByUserIdAndPropertyId(UUID userId, UUID propertyId);
}
