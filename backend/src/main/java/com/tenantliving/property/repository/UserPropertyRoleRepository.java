package com.tenantliving.property.repository;

import com.tenantliving.property.domain.UserPropertyRoleTbl;
import com.tenantliving.common.domain.PropertyRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserPropertyRoleRepository extends JpaRepository<UserPropertyRoleTbl, UUID> {
    @Query("select distinct upr.property.id from UserPropertyRoleTbl upr where upr.user.id = :userId")
    List<UUID> findPropertyIdsByUserId(@Param("userId") UUID userId);

    Optional<UserPropertyRoleTbl> findByUser_IdAndProperty_IdAndRole(UUID userId, UUID propertyId, PropertyRole role);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"property"})
    List<UserPropertyRoleTbl> findByUser_Id(UUID userId);

    void deleteByProperty_Id(UUID propertyId);
}
