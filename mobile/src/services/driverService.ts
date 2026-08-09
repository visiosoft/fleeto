import { Platform } from 'react-native';
import api from '../config/api';

const mimeFor = (fileName: string) => {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  if (ext === 'gif') return 'image/gif';
  return 'image/jpeg';
};

/** Uploads an Emirates ID / licence scan against a driver. */
export const uploadDriverDocument = async (
  driverId: string,
  file: { uri: string; name: string },
  type: string,
  title: string,
  expiryDate?: string,
) => {
  const formData = new FormData();
  formData.append('type', type);
  formData.append('title', title);
  if (expiryDate) formData.append('expiryDate', expiryDate);

  if (Platform.OS === 'web') {
    const blob = await (await fetch(file.uri)).blob();
    formData.append('document', blob, file.name);
  } else {
    formData.append('document', { uri: file.uri, name: file.name, type: mimeFor(file.name) } as any);
  }

  return api.post(`/drivers/${driverId}/upload-document`, formData, {
    headers: { 'Content-Type': undefined },
    timeout: 60000,
  });
};

export const driverService = {
  getAll: () => api.get('/drivers'),
  search: (params: any) => api.get('/drivers/search', { params }),
  getById: (id: string) => api.get(`/drivers/${id}`),
  create: (data: any) => api.post('/drivers', data),
  update: (id: string, data: any) => api.put(`/drivers/${id}`, data),
  delete: (id: string) => api.delete(`/drivers/${id}`),
  getDocuments: (id: string) => api.get(`/drivers/${id}/get-documents`),
  uploadDocument: (id: string, formData: FormData) =>
    api.post(`/drivers/${id}/upload-document`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteDocument: (driverId: string, docId: string) =>
    api.delete(`/drivers/${driverId}/delete-document/${docId}`),
};
