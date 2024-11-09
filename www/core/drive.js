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

const uploadFile = async ({ fileName, mimeType, data }) => {
    if (!accessToken) return { success: false, message: 'not logged in' };

    const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
    const metadata = { name: fileName, mimeType: mimeType, };

    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", new Blob([data], { type: mimeType }));

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: new Headers({
                Authorization: `Bearer ${accessToken}`,
            }),
            body: form,
        });

        const responseData = await response.json();
        return { success: true, message: "Tải lên tệp tin thành công", data: responseData };
    } catch (error) {
        console.error("Lỗi không xác định:", error);
        return { success: false, message: "Có lỗi khi tải lên tệp tin", error: error };
    }
};

const downloadFile = async (fileId) => {
    if (!accessToken) return { success: false, message: 'not logged in' };

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: new Headers({
                Authorization: `Bearer ${accessToken}`,
            }),
        });

        if (response.ok) {
            const data = await response.blob();
            // console.log(JSON.parse(await data.text()))
            return { success: true, message: "Tải xuống tệp tin thành công", data: data };
        } else {
            const errorData = await response.json();
            console.error("Lỗi khi tải tệp:", errorData);
            return { success: false, message: "Có lỗi khi tải xuống tệp tin", error: errorData };
        }
    } catch (error) {
        console.error("Lỗi không xác định:", error);
        return { success: true, message: "Có lỗi khi tải xuống tệp tin", error: error };
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
};