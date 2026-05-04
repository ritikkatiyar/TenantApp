package com.tenantliving.user.service.impl;

import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.repository.UserRepository;
import com.tenantliving.user.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public UserTbl getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    @Override
    public UserTbl getUserByEmail(String email) {
        return userRepository.findByAuthUid(normalizeEmail(email))
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    @Override
    public UserTbl createUser(UserTbl user) {
        if (existsByEmail(user.getAuthUid())) {
            throw new RuntimeException("Email already registered: " + user.getAuthUid());
        }
        return userRepository.save(user);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.findByAuthUid(normalizeEmail(email)).isPresent();
    }

    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
