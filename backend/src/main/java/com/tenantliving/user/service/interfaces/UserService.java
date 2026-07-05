package com.tenantliving.user.service.interfaces;

import com.tenantliving.user.domain.UserTbl;

public interface UserService {
    UserTbl createUser(UserTbl user);
    UserTbl saveUser(UserTbl user);
}
