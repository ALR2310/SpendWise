import { CapacitorHttp } from '@capacitor/core';

interface UploadOptions {
  fileName: string;
  mimeType?: string;
  content: any;
  appDataFolder?: boolean;
}

interface UpdateOptions extends UploadOptions {
  fileId: string;
}

interface FindOptions {
  fileId?: string;
  spaces?: 'appDataFolder' | 'drive';
  orderBy?: string;
  pageSize?: number;
  query?: string;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
}

class GoogleDrive {
  private readonly GOOGLE_DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
  private readonly GOOGLE_DRIVE_API_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';
  private accessToken: string | null = null;

  /**
   * Initialize the Google Drive service with access token
   */
  initialize({ accessToken }: { accessToken: string }) {
    console.log('Initialize Google Drive Service');
    this.accessToken = accessToken;
  }

  /**
   * Create FormData for file upload/update operations
   */
  private createFormData(fileName: string, content: any, mimeType?: string, appDataFolder?: boolean): FormData {
    const metadata = {
      name: fileName,
      ...(mimeType && { mimeType }),
      ...(appDataFolder && { parents: ['appDataFolder'] }),
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: mimeType }));

    return form;
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
    };
    return headers;
  }

  /**
   * Validate access token
   */
  private validateAccessToken(): void {
    if (!this.accessToken) {
      throw new Error('Google Drive service not initialized. Please call initialize() first.');
    }
  }

  /**
   * Handle API errors consistently
   */
  private handleError(error: any, operation: string): ServiceResponse {
    console.error(`Google Drive ${operation} error:`, error);

    const errorMessage = error?.message || `An error occurred during ${operation}`;
    return {
      success: false,
      message: errorMessage,
      error: error,
    };
  }

  /**
   * Upload a file to Google Drive
   */
  async upload(options: UploadOptions): Promise<ServiceResponse<DriveFile>> {
    try {
      this.validateAccessToken();

      const { fileName, mimeType, content, appDataFolder } = options;

      if (!fileName) throw new Error('File name is required');
      if (!content) throw new Error('File content is required');

      const form = this.createFormData(fileName, content, mimeType, appDataFolder);

      const response = await CapacitorHttp.post({
        url: `${this.GOOGLE_DRIVE_API_UPLOAD_URL}/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime,modifiedTime`,
        headers: this.getHeaders(),
        data: form,
      });

      if (response.status !== 200) {
        throw new Error(
          `Failed to upload file: ${response.status} ${response.data?.error_description || 'Unknown error'}`,
        );
      }

      return {
        success: true,
        message: 'File uploaded successfully',
        data: response.data,
      };
    } catch (error: any) {
      return this.handleError(error, 'upload');
    }
  }

  /**
   * Download a file from Google Drive
   */
  async download(fileId: string): Promise<ServiceResponse<Uint8Array>> {
    try {
      this.validateAccessToken();

      if (!fileId) throw new Error('File ID is required');

      const response = await fetch(`${this.GOOGLE_DRIVE_API_URL}/files/${fileId}?alt=media`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      const data = new Uint8Array(buffer);

      return {
        success: true,
        message: 'File downloaded successfully',
        data,
      };
    } catch (error: any) {
      return this.handleError(error, 'download');
    }
  }

  /**
   * Update an existing file in Google Drive
   */
  async update(options: UpdateOptions): Promise<ServiceResponse<DriveFile>> {
    try {
      this.validateAccessToken();

      const { fileId, fileName, mimeType, content, appDataFolder } = options;

      if (!fileId) throw new Error('File ID is required');
      if (!fileName) throw new Error('File name is required');
      if (!content) throw new Error('File content is required');

      const form = this.createFormData(fileName, content, mimeType, appDataFolder);

      const response = await CapacitorHttp.put({
        url: `${this.GOOGLE_DRIVE_API_UPLOAD_URL}/files/${fileId}?uploadType=multipart&fields=id,name,mimeType,size,createdTime,modifiedTime`,
        headers: this.getHeaders(),
        data: form,
      });

      if (response.status !== 200) {
        throw new Error(
          `Failed to update file: ${response.status} ${response.data?.error_description || 'Unknown error'}`,
        );
      }

      return {
        success: true,
        message: 'File updated successfully',
        data: response.data,
      };
    } catch (error: any) {
      return this.handleError(error, 'update');
    }
  }

  /**
   * Delete a file from Google Drive
   */
  async delete(fileId: string): Promise<ServiceResponse> {
    try {
      this.validateAccessToken();

      if (!fileId) throw new Error('File ID is required');

      const response = await CapacitorHttp.delete({
        url: `${this.GOOGLE_DRIVE_API_URL}/files/${fileId}`,
        headers: this.getHeaders(),
      });

      if (response.status !== 204) {
        throw new Error(
          `Failed to delete file: ${response.status} ${response.data?.error_description || 'Unknown error'}`,
        );
      }

      return {
        success: true,
        message: 'File deleted successfully',
      };
    } catch (error: any) {
      return this.handleError(error, 'delete');
    }
  }

  /**
   * Find files in Google Drive
   */
  async find(options: FindOptions = {}): Promise<ServiceResponse<DriveFile | DriveFile[]>> {
    try {
      this.validateAccessToken();

      const { fileId, spaces = 'drive', orderBy = 'createdTime desc', pageSize = 100, query } = options;

      let url: string;
      const params = new URLSearchParams();

      if (fileId) {
        // Get specific file
        url = `${this.GOOGLE_DRIVE_API_URL}/files/${fileId}`;
        params.append('fields', 'id,name,mimeType,size,createdTime,modifiedTime');
      } else {
        // List files
        url = `${this.GOOGLE_DRIVE_API_URL}/files`;
        params.append('spaces', spaces);
        params.append('orderBy', orderBy);
        params.append('pageSize', pageSize.toString());
        params.append('fields', 'files(id,name,mimeType,size,createdTime,modifiedTime)');

        if (query) {
          params.append('q', query);
        }
      }

      const response = await CapacitorHttp.get({
        url: `${url}?${params.toString()}`,
        headers: this.getHeaders(),
      });

      if (response.status !== 200) {
        throw new Error(
          `Failed to find file(s): ${response.status} ${response.data?.error_description || 'Unknown error'}`,
        );
      }

      const message = fileId ? 'File found successfully' : 'Files retrieved successfully';
      return {
        success: true,
        message,
        data: fileId ? response.data : response.data.files,
      };
    } catch (error: any) {
      return this.handleError(error, 'find');
    }
  }
}

export const googleDrive = new GoogleDrive();
