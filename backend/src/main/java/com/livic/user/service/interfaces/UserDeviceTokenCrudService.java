package com.livic.user.service.interfaces;

import com.livic.common.service.interfaces.CrudService;
import com.livic.user.domain.UserDeviceTokenTbl;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserDeviceTokenCrudService extends CrudService<UserDeviceTokenTbl, UUID> {
    Optional<UserDeviceTokenTbl> findByExpoPushToken(String expoPushToken);
    List<UserDeviceTokenTbl> findByUserId(UUID userId);
}
