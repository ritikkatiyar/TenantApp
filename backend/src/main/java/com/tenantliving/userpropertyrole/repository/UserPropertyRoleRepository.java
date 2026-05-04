package com.tenantliving.userpropertyrole.repository;

import com.tenantliving.userpropertyrole.domain.UserPropertyRoleTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface UserPropertyRoleRepository extends JpaRepository<UserPropertyRoleTbl, UUID> {
}
