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
        message: 'missing fileName, mimeType or content',
      };

    const API =
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size';
    const metadata = {
      name: fileName,
      mimeType,
      ...(appDataFolder && { parents: ['appDataFolder'] }),
    };
    const form = new FormData();
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
    );
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
            message: 'Tải lên thành công',
            data: await response.json(),
          }
        : {
            success: false,
            message: 'Lỗi tải lên',
            error: await response.json(),
          };
    } catch (err) {
      return { success: false, message: 'Lỗi tải lên', error: err };
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
    if (!fileId) return { success: false, message: 'missing fileId' };

    const API = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    try {
      const response = await fetch(API, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return response.ok
        ? {
            success: true,
            message: 'Tải xuống thành công',
            data: await response.blob(),
          }
        : {
            success: false,
            message: 'Lỗi tải xuống',
            error: await response.json(),
          };
    } catch (error) {
      return { success: false, message: 'Lỗi tải xuống', error };
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
        message: 'missing fileId, content, fileName or mimeType',
      };

    const API = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
    const metadata = { name: fileName, mimeType };
    const form = new FormData();
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
    );
    form.append('file', new Blob([content], { type: mimeType }));

    try {
      const response = await fetch(API, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: form,
      });
      return response.ok
        ? {
            success: true,
            message: 'Cập nhật thành công',
            data: await response.json(),
          }
        : {
            success: false,
            message: 'Lỗi cập nhật',
            error: await response.json(),
          };
    } catch (error) {
      return { success: false, message: 'Lỗi cập nhật', error };
    }
  }

  async delete(
    fileId: string,
  ): Promise<
    | { success: boolean; message: string; error?: undefined }
    | { success: boolean; message: string; error: any }
  > {
    if (!this.accessToken) return { success: false, message: 'not logged in' };
    if (!fileId) return { success: false, message: 'missing fileId' };

    const API = `https://www.googleapis.com/drive/v3/files/${fileId}`;
    try {
      const response = await fetch(API, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      return response.ok
        ? { success: true, message: 'Xóa thành công' }
        : { success: false, message: 'Lỗi xóa', error: await response.json() };
    } catch (error) {
      return { success: false, message: 'Lỗi xóa', error };
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
            message: fileId
              ? 'Lấy tệp thành công'
              : 'Lấy danh sách tệp thành công',
            data: await response.json(),
          }
        : {
            success: false,
            message: 'Lỗi lấy tệp',
            error: await response.json(),
          };
    } catch (error) {
      return { success: false, message: 'Lỗi lấy tệp', error };
    }
  }
}

export const drive = new GoogleDrive();
