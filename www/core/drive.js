import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import pako from 'pako';

let accessToken = null;

/**
 * Checks if the user is logged in to Google.
 *
 * Attempts to refresh the Google authentication session and retrieve the access token.
 *
 * @returns {Promise<{success: boolean, message: string, data?: any, error?: any}>}
 */

const checkLogin = async () => {
    try {
        const userInfo = await GoogleAuth.refresh();
        accessToken = userInfo.accessToken;
        return { success: true, message: 'logged in', data: userInfo };
    } catch (e) {
        return { success: false, message: 'not logged in', error: e };
    }
};

/**
 * Login to Google
 * 
 * @returns {Promise<{success: boolean, message: string, data?: any, error?: any}>}
 */
const login = async () => {
    try {
        let userInfo = await GoogleAuth.signIn();
        accessToken = userInfo.authentication.accessToken;
        return { success: true, message: 'login success', data: userInfo };
    } catch (e) {
        return { success: false, message: 'login failed', error: e };
    }
};

/**
 * Logout from Google
 * 
 * @returns {Promise<{success: boolean, message: string, error?: any}>}
 */
const logout = async () => {
    try {
        await GoogleAuth.signOut();
        accessToken = null;
        return { success: true, message: 'logout success' };
    } catch (e) {
        return { success: false, message: 'logout failed', error: e };
    }
};

/**
 * Upload a file to Google Drive
 * 
 * @param {Object} options
 * @param {string} options.fileName file name
 * @param {string} options.mimeType file type (e.g. image/jpeg)
 * @param {string} options.data file content
 * @param {boolean} [options.appDataFolder=false] whether to store in appDataFolder or not
 * 
 * @returns {Promise<{success: boolean, message: string, data?: any, error?: any}>}
 */
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

/**
 * Download a file from Google Drive
 * 
 * @param {string} fileId file ID
 * @returns {Promise<{success: boolean, message: string, data?: Blob, error?: any}>}
 */
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

/**
 * Update a file on Google Drive
 * 
 * @param {Object} options
 * @param {string} options.fileId file ID
 * @param {string} [options.fileName] new file name
 * @param {string} [options.mimeType] new file type (e.g. image/jpeg)
 * @param {string|Blob} options.data new file content
 * 
 * @returns {Promise<{success: boolean, message: string, data?: any, error?: any}>}
 */
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

/**
 * Delete a file from Google Drive
 * 
 * @param {string} fileId file ID
 * 
 * @returns {Promise<{success: boolean, message: string, data?: any, error?: any}>}
 */
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

/**
 * Retrieve a list of files from Google Drive.
 * 
 * @param {Object} [options] - Optional parameters for the request.
 * @param {string} [options.spaces='drive,appDataFolder'] - Comma-separated list of spaces to query within.
 * @param {string} [options.orderBy='createdTime desc'] - The criteria by which to order the returned files.
 * 
 * @returns {Promise<{success: boolean, message: string, data?: any, error?: any}>}
 */

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

    try {
        // delete old backup file in drive
        const oldFiles = await getFiles({ spaces: 'appDataFolder' });
        for (const file of oldFiles.data.files) await deleteFile(file.id);

        // get data for backup
        const [spendList, spendItem, note] = await db.queryAll([
            { sql: 'SELECT * FROM SpendList' },
            { sql: 'SELECT * FROM SpendItem' },
            { sql: 'SELECT * FROM Note' },
        ]);

        // compress data
        const spendData = { spendList, spendItem, note };
        const data = JSON.stringify(spendData, null, 2);
        const compressedData = pako.gzip(data);

        // upload compressed data
        const result = await uploadFile({ fileName: "spendData.json.gz", mimeType: "application/gzip", data: compressedData, appDataFolder: true });
        appSettings.set('data.fileId', result.data.id); // save to appSettings
        return { success: true, message: 'Sao lưu thành công', data: result };
    } catch (e) {
        console.log('Có lỗi trong quá trình sao lưu dữ liệu:', e);
        return { success: false, message: 'Có lỗi trong quá trình sao lưu dữ liệu', error: e };
    }
};

const restoreData = async () => {
    if (!accessToken) return { success: false, message: 'Login to sync data' };

    try {
        let backupFileId = appSettings.get('data.fileId');
        if (!backupFileId)
            backupFileId = (await getFiles({ spaces: 'appDataFolder' })).data.files[0].id;

        const result = await downloadFile(backupFileId);

        if (!result.success) return result;

        const arrayBuffer = await result.data.arrayBuffer();
        const decompressedData = pako.ungzip(new Uint8Array(arrayBuffer), { to: 'string' });
        const spendData = JSON.parse(decompressedData);

        console.log(spendData)

        const keys = Object.keys(spendData).filter(key => {
            return Array.isArray(spendData[key]) ? spendData[key].length > 0 : Object.keys(spendData[key]).length > 0;
        });

        await db.query('PRAGMA foreign_keys = OFF;');
        await db.queryAll(keys.map(key => { return { sql: `DROP TABLE IF EXISTS ${key}` }; }));
        await db.query('PRAGMA foreign_keys = ON;');
        await db.initTable();

        if (spendData.spendList && spendData.spendList.length > 0) {
            const spendListQueries = spendData.spendList.map(spdList => {
                return {
                    sql: `INSERT INTO SpendList (Id ,Name, AtCreate, AtUpdate, LastEntry, Status) VALUES (?, ?, ?, ?, ?, ?)`,
                    params: [spdList.Id, spdList.Name, spdList.AtCreate, spdList.AtUpdate, spdList.LastEntry, spdList.Status]
                };
            });

            await db.queryAll(spendListQueries).catch(error => {
                console.log('Error inserting SpendList:', error);
            });
        }

        if (spendData.spendItem && spendData.spendItem.length > 0) {
            const spendItemQueries = spendData.spendItem.map(spdItem => {
                return {
                    sql: `INSERT INTO SpendItem (Id, ListId, Name, Price, Details, AtCreate, AtUpdate, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    params: [spdItem.Id, spdItem.ListId, spdItem.Name, spdItem.Price, spdItem.Details, spdItem.AtCreate, spdItem.AtUpdate, spdItem.Status]
                };
            });

            await db.queryAll(spendItemQueries).catch(error => {
                console.log('Error inserting SpendItem:', error);
            });
        }

        if (spendData.note && spendData.note.length > 0) {
            const noteQueries = spendData.note.map(note => {
                return {
                    sql: `INSERT INTO Note (Id, Name, Content, AtCreate, AtUpdate, Status) VALUES (?, ?, ?, ?, ?, ?)`,
                    params: [note.Id, note.Name, note.Content, note.AtCreate, note.AtUpdate, note.Status]
                };
            });

            await db.queryAll(noteQueries).catch(error => {
                console.log('Error inserting Note:', error);
            });
        }

        return { success: true, message: 'Khôi phục dữ liệu thành công', data: spendData };
    } catch (e) {
        console.log('Có lỗi trong quá trình khôi phục dữ liệu: ', e);
        return { success: false, message: 'Có lỗi trong quá trình khôi phục dữ liệu', error: e };
    }
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
    backupData,
    restoreData,
};