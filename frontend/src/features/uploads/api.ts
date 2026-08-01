import { apiClient } from '@/api/client/api-client';

type Presign = {
  upload_id: string;
  object_key: string;
  upload_url: string;
  expires_in: number;
};
type Complete = { id: string; object_key: string; status: string; created_at: string };
export async function uploadFile(
  token: string,
  uri: string,
  filename: string,
  contentType: 'image/jpeg' | 'image/png' | 'image/webp',
) {
  const fileInfo = await fetch(uri);
  const blob = await fileInfo.blob();
  const presign = await apiClient<Presign>('/api/v1/uploads/presign', {
    method: 'POST',
    accessToken: token,
    body: { filename, content_type: contentType, size_bytes: blob.size },
  });
  const upload = await fetch(presign.upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });
  if (!upload.ok) throw new Error('Dosya yüklenemedi.');
  return apiClient<Complete>('/api/v1/uploads/complete', {
    method: 'POST',
    accessToken: token,
    body: { upload_id: presign.upload_id },
  });
}
