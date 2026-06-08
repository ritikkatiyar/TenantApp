package com.tenantliving.user.service.impl;

import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.repository.UserRepository;
import com.tenantliving.user.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public UserTbl getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @Override
    public UserTbl getUserByEmail(String email) {
        return userRepository.findByAuthUid(normalizeEmail(email))
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @Override
    public Optional<UserTbl> findByEmail(String email) {
        return userRepository.findByAuthUid(normalizeEmail(email));
    }

    @Override
    public Optional<UserTbl> findByPhoneNumber(String phoneNumber) {
        return userRepository.findByPhoneNumber(normalizePhoneNumber(phoneNumber));
    }

    @Override
    public UserTbl createUser(UserTbl user) {
        if (existsByEmail(user.getAuthUid())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Email already registered");
        }
        return userRepository.save(user);
    }

    @Override
    public UserTbl saveUser(UserTbl user) {
        return userRepository.save(user);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.findByAuthUid(normalizeEmail(email)).isPresent();
    }

    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private static String normalizePhoneNumber(String phoneNumber) {
        return phoneNumber == null ? null : phoneNumber.trim();
    }

    @Override
    public java.util.Map<UUID, UserTbl> getUsersByIds(java.util.Collection<UUID> ids) {
        if (ids == null || ids.isEmpty()) return java.util.Collections.emptyMap();
        return userRepository.findAllById(ids).stream()
                .collect(java.util.stream.Collectors.toMap(UserTbl::getId, u -> u));
    }

    @Override
    public java.util.List<UserTbl> searchByPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return java.util.Collections.emptyList();
        }
        return userRepository.findTop10ByPhoneNumberContaining(phoneNumber.trim());
    }
}
