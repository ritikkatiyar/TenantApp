package com.livic.storage.repository;

import com.livic.storage.domain.MediaAssetTbl;
import com.livic.storage.dto.OwnerModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface MediaAssetRepository extends JpaRepository<MediaAssetTbl, UUID> {

    List<MediaAssetTbl> findAllByOwnerModuleAndReferenceId(OwnerModule ownerModule, UUID referenceId);

    List<MediaAssetTbl> findAllByOwnerModuleAndReferenceIdIn(OwnerModule ownerModule, Collection<UUID> referenceIds);

    void deleteAllByOwnerModuleAndReferenceId(OwnerModule ownerModule, UUID referenceId);
}
