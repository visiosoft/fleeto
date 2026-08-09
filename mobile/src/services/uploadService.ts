import api from '../config/api';
import { Platform } from 'react-native';

// Guess the MIME type from the file extension so PDFs are not sent as JPEGs
const mimeFor = (fileName: string) => {
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    if (ext === 'pdf') return 'application/pdf';
    if (ext === 'png') return 'image/png';
    if (ext === 'webp') return 'image/webp';
    if (ext === 'heic') return 'image/heic';
    return 'image/jpeg';
};

export const uploadService = {
    upload: async (uri: string, fileName: string, plateNumber: string, vehicleName: string) => {
        const formData = new FormData();

        // Text fields must come before the file so multer can read them in destination()
        formData.append('plateNumber', plateNumber);
        formData.append('vehicleName', vehicleName);

        if (Platform.OS === 'web') {
            const response = await fetch(uri);
            const blob = await response.blob();
            formData.append('file', blob, fileName);
        } else {
            formData.append('file', { uri, name: fileName, type: mimeFor(fileName) } as any);
        }

        console.log('[UploadService] Uploading:', { uri: uri.slice(0, 80), fileName, plateNumber, vehicleName, platform: Platform.OS });

        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': undefined },
                timeout: 60000,
            });
            console.log('[UploadService] Success:', res.data);
            return res;
        } catch (err: any) {
            console.error('[UploadService] Failed:', {
                status: err.response?.status,
                data: err.response?.data,
                message: err.message,
            });
            throw err;
        }
    },
};
