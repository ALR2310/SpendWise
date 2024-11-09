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

export default {
    getAccessToken: () => accessToken,
    setAccessToken: (token) => accessToken = token,
    checkLogin,
    login,
    logout,
};