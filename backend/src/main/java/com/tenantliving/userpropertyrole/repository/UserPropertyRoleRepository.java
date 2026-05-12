package com.tenantliving.userpropertyrole.repository;

import com.tenantliving.userpropertyrole.domain.UserPropertyRoleTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserPropertyRoleRepository extends JpaRepository<UserPropertyRoleTbl, UUID> {
    @Query("select distinct upr.property.id from UserPropertyRoleTbl upr where upr.user.id = :userId")
    List<UUID> findPropertyIdsByUserId(@Param("userId") UUID userId);
}
