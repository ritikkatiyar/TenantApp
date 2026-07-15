package com.tenantliving.user.service.impl;

import com.tenantliving.common.service.impl.AbstractCrudService;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.repository.UserRepository;
import com.tenantliving.user.service.interfaces.UserCrudService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class UserCrudServiceImpl extends AbstractCrudService<UserTbl, UUID, UserRepository> implements UserCrudService {

    public UserCrudServiceImpl(UserRepository userRepository) {
        super(userRepository);
    }

    @Override
    public Optional<UserTbl> findByAuthUid(String authUid) {
        return repository.findByAuthUid(authUid);
    }

    @Override
    public Optional<UserTbl> findByPhoneNumber(String phoneNumber) {
        return repository.findByPhoneNumber(phoneNumber);
    }

    @Override
    public List<UserTbl> findTop10ByPhoneNumberContaining(String phoneNumber) {
        return repository.findTop10ByPhoneNumberContaining(phoneNumber);
    }
}
