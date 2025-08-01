import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

interface TokenData {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_at: string;
}

interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

class GoogleAuth {
  private readonly GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
  private readonly GOOGLE_TOKEN_INFO_URL = 'https://www.googleapis.com/oauth2/v1/tokeninfo';

  async initialize() {
    console.log('Initialize Google Service');
    await SocialLogin.initialize({
      google: {
        mode: 'offline',
        webClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      },
    });
  }

  async login(): Promise<ServiceResponse<TokenData>> {
    try {
      const loginResult = await SocialLogin.login({
        provider: 'google',
        options: {
          forceRefreshToken: true,
          scopes: ['https://www.googleapis.com/auth/drive.appfolder', 'https://www.googleapis.com/auth/drive.file'],
        },
      });

      const authCode = (loginResult as any).result.serverAuthCode;

      if (!authCode) throw Error('No auth code');

      // Check internet connection
      const currentNetwork = await Network.getStatus();
      if (!currentNetwork.connected) throw Error('No internet connection');

      // Exchange authorization code for tokens
      const tokenData = await this.exchangeCodeForTokens(authCode);

      // Store tokens securely
      await this.storeTokens(tokenData);

      return {
        success: true,
        message: 'Login successfully',
        data: tokenData,
      };
    } catch (e: any) {
      console.error('Login error:', e);
      return {
        success: false,
        message: e.message,
        data: undefined,
      };
    }
  }

  /**
   * Exchange authorization code for access and refresh tokens
   */
  private async exchangeCodeForTokens(authCode: string): Promise<TokenData> {
    const data = new URLSearchParams();
    data.append('client_id', import.meta.env.VITE_GOOGLE_CLIENT_ID);
    data.append('client_secret', import.meta.env.VITE_GOOGLE_CLIENT_SECRET);
    data.append('code', authCode);
    data.append('grant_type', 'authorization_code');
    data.append('redirect_uri', import.meta.env.VITE_GOOGLE_REDIRECT_URI);

    const tokenResult = await CapacitorHttp.post({
      url: this.GOOGLE_TOKEN_URL,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: data.toString(),
    });

    if (tokenResult.status !== 200) {
      throw new Error(`Failed to get token: ${tokenResult.status} ${tokenResult.data?.error_description || ''}`);
    }

    const { access_token, expires_in, refresh_token, id_token } = tokenResult.data;

    const isMissingToken = Capacitor.isNativePlatform() ? !access_token || !refresh_token : !access_token;
    if (isMissingToken) {
      throw new Error('Invalid token response: missing required tokens');
    }

    const expiresAt = (Date.now() + Number(expires_in) * 1000).toString();

    return {
      access_token,
      refresh_token,
      id_token,
      expires_at: expiresAt,
    };
  }

  /**
   * Store tokens securely
   */
  private async storeTokens(tokenData: TokenData): Promise<void> {
    await Promise.all([
      SecureStoragePlugin.set({ key: 'access_token', value: tokenData.access_token }),
      SecureStoragePlugin.set({ key: 'refresh_token', value: tokenData.refresh_token }),
      SecureStoragePlugin.set({ key: 'id_token', value: tokenData.id_token }),
      Preferences.set({ key: 'expires_at', value: tokenData.expires_at }),
    ]);
  }

