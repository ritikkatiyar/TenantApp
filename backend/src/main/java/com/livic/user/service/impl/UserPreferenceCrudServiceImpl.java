package com.livic.user.service.impl;

import com.livic.common.service.impl.AbstractCrudService;
import com.livic.user.domain.UserPreferenceTbl;
import com.livic.user.repository.UserPreferenceRepository;
import com.livic.user.service.interfaces.UserPreferenceCrudService;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class UserPreferenceCrudServiceImpl
        extends AbstractCrudService<UserPreferenceTbl, UUID, UserPreferenceRepository>
        implements UserPreferenceCrudService {

    public UserPreferenceCrudServiceImpl(UserPreferenceRepository repository) {
        super(repository);
    }

    @Override
    public Optional<UserPreferenceTbl> findByUserId(UUID userId) {
        return repository.findByUserId(userId);
    }
}
