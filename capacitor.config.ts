import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.understandable.app',
  appName: 'Understandable',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
    scrollEnabled: true,
    backgroundColor: '#0a0a0a',
  },
};

export default config;
