package com.livic.storage.service.interfaces;

import com.livic.storage.dto.OwnerModule;
import com.livic.storage.dto.MediaDTOs;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface StorageService {

    MediaDTOs.UploadAuthorizationResponse createUploadAuthorization(MediaDTOs.UploadAuthorizationRequest request, UUID userId);

    MediaDTOs.MediaAssetDTO confirmUpload(MediaDTOs.ConfirmUploadRequest request, UUID userId);

    List<MediaDTOs.MediaAssetDTO> listAssets(OwnerModule ownerModule, UUID referenceId);

    List<MediaDTOs.MediaAssetDTO> listAssetsForReferences(OwnerModule ownerModule, Collection<UUID> referenceIds);

    void deleteAsset(UUID mediaAssetId, UUID userId);
}
