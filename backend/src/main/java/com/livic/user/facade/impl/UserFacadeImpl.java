package com.livic.user.facade.impl;

import com.livic.common.domain.UserRole;
import com.livic.user.domain.UserTbl;
import com.livic.user.dto.UserSummaryDTO;
import com.livic.user.facade.UserFacade;
import com.livic.user.service.interfaces.UserCrudService;
import com.livic.user.service.interfaces.UserQueryService;
import com.livic.user.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserFacadeImpl implements UserFacade {

    private final UserQueryService userQueryService;
    private final UserCrudService userCrudService;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public Optional<UserSummaryDTO> getUserById(UUID userId) {
        return userCrudService.findById(userId)
                .map(UserSummaryDTO::from);
    }

    @Override
    public Optional<UserSummaryDTO> getUserByEmail(String email) {
        return userQueryService.findByEmail(email)
                .map(UserSummaryDTO::from);
    }

    @Override
    public Optional<UserSummaryDTO> findByPhoneNumber(String phoneNumber) {
        return userQueryService.findByPhoneNumber(phoneNumber)
                .map(UserSummaryDTO::from);
    }

    @Override
    public Map<UUID, UserSummaryDTO> getUsersByIds(Collection<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<UUID, UserTbl> map = userQueryService.getUsersByIds(userIds);
        return map.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> UserSummaryDTO.from(e.getValue())
                ));
    }

    @Override
    public boolean existsByEmail(String email) {
        return userQueryService.existsByEmail(email);
    }

    @Override
    public boolean existsById(UUID userId) {
        return userCrudService.existsById(userId);
    }

    @Override
    @Transactional
    public UserSummaryDTO createUser(String email, String fullName, String phoneNumber, String password) {
        UserTbl newUser = UserTbl.builder()
                .authUid(email != null ? email.trim().toLowerCase() : "")
                .fullName(fullName != null ? fullName.trim() : "")
                .phoneNumber(phoneNumber != null ? phoneNumber.trim() : "")
                .passwordHash(passwordEncoder.encode(password != null ? password : ""))
                .globalRole(UserRole.USER)
                .build();
        UserTbl saved = userService.createUser(newUser);
        return UserSummaryDTO.from(saved);
    }
}
