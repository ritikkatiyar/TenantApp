import { apiRequest } from '@/src/api/client';

export type OwnerModule = 'PROPERTY' | 'LEASE' | 'INVENTORY';
export type FileType = 'IMAGE' | 'DOCUMENT';
export type StorageProvider = 'CLOUDINARY' | 'R2' | 'S3' | 'LOCAL';

export interface UploadAuthorizationRequest {
  ownerModule: OwnerModule;
  referenceId: string;
  fileType: FileType;
  filename?: string;
}

export interface UploadAuthorizationResponse {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId: string;
  storageProvider: StorageProvider;
  additionalParams?: Record<string, any>;
}

export interface ConfirmUploadRequest {
  ownerModule: OwnerModule;
  referenceId: string;
  externalId: string;
  url: string;
  fileType: FileType;
  caption?: string;
}

export interface MediaAssetDTO {
  id: string;
  ownerModule: OwnerModule;
  referenceId: string;
  storageProvider: StorageProvider;
  externalId: string;
  url: string;
  fileType: FileType;
  caption?: string;
  uploadedByUserId: string;
  uploadedAt: string;
}

export async function requestUploadAuthorization(
  params: UploadAuthorizationRequest,
  token: string
): Promise<UploadAuthorizationResponse> {
  return apiRequest<UploadAuthorizationResponse>('/api/v1/media/upload-authorization', {
    method: 'POST',
    token,
    body: JSON.stringify(params),
  });
}

export async function uploadToCloudinary(
  auth: UploadAuthorizationResponse,
  file: File | Blob | any
): Promise<{ public_id: string; secure_url: string; url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', auth.apiKey);
  formData.append('timestamp', String(auth.timestamp));
  formData.append('signature', auth.signature);
  formData.append('folder', auth.folder);
  formData.append('public_id', auth.publicId);

  const response = await fetch(auth.uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cloudinary upload failed: ${errText}`);
  }

  return response.json();
}

export async function confirmMediaUpload(
  params: ConfirmUploadRequest,
  token: string
): Promise<MediaAssetDTO> {
  return apiRequest<MediaAssetDTO>('/api/v1/media/confirm', {
    method: 'POST',
    token,
    body: JSON.stringify(params),
  });
}

export async function getMediaAssets(
  ownerModule: OwnerModule,
  referenceId: string,
  token: string
): Promise<MediaAssetDTO[]> {
  return apiRequest<MediaAssetDTO[]>(`/api/v1/media?ownerModule=${ownerModule}&referenceId=${referenceId}`, {
    method: 'GET',
    token,
  });
}

export async function deleteMediaAsset(
  id: string,
  token: string
): Promise<void> {
  return apiRequest<void>(`/api/v1/media/${id}`, {
    method: 'DELETE',
    token,
  });
}

export async function uploadAndConfirmMedia(
  file: File | Blob | any,
  params: {
    ownerModule: OwnerModule;
    referenceId: string;
    fileType: FileType;
    caption?: string;
  },
  token: string
): Promise<MediaAssetDTO> {
  const auth = await requestUploadAuthorization({
    ownerModule: params.ownerModule,
    referenceId: params.referenceId,
    fileType: params.fileType,
  }, token);

  const uploadResult = await uploadToCloudinary(auth, file);

  return confirmMediaUpload({
    ownerModule: params.ownerModule,
    referenceId: params.referenceId,
    externalId: uploadResult.public_id,
    url: uploadResult.secure_url || uploadResult.url,
    fileType: params.fileType,
    caption: params.caption,
  }, token);
}
