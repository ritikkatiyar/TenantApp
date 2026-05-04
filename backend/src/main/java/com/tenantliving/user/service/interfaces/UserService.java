package com.tenantliving.user.service.interfaces;

import com.tenantliving.user.domain.UserTbl;

import java.util.UUID;

public interface UserService {
    UserTbl getUserById(UUID id);
    UserTbl getUserByEmail(String email);
    UserTbl createUser(UserTbl user);
    boolean existsByEmail(String email);
}