  /**
   * Get stored tokens from secure storage
   */
  private async getStoredTokens(): Promise<TokenData | null> {
    try {
      const [accessToken, refreshToken, idToken, expiresAt] = await Promise.all([
        SecureStoragePlugin.get({ key: 'access_token' }),
        SecureStoragePlugin.get({ key: 'refresh_token' }),
        SecureStoragePlugin.get({ key: 'id_token' }),
        Preferences.get({ key: 'expires_at' }),
      ]);

      if (!accessToken.value || !refreshToken.value || !expiresAt.value) {
        return null;
      }

      return {
        access_token: accessToken.value,
        refresh_token: refreshToken.value,
        id_token: idToken.value || '',
        expires_at: expiresAt.value,
      };
    } catch (e) {
      console.error('Error getting stored tokens:', e);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<ServiceResponse<TokenData>> {
    try {
      // Check internet connection
      const currentNetwork = await Network.getStatus();
      if (!currentNetwork.connected) {
        throw new Error('No internet connection');
      }

      // Get stored refresh token
      const refreshTokenResult = await SecureStoragePlugin.get({ key: 'refresh_token' });
      if (!refreshTokenResult.value) {
        throw new Error('No refresh token available');
      }

      const data = new URLSearchParams();
      data.append('client_id', import.meta.env.VITE_GOOGLE_CLIENT_ID);
      data.append('client_secret', import.meta.env.VITE_GOOGLE_CLIENT_SECRET);
      data.append('refresh_token', refreshTokenResult.value);
      data.append('grant_type', 'refresh_token');

      const tokenResult = await CapacitorHttp.post({
        url: this.GOOGLE_TOKEN_URL,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: data.toString(),
      });

      if (tokenResult.status !== 200) {
        throw new Error(`Failed to refresh token: ${tokenResult.status} ${tokenResult.data?.error_description || ''}`);
      }

      const { access_token, expires_in, id_token } = tokenResult.data;

      if (!access_token) {
        throw new Error('Invalid refresh response: missing access token');
      }

      const expiresAt = (Date.now() + Number(expires_in) * 1000).toString();

      const newTokenData: TokenData = {
        access_token,
        refresh_token: refreshTokenResult.value, // Keep the same refresh token
        id_token: id_token || '',
        expires_at: expiresAt,
      };

      // Store updated tokens
      await this.storeTokens(newTokenData);

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: newTokenData,
      };
    } catch (e: any) {
      console.error('Refresh token error:', e);
      return {
        success: false,
        message: e.message,
        data: undefined,
      };
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(): Promise<ServiceResponse<string>> {
    try {
      const tokenData = await this.getStoredTokens();
      if (!tokenData) {
        return {
          success: false,
          message: 'No tokens stored',
        };
      }

      // Check if token is still valid (with 5 minute buffer)
      const now = Date.now();
      const expiresAt = Number(tokenData.expires_at);
      const bufferTime = 5 * 60 * 1000; // 5 minutes

      if (now + bufferTime < expiresAt) {
        // Token is still valid
        return {
          success: true,
          message: 'Token is valid',
          data: tokenData.access_token,
        };
      }

      // Token is expired or about to expire, refresh it
      const refreshResult = await this.refreshToken();
      if (refreshResult.success && refreshResult.data) {
        return {
          success: true,
          message: 'Token refreshed and returned',
          data: refreshResult.data.access_token,
        };
      }

      return {
        success: false,
        message: 'Failed to refresh token',
      };
    } catch (e: any) {
      console.error('Get valid access token error:', e);
      return {
        success: false,
        message: e.message,
      };
    }
  }

  /**
   * Validate access token with Google
   */
  async validateAccessToken(accessToken?: string): Promise<ServiceResponse<boolean>> {
    try {
      const token = accessToken || (await this.getStoredTokens())?.access_token;
      if (!token) {
        return {
          success: false,
          message: 'No access token available',
          data: false,
        };
      }

      const response = await CapacitorHttp.get({
        url: `${this.GOOGLE_TOKEN_INFO_URL}?access_token=${encodeURIComponent(token)}`,
      });

      const isValid = response.status === 200 && response.data?.expires_in > 0;

      return {
        success: true,
        message: isValid ? 'Token is valid' : 'Token is invalid',
        data: isValid,
      };
    } catch (e: any) {
      console.error('Validate access token error:', e);
      return {
        success: false,
        message: e.message,
        data: false,
      };
    }
  }

  async logout(): Promise<ServiceResponse> {
    try {
      // Optionally revoke token with Google
      const tokenData = await this.getStoredTokens();
      if (tokenData?.access_token) {
        try {
          await CapacitorHttp.post({
            url: `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(tokenData.access_token)}`,
          });
        } catch (e) {
          console.warn('Failed to revoke token with Google:', e);
          // Continue with logout even if revocation fails
        }
      }

      // Clear stored tokens
      await Promise.all([
        SecureStoragePlugin.remove({ key: 'access_token' }).catch(() => {}),
        SecureStoragePlugin.remove({ key: 'refresh_token' }).catch(() => {}),
        SecureStoragePlugin.remove({ key: 'id_token' }).catch(() => {}),
        Preferences.remove({ key: 'expires_at' }),
      ]);

      return {
        success: true,
        message: 'Logout successfully',
      };
    } catch (e: any) {
      console.error('Logout error:', e);
      return {
        success: false,
        message: e.message,
      };
    }
  }

  /**
   * Check if user is logged in and has valid tokens
   */
  async isLoggedIn(): Promise<ServiceResponse<boolean>> {
    try {
      const tokenData = await this.getStoredTokens();
      if (!tokenData) {
        return {
          success: true,
          message: 'No tokens stored',
          data: false,
        };
      }

      // Check if refresh token exists (most important for login status)
      if (!tokenData.refresh_token) {
        return {
          success: true,
          message: 'No refresh token available',
          data: false,
        };
      }

      // Check if access token is still valid or can be refreshed
      const now = Date.now();
      const expiresAt = Number(tokenData.expires_at);

      if (now < expiresAt) {
        // Token is still valid
        return {
          success: true,
          message: 'User is logged in with valid token',
          data: true,
        };
      }

      // Token is expired, try to refresh
      const refreshResult = await this.refreshToken();
      return {
        success: true,
        message: refreshResult.success ? 'User is logged in (token refreshed)' : 'User login expired',
        data: refreshResult.success,
      };
    } catch (e: any) {
      console.error('Check login status error:', e);
      return {
        success: false,
        message: e.message,
        data: false,
      };
    }
  }

  /**
   * Get user info from Google using access token
   */
  async getUserInfo(): Promise<ServiceResponse<any>> {
    try {
      const tokenResult = await this.getValidAccessToken();
      if (!tokenResult.success || !tokenResult.data) {
        return {
          success: false,
          message: 'No valid access token available',
        };
      }

      const response = await CapacitorHttp.get({
        url: 'https://www.googleapis.com/oauth2/v2/userinfo',
        headers: {
          Authorization: `Bearer ${tokenResult.data}`,
        },
      });

      if (response.status !== 200) {
        throw new Error(`Failed to get user info: ${response.status}`);
      }

      return {
        success: true,
        message: 'User info retrieved successfully',
        data: response.data,
      };
    } catch (e: any) {
      console.error('Get user info error:', e);
      return {
        success: false,
        message: e.message,
      };
    }
  }
}

export const googleAuth = new GoogleAuth();
