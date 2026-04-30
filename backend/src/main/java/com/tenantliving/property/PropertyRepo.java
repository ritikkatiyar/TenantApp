package com.tenantliving.property;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PropertyRepo extends JpaRepository<Property, UUID> {

    // Used for the Landlord's Dashboard to list all their buildings
    List<Property> findByOwnerId(UUID ownerId);
}