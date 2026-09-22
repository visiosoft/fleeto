import { getApiUrl } from '../config/api';
import { Letterhead, LetterHistoryEntry } from '../types/api';

class LetterheadService {
  private static instance: LetterheadService;

  static getInstance(): LetterheadService {
    if (!LetterheadService.instance) {
      LetterheadService.instance = new LetterheadService();
    }
    return LetterheadService.instance;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  private getAuthHeadersForUpload(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  async getAllLetterheads(): Promise<Letterhead[]> {
    try {
      const response = await fetch(getApiUrl('/letterheads'), {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching letterheads:', error);
      throw error;
    }
  }

  async getLetterheadById(id: string): Promise<Letterhead> {
    try {
      const response = await fetch(getApiUrl(`/letterheads/${id}`), {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching letterhead:', error);
      throw error;
    }
  }

  async getDefaultLetterhead(): Promise<Letterhead | null> {
    try {
      const response = await fetch(getApiUrl('/letterheads/default'), {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching default letterhead:', error);
      throw error;
    }
  }

  async createLetterhead(letterheadData: Partial<Letterhead>): Promise<Letterhead> {
    try {
      const response = await fetch(getApiUrl('/letterheads'), {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(letterheadData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating letterhead:', error);
      throw error;
    }
  }

  async updateLetterhead(id: string, letterheadData: Partial<Letterhead>): Promise<Letterhead> {
    try {
      const response = await fetch(getApiUrl(`/letterheads/${id}`), {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(letterheadData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating letterhead:', error);
      throw error;
    }
  }

  async deleteLetterhead(id: string): Promise<void> {
    try {
      const response = await fetch(getApiUrl(`/letterheads/${id}`), {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting letterhead:', error);
      throw error;
    }
  }

  async setDefaultLetterhead(id: string): Promise<Letterhead> {
    try {
      const response = await fetch(getApiUrl(`/letterheads/${id}/set-default`), {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error setting default letterhead:', error);
      throw error;
    }
  }

  async saveLetterHistory(
    letterheadId: string,
    pdfBlob: Blob,
    filename: string,
    title: string,
    letterContent: Record<string, any>
  ): Promise<LetterHistoryEntry> {
    try {
      const formData = new FormData();
      formData.append('pdf', pdfBlob, filename);
      formData.append('title', title);
      formData.append('letterContent', JSON.stringify(letterContent));

      const response = await fetch(getApiUrl(`/letterheads/${letterheadId}/letters`), {
        method: 'POST',
        headers: this.getAuthHeadersForUpload(),
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error saving letter history:', error);
      throw error;
    }
  }

  async updateLetterHistory(
    letterheadId: string,
    historyId: string,
    pdfBlob: Blob,
    filename: string,
    title: string,
    letterContent: Record<string, any>
  ): Promise<LetterHistoryEntry> {
    try {
      const formData = new FormData();
      formData.append('pdf', pdfBlob, filename);
      formData.append('title', title);
      formData.append('letterContent', JSON.stringify(letterContent));

      const response = await fetch(getApiUrl(`/letterheads/${letterheadId}/letters/${historyId}`), {
        method: 'PUT',
        headers: this.getAuthHeadersForUpload(),
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating letter history:', error);
      throw error;
    }
  }

  async getLetterHistory(letterheadId?: string): Promise<LetterHistoryEntry[]> {
    try {
      const url = letterheadId
        ? `/letterheads/${letterheadId}/letters`
        : '/letterheads/history/all';
      const response = await fetch(getApiUrl(url), {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching letter history:', error);
      throw error;
    }
  }

  async deleteLetterHistory(historyId: string): Promise<void> {
    try {
      const response = await fetch(getApiUrl(`/letterheads/history/${historyId}`), {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting letter history:', error);
      throw error;
    }
  }

  getLetterPdfUrl(relativeUrl: string): string {
    const origin = getApiUrl('').replace(/\/api\/?$/, '');
    return `${origin}${relativeUrl}`;
  }
}

export default LetterheadService;
