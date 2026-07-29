package com.livic.user.repository;

import com.livic.user.domain.UserTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<UserTbl, UUID> {
    Optional<UserTbl> findByAuthUid(String authUid);
    Optional<UserTbl> findByPhoneNumber(String phoneNumber);
    List<UserTbl> findTop10ByPhoneNumberContaining(String phoneNumber);
}
