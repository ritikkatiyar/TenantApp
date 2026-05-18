package com.tenantliving.ai.service;

import com.tenantliving.ai.dto.AICommandDTOs;
import com.tenantliving.auth.principal.UserDetailsImpl;

public interface AICommandService {
    AICommandDTOs.AICommandResponse handleCommand(
            AICommandDTOs.AICommandRequest request,
            UserDetailsImpl currentUser
    );
}
