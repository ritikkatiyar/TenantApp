package com.livic.user.service.interfaces;

import com.livic.common.service.interfaces.CrudService;
import com.livic.user.domain.UserTbl;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserCrudService extends CrudService<UserTbl, UUID> {
    Optional<UserTbl> findByAuthUid(String authUid);
    Optional<UserTbl> findByPhoneNumber(String phoneNumber);
    List<UserTbl> findTop10ByPhoneNumberContaining(String phoneNumber);
}
