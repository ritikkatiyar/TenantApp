package com.livic.user.facade;

import com.livic.user.domain.DevicePlatform;
import com.livic.user.domain.UserMode;
import com.livic.user.dto.UserSummaryDTO;

import java.util.Collection;
import java.util.List;
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

    UserMode getActiveModeForUser(UUID userId);

    void registerDeviceToken(UUID userId, String expoPushToken, DevicePlatform platform);

    List<String> getActiveDeviceTokens(UUID userId);

    List<UUID> getUserIdsBySearch(String searchPattern);
}
