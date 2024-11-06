import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alr.spendwise',
  appName: 'SpendWise',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    GoogleAuth: {
      clientId: "292298338560-pags40si86ac2o49jjthi6e23c7b1tsl.apps.googleusercontent.com",
      androidClientId: "292298338560-sv8gp6tbnvrm16epr6gj10h9ahiv8erh.apps.googleusercontent.com"
    }
  }
};

export default config;