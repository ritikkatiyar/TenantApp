package com.tenantliving.user.service.interfaces;

import com.tenantliving.common.service.interfaces.CrudService;
import com.tenantliving.user.domain.UserTbl;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserCrudService extends CrudService<UserTbl, UUID> {
    Optional<UserTbl> findByAuthUid(String authUid);
    Optional<UserTbl> findByPhoneNumber(String phoneNumber);
    List<UserTbl> findTop10ByPhoneNumberContaining(String phoneNumber);
}
