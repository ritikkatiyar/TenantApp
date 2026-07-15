package com.tenantliving.announcement.repository;

import com.tenantliving.announcement.domain.AnnouncementTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnnouncementRepository extends JpaRepository<AnnouncementTbl, UUID> {

    @Query("SELECT a FROM AnnouncementTbl a WHERE a.property.id = :propertyId AND " +
           "(a.targetType = com.tenantliving.announcement.domain.AnnouncementTargetType.PROPERTY OR " +
           "(a.targetType = com.tenantliving.announcement.domain.AnnouncementTargetType.FLOOR AND a.targetValue = :floor) OR " +
           "(a.targetType = com.tenantliving.announcement.domain.AnnouncementTargetType.UNIT AND a.targetValue = :unitId))")
    List<AnnouncementTbl> findNoticesForTenant(
            @Param("propertyId") UUID propertyId,
            @Param("floor") String floor,
            @Param("unitId") String unitId
    );

    @Query("SELECT a FROM AnnouncementTbl a WHERE a.property.id = :propertyId AND " +
           "(a.targetType = com.tenantliving.announcement.domain.AnnouncementTargetType.PROPERTY OR " +
           "(a.targetType = com.tenantliving.announcement.domain.AnnouncementTargetType.FLOOR AND a.targetValue = :floor) OR " +
           "(a.targetType = com.tenantliving.announcement.domain.AnnouncementTargetType.UNIT AND a.targetValue = :unitId))")
    org.springframework.data.domain.Page<AnnouncementTbl> findNoticesForTenant(
            @Param("propertyId") UUID propertyId,
            @Param("floor") String floor,
            @Param("unitId") String unitId,
            org.springframework.data.domain.Pageable pageable
    );

    List<AnnouncementTbl> findByPropertyId(UUID propertyId);

    org.springframework.data.domain.Page<AnnouncementTbl> findByPropertyId(UUID propertyId, org.springframework.data.domain.Pageable pageable);
}
