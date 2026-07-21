import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

export const GOOGLE_CLIENT_ID = '8457164651-8v96oupntai1g3kc4trk2pfdrh372p8i.apps.googleusercontent.com';
export const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const TOKEN_KEY = 'gdrive_access_token';
const EXPIRY_KEY = 'gdrive_token_expiry';

export const saveDriveToken = async (accessToken: string, expiresInSec?: number) => {
  const expiry = Date.now() + ((expiresInSec ?? 3500) * 1000) - 60_000;
  await AsyncStorage.multiSet([[TOKEN_KEY, accessToken], [EXPIRY_KEY, String(expiry)]]);
};

export const getStoredDriveToken = async (): Promise<string | null> => {
  const [[, token], [, expiry]] = await AsyncStorage.multiGet([TOKEN_KEY, EXPIRY_KEY]);
  if (!token || !expiry || Date.now() > Number(expiry)) return null;
  return token;
};

const driveQuery = async (token: string, q: string) => {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=5`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Drive search failed (${res.status})`);
  const json = await res.json();
  return json.files || [];
};

const createFolder = async (token: string, name: string, parentId?: string) => {
  const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId ? { parents: [parentId] } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Drive folder create failed (${res.status})`);
  return (await res.json()).id as string;
};

// Find-or-create a folder by name (optionally inside a parent)
const ensureFolder = async (token: string, name: string, parentId?: string): Promise<string> => {
  const safe = name.replace(/'/g, "\\'");
  let q = `name='${safe}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentId) q += ` and '${parentId}' in parents`;
  const found = await driveQuery(token, q);
  if (found.length > 0) return found[0].id;
  return createFolder(token, name, parentId);
};

const getBase64 = async (uri: string): Promise<string> => {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result).split(',')[1] || '');
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
};

/**
 * Upload a receipt image to Google Drive under Fleeto/<vehicle>/<filename>.
 * Returns the file's webViewLink.
 */
export const uploadReceiptToDrive = async (
  token: string,
  vehicleFolder: string,
  imageUri: string,
  filename: string
): Promise<string> => {
  const fleetoId = await ensureFolder(token, 'Fleeto');
  const vehicleId = await ensureFolder(token, vehicleFolder || 'Unassigned', fleetoId);

  const base64 = await getBase64(imageUri);
  const ext = (filename.split('.').pop() || 'jpg').toLowerCase();
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const metadata = { name: filename, parents: [vehicleId] };

  const boundary = 'fleeto_upload_boundary';
  const body =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mime}\r\n` +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    `${base64}\r\n` +
    `--${boundary}--`;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive upload failed (${res.status}): ${err.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.webViewLink || `https://drive.google.com/file/d/${json.id}/view`;
};
