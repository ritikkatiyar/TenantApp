package com.livic.user.facade;

import com.livic.user.dto.UserSummaryDTO;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public interface UserFacade {

    Optional<UserSummaryDTO> getUserById(UUID userId);

    Optional<UserSummaryDTO> getUserByEmail(String email);

    Optional<UserSummaryDTO> findByPhoneNumber(String phoneNumber);

    Map<UUID, UserSummaryDTO> getUsersByIds(Collection<UUID> userIds);

    boolean existsByEmail(String email);

    boolean existsById(UUID userId);

    UserSummaryDTO createUser(String email, String fullName, String phoneNumber, String password);
}
