import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ziteo.app',
  appName: 'Ziteo',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  ios: {
    backgroundColor: '#F8F6F2',
  },
  android: {
    backgroundColor: '#F8F6F2',
  },
};

export default config;
