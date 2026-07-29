package com.livic.auth.repository;

import com.livic.auth.domain.MembershipTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Repository
public interface MembershipRepository extends JpaRepository<MembershipTbl, UUID> {
    List<MembershipTbl> findByUserId(UUID userId);
    List<MembershipTbl> findByPropertyId(UUID propertyId);
    
    // A user can have multiple roles on the same property
    List<MembershipTbl> findByUserIdAndPropertyId(UUID userId, UUID propertyId);
    
    boolean existsByUserIdAndPropertyId(UUID userId, UUID propertyId);

    @Query("SELECT p.code FROM MembershipTbl m JOIN RolePermissionTbl rp ON m.role.id = rp.role.id JOIN PermissionTbl p ON rp.permission.id = p.id WHERE m.user.id = :userId AND m.property.id = :propertyId")
    Set<String> findPermissionCodesByUserIdAndPropertyId(@Param("userId") UUID userId, @Param("propertyId") UUID propertyId);

    @Query("SELECT COUNT(m) > 0 FROM MembershipTbl m WHERE m.user.id = :userId AND m.property.id = :propertyId AND m.role.code = :roleCode")
    boolean existsByUserIdAndPropertyIdAndRoleCode(@Param("userId") UUID userId, @Param("propertyId") UUID propertyId, @Param("roleCode") String roleCode);

    @Query("SELECT DISTINCT m.property.id FROM MembershipTbl m WHERE m.user.id = :userId AND m.property IS NOT NULL")
    List<UUID> findPropertyIdsByUserId(@Param("userId") UUID userId);

    @Query("SELECT m FROM MembershipTbl m WHERE m.property.id = :propertyId AND m.role.code = :roleCode")
    List<MembershipTbl> findByPropertyIdAndRoleCode(@Param("propertyId") UUID propertyId, @Param("roleCode") String roleCode);

    void deleteByPropertyId(UUID propertyId);
}
