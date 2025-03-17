import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alr.spendwise',
  appName: 'SpendWise',
  webDir: 'dist',
  plugins: {
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
      keystorePath: 'D:\\Tools\\Android\\.android\\debug.keystore',
      keystoreAlias: 'androiddebugkey',
      keystorePassword: 'android',
      keystoreAliasPassword: 'android',
      releaseType: 'APK',
      signingType: 'apksigner',
    },
  },
};

export default config;
