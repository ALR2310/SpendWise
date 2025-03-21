interface UploadOptions {
  fileName: string;
  mimeType?: string;
  content: any;
  appDataFolder?: boolean;
}

interface UpdateOptions extends Omit<UploadOptions, 'appDataFolder'> {
  fileId?: string;
}

interface GetOptions extends Pick<UpdateOptions, 'fileId'> {
  spaces?: string;
  orderBy?: string;
}

class GoogleDrive {
  private accessToken: string | null = null;

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private getHeaders(): Headers {
    return new Headers({ Authorization: `Bearer ${this.accessToken}` });
  }

  async upload(
    options: UploadOptions,
  ): Promise<
    | { success: boolean; message: string; data?: undefined; error?: undefined }
    | { success: boolean; message: string; data: any; error?: undefined }
    | { success: boolean; message: string; error: any; data?: undefined }
  > {
    const { fileName, mimeType, content, appDataFolder = false } = options;
    if (!this.accessToken) return { success: false, message: 'not logged in' };
    if (!fileName || !mimeType || !content)
      return {
        success: false,
        message: 'Missing fileName, mimeType or content',
      };

    const API = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size';
    const metadata = {
      name: fileName,
      mimeType,
      ...(appDataFolder && { parents: ['appDataFolder'] }),
    };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: mimeType }));

    try {
      const response = await fetch(API, {
        method: 'POST',
        headers: this.getHeaders(),
        body: form,
      });
      return response.ok
        ? {
            success: true,
            message: 'Upload successfully',
            data: await response.json(),
          }
        : {
            success: false,
            message: 'Upload failed',
            error: await response.json(),
          };
    } catch (err) {
      return { success: false, message: 'An error occurred when uploading', error: err };
    }
  }

  async download(
    fileId: string,
  ): Promise<
    | { success: boolean; message: string; data?: undefined; error?: undefined }
    | { success: boolean; message: string; data: Blob; error?: undefined }
    | { success: boolean; message: string; error: any; data?: undefined }
  > {
    if (!this.accessToken) return { success: false, message: 'not logged in' };
    if (!fileId) return { success: false, message: 'Missing fileId' };

    const API = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    try {
      const response = await fetch(API, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return response.ok
        ? {
            success: true,
            message: 'Download successfully',
            data: await response.blob(),
          }
        : {
            success: false,
            message: 'Download failed',
            error: await response.json(),
          };
    } catch (error) {
      return { success: false, message: 'An error occurred when downloading', error };
    }
  }

  async update(
    options: UpdateOptions,
  ): Promise<
    | { success: boolean; message: string; data?: undefined; error?: undefined }
    | { success: boolean; message: string; data: any; error?: undefined }
    | { success: boolean; message: string; error: any; data?: undefined }
  > {
    const { fileId, fileName, mimeType, content } = options;
    if (!this.accessToken) return { success: false, message: 'not logged in' };
    if (!fileId || !content || !fileName || !mimeType)
      return {
        success: false,
        message: 'Missing fileId, content, fileName or mimeType',
      };

    const API = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
    const metadata = { name: fileName, mimeType };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: mimeType }));

    try {
      const response = await fetch(API, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: form,
      });
      return response.ok
        ? {
            success: true,
            message: 'Update successfully',
            data: await response.json(),
          }
        : {
            success: false,
            message: 'Update failed',
            error: await response.json(),
          };
    } catch (error) {
      return { success: false, message: 'An error occurred when updating', error };
    }
  }

  async delete(
    fileId: string,
  ): Promise<
    { success: boolean; message: string; error?: undefined } | { success: boolean; message: string; error: any }
  > {
    if (!this.accessToken) return { success: false, message: 'not logged in' };
    if (!fileId) return { success: false, message: 'Missing fileId' };

    const API = `https://www.googleapis.com/drive/v3/files/${fileId}`;
    try {
      const response = await fetch(API, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      return response.ok
        ? { success: true, message: 'Delete successfully' }
        : { success: false, message: 'Delete failed', error: await response.json() };
    } catch (error) {
      return { success: false, message: 'An error occurred when deleting', error };
    }
  }

  async get(
    options: GetOptions,
  ): Promise<
    | { success: boolean; message: string; data?: undefined; error?: undefined }
    | { success: boolean; message: string; data: any; error?: undefined }
    | { success: boolean; message: string; error: any; data?: undefined }
  > {
    const { fileId, spaces = 'drive', orderBy = 'createdTime desc' } = options;
    if (!this.accessToken) return { success: false, message: 'not logged in' };

    const API = fileId
      ? `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size`
      : `https://www.googleapis.com/drive/v3/files?spaces=${spaces}&orderBy=${orderBy}`;

    try {
      const response = await fetch(API, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return response.ok
        ? {
            success: true,
            message: fileId ? 'Get file successfully' : 'Get list of files successfully',
            data: await response.json(),
          }
        : {
            success: false,
            message: 'An error occurred when getting',
            error: await response.json(),
          };
    } catch (error) {
      return { success: false, message: 'Lỗi lấy tệp', error };
    }
  }
}

export const drive = new GoogleDrive();
