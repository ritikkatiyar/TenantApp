package com.tenantliving.user.service.interfaces;

import com.tenantliving.user.dto.MeDTOs;
import java.util.UUID;

public interface MeService {
    MeDTOs.MyContextResponse getUserContext(UUID userId);
}
