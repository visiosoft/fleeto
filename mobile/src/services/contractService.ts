import api from '../config/api';
import { Platform } from 'react-native';

export const contractService = {
  getAll: () => api.get('/contracts'),
  getById: (id: string) => api.get(`/contracts/${id}`),
  create: (data: any) => api.post('/contracts', data),
  update: (id: string, data: any) => api.put(`/contracts/${id}`, data),
  delete: (id: string) => api.delete(`/contracts/${id}`),
  getTemplates: () => api.get('/contract-templates'),
  createTemplate: (data: any) => api.post('/contract-templates', data),
  // Remote e-signature
  sendForSignature: (id: string, data: { phone?: string; notifyPhone?: string }) =>
    api.post(`/contracts/${id}/send-for-signature`, data),
  getSignature: (id: string) => api.get(`/contracts/${id}/signature`),
  getSignedDocument: (id: string) => api.get(`/contracts/${id}/signed-document`),
  cancelSignature: (id: string) => api.post(`/contracts/${id}/signature/cancel`, {}),
  // Documents
  getDocuments: (id: string) => api.get(`/contracts/${id}/get-documents`),
  uploadDocument: async (id: string, uri: string, fileName: string, type = 'signed_contract') => {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('title', fileName);
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append('document', blob, fileName);
    } else {
      const ext = fileName.split('.').pop()?.toLowerCase() || 'pdf';
      const mimeType = ext === 'pdf' ? 'application/pdf' : `image/${ext}`;
      formData.append('document', { uri, name: fileName, type: mimeType } as any);
    }
    return api.post(`/contracts/${id}/upload-document`, formData, {
      headers: { 'Content-Type': undefined },
      timeout: 60000,
    });
  },
};
