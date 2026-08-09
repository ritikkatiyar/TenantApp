package com.livic.announcement.repository;

import com.livic.announcement.domain.AnnouncementTbl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AnnouncementRepository extends JpaRepository<AnnouncementTbl, UUID> {

    @Query("SELECT a FROM AnnouncementTbl a WHERE a.propertyId = :propertyId AND " +
           "(a.targetType = com.livic.announcement.domain.AnnouncementTargetType.PROPERTY OR " +
           "(a.targetType = com.livic.announcement.domain.AnnouncementTargetType.FLOOR AND a.targetValue = :floor) OR " +
           "(a.targetType = com.livic.announcement.domain.AnnouncementTargetType.UNIT AND a.targetValue = :unitId))")
    Page<AnnouncementTbl> findNoticesForTenant(
            @Param("propertyId") UUID propertyId,
            @Param("floor") String floor,
            @Param("unitId") String unitId,
            Pageable pageable
    );

    Page<AnnouncementTbl> findByPropertyId(UUID propertyId, Pageable pageable);
}
