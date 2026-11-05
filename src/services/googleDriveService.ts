import { getGoogleAccessToken } from './googleAuth';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  parents?: string[];
}

export interface DriveStorageQuota {
  limit?: string;
  usage?: string;
  usageInDrive?: string;
  usageInDriveTrash?: string;
}

export const listDriveFiles = async (
  options: {
    query?: string;
    folderId?: string;
    pageSize?: number;
    mimeTypeFilter?: 'all' | 'spreadsheet' | 'folder' | 'document';
  } = {}
): Promise<GoogleDriveFile[]> => {
  const token = await getGoogleAccessToken();
  if (!token) {
    throw new Error('Anda belum terhubung dengan akun Google. Silakan masuk terlebih dahulu.');
  }

  const queryParts = ['trashed = false'];

  if (options.folderId) {
    queryParts.push(`'${options.folderId}' in parents`);
  }

  if (options.mimeTypeFilter === 'spreadsheet') {
    queryParts.push("mimeType = 'application/vnd.google-apps.spreadsheet'");
  } else if (options.mimeTypeFilter === 'folder') {
    queryParts.push("mimeType = 'application/vnd.google-apps.folder'");
  }

  if (options.query && options.query.trim()) {
    const cleanQ = options.query.replace(/'/g, "\\'");
    queryParts.push(`name contains '${cleanQ}'`);
  }

  const q = queryParts.join(' and ');
  const pageSize = options.pageSize || 30;

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', q);
  url.searchParams.set('pageSize', pageSize.toString());
  url.searchParams.set(
    'fields',
    'files(id, name, mimeType, modifiedTime, size, webViewLink, webContentLink, iconLink, thumbnailLink, parents)'
  );
  url.searchParams.set('orderBy', 'folder,modifiedTime desc');

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `Gagal mengambil daftar file Drive (${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
};

export const createDriveFolder = async (
  name: string,
  parentId?: string
): Promise<GoogleDriveFile> => {
  const token = await getGoogleAccessToken();
  if (!token) {
    throw new Error('Anda belum terhubung dengan akun Google.');
  }

  const metadata: Record<string, any> = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentId) {
    metadata.parents = [parentId];
  }

  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `Gagal membuat folder di Google Drive (${res.status})`);
  }

  return await res.json();
};

export const uploadFileToDrive = async (
  name: string,
  content: string | Blob,
  mimeType: string,
  parentId?: string
): Promise<GoogleDriveFile> => {
  const token = await getGoogleAccessToken();
  if (!token) {
    throw new Error('Anda belum terhubung dengan akun Google.');
  }

  const metadata: Record<string, any> = {
    name,
    mimeType,
  };

  if (parentId) {
    metadata.parents = [parentId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  let bodyContent = '';
  if (typeof content === 'string') {
    bodyContent = content;
  } else {
    bodyContent = await content.text();
  }

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    bodyContent +
    closeDelimiter;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,size,modifiedTime', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `Gagal mengunggah file ke Google Drive (${res.status})`);
  }

  return await res.json();
};

export const deleteDriveFile = async (fileId: string): Promise<boolean> => {
  const token = await getGoogleAccessToken();
  if (!token) {
    throw new Error('Anda belum terhubung dengan akun Google.');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok && res.status !== 204) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `Gagal menghapus file dari Google Drive (${res.status})`);
  }

  return true;
};

export const getDriveAbout = async (): Promise<{ user?: any; storageQuota?: DriveStorageQuota }> => {
  const token = await getGoogleAccessToken();
  if (!token) return {};

  try {
    const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota,user', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
};
