package com.livic.user.service.interfaces;

import com.livic.user.domain.UserTbl;

public interface UserService {
    UserTbl createUser(UserTbl user);
    UserTbl saveUser(UserTbl user);
}
