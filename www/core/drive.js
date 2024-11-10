import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

let accessToken = null;

const checkLogin = async () => {
    try {
        const userInfo = await GoogleAuth.refresh();
        accessToken = userInfo.accessToken;
        return { success: true, message: 'logged in', data: userInfo };
    } catch (e) {
        return { success: false, message: 'not logged in', error: e };
    }
};

const login = async () => {
    try {
        let userInfo = await GoogleAuth.signIn();
        accessToken = userInfo.authentication.accessToken;
        return { success: true, message: 'login success', data: userInfo };
    } catch (e) {
        return { success: false, message: 'login failed', error: e };
    }
};

const logout = async () => {
    try {
        await GoogleAuth.signOut();
        accessToken = null;
        return { success: true, message: 'logout success' };
    } catch (e) {
        return { success: false, message: 'logout failed', error: e };
    }
};

const uploadFile = async ({ fileName, mimeType, data, appDataFolder = false }) => {
    if (!accessToken) return { success: false, message: 'not logged in' };
    if (!fileName || !mimeType || !data) return { success: false, message: 'missing fileName, mimeType or data' };

    const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size";
    const metadata = { name: fileName, mimeType: mimeType, ...(appDataFolder && { parents: ['appDataFolder'] }) };

    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", new Blob([data], { type: mimeType }));

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: new Headers({ Authorization: `Bearer ${accessToken}` }),
            body: form,
        });

        if (!response.ok) return { success: false, message: 'Có lỗi khi tải lên tệp tin', error: await response.json() };
        return { success: true, message: "Tải lên tệp tin thành công", data: await response.json() };
    } catch (error) {
        console.error("Lỗi không xác định:", error);
        return { success: false, message: "Có lỗi khi tải lên tệp tin", error: error };
    }
};

const downloadFile = async (fileId) => {
    if (!accessToken) return { success: false, message: 'not logged in' };
    if (!fileId) return { success: false, message: 'missing fileId' };

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: new Headers({ Authorization: `Bearer ${accessToken}`, }),
        });

        if (!response.ok) return { success: false, message: "Có lỗi khi tải xuống tệp tin", error: await response.json() };
        return { success: true, message: "Tải xuống tệp tin thành công", data: await response.blob() };
    } catch (error) {
        console.error("Lỗi không xác định:", error);
        return { success: false, message: "Có lỗi khi tải xuống tệp tin", error: error };
    }
};

const updateFile = async ({ fileId, fileName, mimeType, data }) => {
    if (!accessToken) return { success: false, message: 'not logged in' };
    if (!fileId) return { success: false, message: 'missing fileId' };
    if (!data) return { success: false, message: 'missing data' };

    const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;

    const metadata = {
        ...(fileName && { name: fileName }),
        ...(mimeType && { mimeType: mimeType })
    };

    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", new Blob([data], { type: mimeType || 'application/octet-stream' }));

    try {
        const response = await fetch(url, {
            method: "PATCH",
            headers: new Headers({ Authorization: `Bearer ${accessToken}` }),
            body: form,
        });

        if (!response.ok) return { success: false, message: 'Có lỗi khi cập nhật tệp tin', error: await response.json() };
        return { success: true, message: "Cập nhật tệp tin thành công", data: await response.json() };
    } catch (error) {
        console.error("Lỗi không xác định:", error);
        return { success: false, message: "Có lỗi khi cập nhật tệp tin", error: error };
    }
};

const deleteFile = async (fileId) => {
    if (!accessToken) return { success: false, message: 'not logged in' };
    if (!fileId) return { success: false, message: 'missing fileId' };

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;

    try {
        const response = await fetch(url, {
            method: "DELETE",
            headers: new Headers({ Authorization: `Bearer ${accessToken}` }),
        });

        if (!response.ok) return { success: false, message: "Có lỗi khi xóa tệp tin", error: await response.json() };
        return { success: true, message: "Xóa tệp tin thành công" };
    } catch (error) {
        console.error("Lỗi không xác định:", error);
        return { success: false, message: "Có lỗi khi xóa tệp tin", error: error };
    }
};

const getFiles = async ({ spaces = 'drive,appDataFolder', orderBy = 'createdTime desc' } = {}) => {
    if (!accessToken) return { success: false, message: 'not logged in' };

    const params = new URLSearchParams({ spaces, orderBy });
    const url = `https://www.googleapis.com/drive/v3/files?${params.toString()}`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: new Headers({ Authorization: `Bearer ${accessToken}` }),
        });

        if (!response.ok) return { success: false, message: "Có lỗi khi lấy danh sách tệp", error: await response.json() };
        return { success: true, message: "Lấy danh sách tệp thành công", data: await response.json() };
    } catch (error) {
        console.error("Lỗi không xác định:", error);
        return { success: false, message: "Có lỗi khi lấy danh sách tệp", error: error };
    }
};



const backupData = async () => {
    if (!accessToken) return { success: false, message: 'Login to backup data' };


};

export default {
    getAccessToken: () => accessToken,
    setAccessToken: (token) => accessToken = token,
    checkLogin,
    login,
    logout,
    uploadFile,
    downloadFile,
    deleteFile,
    getFiles,
    updateFile,
};