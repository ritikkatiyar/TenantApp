package com.tenantliving.user.service.interfaces;

import com.tenantliving.user.domain.UserTbl;

import java.util.Optional;
import java.util.UUID;

public interface UserService {
    UserTbl getUserById(UUID id);
    UserTbl getUserByEmail(String email);
    Optional<UserTbl> findByEmail(String email);
    UserTbl createUser(UserTbl user);
    UserTbl saveUser(UserTbl user);
    boolean existsByEmail(String email);
}
