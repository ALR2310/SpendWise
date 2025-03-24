import { CapacitorHttp } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';
import { GoogleLoginResponseOffline, SocialLogin } from '@capgo/capacitor-social-login';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

class GoogleAuthenticate {
  async initialize() {
    SocialLogin.initialize({
      google: {
        webClientId: __GOOGLE_CLIENT_ID__,
        mode: 'offline',
      },
    });
  }

  async login() {
    try {
      const authCode = (
        (
          await SocialLogin.login({
            provider: 'google',
            options: {
              forceRefreshToken: true,
              scopes: ['https://www.googleapis.com/auth/drive.appfolder', 'https://www.googleapis.com/auth/drive.file'],
            },
          })
        ).result as GoogleLoginResponseOffline
      ).serverAuthCode;

      if (!authCode) {
        return { success: false, message: 'Failed to get auth code' };
      }

      // Check internet
      const currentNetwork = await Network.getStatus();
      if (!currentNetwork.connected) {
        return {
          success: false,
          message: 'No internet connection',
        };
      }

      // Get token
      const data = new URLSearchParams();
      data.append('client_id', __GOOGLE_CLIENT_ID__);
      data.append('client_secret', __GOOGLE_CLIENT_SECRET__);
      data.append('code', authCode);
      data.append('grant_type', 'authorization_code');

      const result = await CapacitorHttp.post({
        url: 'https://oauth2.googleapis.com/token',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: data.toString(),
      });

      if (result.status != 200) {
        return {
          success: false,
          message: 'An error occurred when getting token',
        };
      }

      const { access_token, expires_in, refresh_token, id_token } = result.data;

      const expiresAt = (Date.now() + Number(expires_in) * 1000).toString();

      await Promise.all([
        SecureStoragePlugin.set({ key: 'access_token', value: access_token }),
        SecureStoragePlugin.set({ key: 'refresh_token', value: refresh_token }),
        SecureStoragePlugin.set({ key: 'id_token', value: id_token }),
        Preferences.set({ key: 'expires_at', value: expiresAt }),
      ]);

      return {
        success: true,
        message: 'Login successfully',
        data: { access_token, expires_in, refresh_token, id_token },
      };
    } catch (e) {
      console.log(e);
      return { success: false, message: 'An error occurred when logging in' };
    }
  }

  async refresh_token() {
    const refresh_token = (await SecureStoragePlugin.get({ key: 'refresh_token' })).value;

    if (!refresh_token)
      return {
        success: false,
        message: 'No refresh token found',
      };

    // Check internet
    const currentNetwork = await Network.getStatus();
    if (!currentNetwork.connected) {
      return {
        success: false,
        message: 'No internet connection',
      };
    }

    const result = await CapacitorHttp.post({
      url: 'https://oauth2.googleapis.com/token',
      data: {
        client_id: __GOOGLE_CLIENT_ID__,
        client_secret: __GOOGLE_CLIENT_SECRET__,
        refresh_token,
        grant_type: 'refresh_token',
      },
    });

    if (result.status != 200) {
      return {
        success: false,
        message: 'An error occurred when refreshing token',
      };
    }

    const { access_token, expires_in } = result.data;
    const expiresAt = (Date.now() + Number(expires_in) * 1000).toString();

    await Promise.all([
      SecureStoragePlugin.set({ key: 'access_token', value: access_token }),
      Preferences.set({ key: 'expires_at', value: expiresAt }),
    ]);

    return {
      success: true,
      message: 'Refresh token successfully',
      data: { access_token },
    };
  }

  async isValidToken(useApiCheck = false) {
    let access_token = (await SecureStoragePlugin.get({ key: 'access_token' })).value;
    if (!access_token) return { success: false, message: 'No access token found' };

    const expiresAtStr = (await Preferences.get({ key: 'expires_at' })).value;
    if (!useApiCheck && expiresAtStr) {
      const expiresAt = Number(expiresAtStr);
      if (Date.now() >= expiresAt) {
        const refreshResult = await this.refresh_token();
        if (!refreshResult.success) return refreshResult;
        access_token = refreshResult.data?.access_token;
      }
      return { success: true, message: 'Token is valid (local check)', data: { access_token } };
    }

    const currentNetwork = await Network.getStatus();
    if (!currentNetwork.connected) {
      return { success: false, message: 'No internet connection' };
    }

    const response = await CapacitorHttp.get({
      url: `https://oauth2.googleapis.com/tokeninfo?access_token=${access_token}`,
    });

    if (response.status !== 200) {
      const refreshResult = await this.refresh_token();
      if (!refreshResult.success) return refreshResult;
      access_token = refreshResult.data?.access_token;
    }

    return { success: true, message: 'Token is valid (API check)', data: { access_token } };
  }

  async logout() {
    await Promise.all([
      SecureStoragePlugin.remove({ key: 'access_token' }),
      SecureStoragePlugin.remove({ key: 'refresh_token' }),
      SecureStoragePlugin.remove({ key: 'id_token' }),
      Preferences.remove({ key: 'expires_at' }),
    ]);

    return {
      success: true,
      message: 'Logout successfully',
    };
  }

  async getAccessToken() {
    try {
      const access_token = (await SecureStoragePlugin.get({ key: 'access_token' })).value;
      if (!access_token) return { success: false, message: 'No access token found' };

      const expiresAtStr = (await Preferences.get({ key: 'expires_at' })).value;
      if (!expiresAtStr) return { success: false, message: 'Token expiration data missing' };

      const expiresAt = Number(expiresAtStr);
      if (Date.now() >= expiresAt) {
        const refreshResult = await this.refresh_token();
        if (!refreshResult.success) return refreshResult;
        return this.getAccessToken();
      }
      return { success: true, message: 'Get access token successfully', data: { access_token } };
    } catch (e) {
      return { success: false, message: 'Get access token failed' };
    }
  }

  async isLoggedIn() {
    try {
      const refresh_token = await SecureStoragePlugin.get({ key: 'refresh_token' });
      return { success: !!refresh_token.value, message: 'Check login status successfully' };
    } catch (e) {
      return { success: false, message: 'Check login status failed' };
    }
  }
}

export const googleAuthenticate = new GoogleAuthenticate();
