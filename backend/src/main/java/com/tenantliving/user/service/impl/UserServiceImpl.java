package com.tenantliving.user.service.impl;

import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.service.interfaces.UserCrudService;
import com.tenantliving.user.service.interfaces.UserService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserCrudService userCrudService;

    @Override
    public UserTbl createUser(UserTbl user) {
        String normalizedEmail = normalizeEmail(user.getAuthUid());
        if (userCrudService.findByAuthUid(normalizedEmail).isPresent()) {
            throw new BusinessException(HttpStatus.CONFLICT, "Email already registered");
        }
        return userCrudService.save(user);
    }

    @Override
    public UserTbl saveUser(UserTbl user) {
        return userCrudService.save(user);
    }

    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
