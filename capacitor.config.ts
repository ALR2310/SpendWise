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
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
    buildOptions: {
      keystorePath: './src/assets/debug.keystore',
      keystoreAlias: 'androiddebugkey',
      keystorePassword: 'android',
      keystoreAliasPassword: 'android',
      releaseType: 'APK',
      signingType: 'apksigner',
    },
  },
};

export default config;
