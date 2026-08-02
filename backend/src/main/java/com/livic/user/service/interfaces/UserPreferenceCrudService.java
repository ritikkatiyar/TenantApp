package com.livic.user.service.interfaces;

import com.livic.common.service.interfaces.CrudService;
import com.livic.user.domain.UserPreferenceTbl;

import java.util.Optional;
import java.util.UUID;

public interface UserPreferenceCrudService extends CrudService<UserPreferenceTbl, UUID> {
    Optional<UserPreferenceTbl> findByUserId(UUID userId);
}
