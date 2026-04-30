package com.tenantliving.user;

import com.tenantliving.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepo extends JpaRepository<User, UUID> {

    // Used during login to link the Firebase/Cognito token to our internal user
    Optional<User> findByAuthUid(String authUid);

    // Used during the "Move-In" flow to find a tenant by their phone number
    Optional<User> findByPhoneNumber(String phoneNumber);
}