import { CapacitorConfig } from '@capacitor/cli';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const config: CapacitorConfig = {
  appId: 'com.alr.spendwise',
  appName: 'SpendWise',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      overlaysWebView: false,
    },
    SplashScreen: {
      launchShowDuration: 0,
    },
    CapacitorHttp: {
      enabled: true,
    },
    CapacitorSQLite: {
      androidIsEncryption: true,
      androidBiometric: {
        biometricAuth: false,
        biometricTitle: 'Biometric login for capacitor sqlite',
        biometricSubTitle: 'Log in using your biometric',
        androidDatabaseLocation: 'default',
      },
    },
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
    buildOptions: {
      keystorePath: path.resolve(__dirname, 'release-key.jks'),
      keystoreAlias: process.env.ANDROID_KEY_ALIAS,
      keystorePassword: process.env.ANDROID_KEYSTORE_PASSWORD,
      releaseType: 'APK',
      signingType: 'apksigner',
    },
  },
};

export default config;
